'use strict';

const SystemConfig = require('../model/SystemConfig');

// Env default helpers: env acts as the default; a SystemConfig row (set from the
// admin panel) overrides it live without a server restart.
const envBool = (name, fallback) => {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    return String(raw).toLowerCase() === 'true';
};
const envStr = (name, fallback = '') => {
    const raw = process.env[name];
    return raw === undefined ? fallback : String(raw).trim();
};

// Weekly drop cycle phases. Which weekday belongs to which phase is admin-editable
// (dropRevealDays / dropSaleDays / dropPickupDays). Any day left unassigned falls
// through to "prep".
const SHOP_PHASES = {
    pickup: { key: 'pickup', label: 'Order Pickup' },
    reveal: { key: 'reveal', label: 'Product & Price Reveal' },
    sale: { key: 'sale', label: 'Sale Live' },
    prep: { key: 'prep', label: 'Preparing Orders' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "3,4" -> [3,4]; junk and out-of-range values are dropped
const parseDays = (raw, fallback) => {
    const days = String(raw ?? '')
        .split(',')
        .map(part => Number(String(part).trim()))
        .filter(n => Number.isInteger(n) && n >= 0 && n <= 6);
    return days.length ? [...new Set(days)] : fallback;
};

const formatDays = (days) => {
    if (!days.length) return '-';
    return days.map(d => DAY_NAMES[d]).join(', ');
};

const getISTDay = (date = new Date()) =>
    new Date(date.getTime() + 5.5 * 60 * 60 * 1000).getUTCDay(); // 0=Sun … 6=Sat

// Phase for a given day, using the admin-configured day map. An admin can pin the
// phase (`forcedShopPhase`) to open a sale early or hold one back without having to
// rewrite the weekly schedule.
const resolvePhase = (config, date = new Date()) => {
    const forced = String(config.forcedShopPhase || '').trim();
    if (SHOP_PHASES[forced]) return forced;

    const day = getISTDay(date);
    if (parseDays(config.dropSaleDays, [5, 6]).includes(day)) return 'sale';
    if (parseDays(config.dropRevealDays, [3, 4]).includes(day)) return 'reveal';
    if (parseDays(config.dropPickupDays, [1, 2]).includes(day)) return 'pickup';
    return 'prep';
};

// Boolean toggles: DB value ?? env default
const BOOL_KEYS = {
    showUpcoming: () => true,
    showEnded: () => false,
    requireSurpriseProof: () => true,
    requireMomentProof: () => true,
    homeShowSteps: () => true,
    homeShowStats: () => true,
    homeShowMoments: () => true,
    homeShowShop: () => true,
    shopEnabled: () => envBool('ENABLE_SHOP', true),
    paymentGatewayEnabled: () => envBool('ENABLE_PAYMENT_GATEWAY', envBool('ENABLE_REAL_PAYMENTS', false)),
    qrPaymentEnabled: () => envBool('ENABLE_QR_PAYMENTS', true),
    codEnabled: () => envBool('ENABLE_COD', true),
    weeklyDropEnabled: () => envBool('SHOP_WEEKLY_DROP', true),
    surpriseOneActivePerUser: () => envBool('SURPRISE_ONE_ACTIVE_PER_USER', true),
    // Whole-feature kill switches
    giveawaysEnabled: () => envBool('ENABLE_GIVEAWAYS', true),
    momentsEnabled: () => envBool('ENABLE_MOMENTS', true),
    surpriseEnabled: () => envBool('ENABLE_SURPRISE', true),
    // Site-wide announcement bar and maintenance mode
    announcementEnabled: () => false,
    maintenanceMode: () => envBool('MAINTENANCE_MODE', false),
};

// Numeric settings: DB value ?? env default
const NUMBER_KEYS = {
    // Auto-cancel unpaid pending orders after N hours (restores stock). 0 = off.
    orderAutoCancelHours: () => {
        const n = Number(process.env.ORDER_AUTO_CANCEL_HOURS);
        return Number.isFinite(n) && n >= 0 ? n : 24;
    },
    // Hours a customer gets to upload payment proof before the order is chased/cancelled.
    paymentProofWindowHours: () => {
        const n = Number(process.env.PAYMENT_PROOF_WINDOW_HOURS);
        return Number.isFinite(n) && n >= 0 ? n : 6;
    },
    // Cap on units of a single product in one order: keeps a limited drop from being
    // cleared out by one buyer. 0 = no cap.
    shopMaxQtyPerOrder: () => {
        const n = Number(process.env.SHOP_MAX_QTY_PER_ORDER);
        return Number.isFinite(n) && n >= 0 ? n : 5;
    },
};

// String settings: DB value ?? env default
const STRING_KEYS = {
    paymentUpiId: () => envStr('PAYMENT_UPI_ID'),
    paymentPayeeName: () => envStr('PAYMENT_PAYEE_NAME', 'OneMoreGift'),
    paymentWhatsapp: () => envStr('PAYMENT_WHATSAPP'),
    paymentQrImage: () => '',
    paymentInstructions: () => envStr(
        'PAYMENT_INSTRUCTIONS',
        'Pay on the QR, then send your order number with the payment screenshot on WhatsApp and upload the proof here. We verify and confirm your order.'
    ),
    // Weekly drop schedule: CSV weekday numbers (0=Sun … 6=Sat)
    dropPickupDays: () => envStr('DROP_PICKUP_DAYS', '1,2'),
    dropRevealDays: () => envStr('DROP_REVEAL_DAYS', '3,4'),
    dropSaleDays: () => envStr('DROP_SALE_DAYS', '5,6'),
    // Public contact details (footer, order emails, help sections)
    contactEmail: () => envStr('CONTACT_EMAIL', 'contact@onemoregift.in'),
    contactPhone: () => envStr('CONTACT_PHONE'),
    contactWhatsapp: () => envStr('CONTACT_WHATSAPP'),
    businessAddress: () => envStr('BUSINESS_ADDRESS'),
    instagramUrl: () => envStr('INSTAGRAM_URL'),
    // Pin the drop cycle to one phase; '' follows the weekday schedule
    forcedShopPhase: () => '',
    // Site-wide announcement bar
    announcementText: () => '',
    announcementLink: () => '',
    // Shown while maintenance mode is on
    maintenanceMessage: () => envStr(
        'MAINTENANCE_MESSAGE',
        'We are doing a quick bit of maintenance and will be back shortly. Thanks for your patience!'
    ),
    // Homepage hero copy
    heroTitle: () => '',
    heroSubtitle: () => '',
};

// In-process cache: config is read on every hot request (public config endpoint,
// requireShopEnabled middleware, order creation, giveaway listing). Without it every
// read was a full DB roundtrip (500-1800ms against Atlas in the logs).
const CONFIG_CACHE_TTL_MS = 15 * 1000;
let _configCache = null;
let _configCacheAt = 0;

const invalidateConfigCache = () => {
    _configCache = null;
    _configCacheAt = 0;
};

// Phase and the day labels derived from it are time-dependent, so they are stamped
// onto every read rather than cached with the rest of the config.
const withDerived = (config) => {
    const pickup = parseDays(config.dropPickupDays, [1, 2]);
    const reveal = parseDays(config.dropRevealDays, [3, 4]);
    const sale = parseDays(config.dropSaleDays, [5, 6]);
    // Prep isn't configured directly. It is whatever the other three windows leave over
    const claimed = new Set([...pickup, ...reveal, ...sale]);
    const prep = [0, 1, 2, 3, 4, 5, 6].filter(day => !claimed.has(day));

    return {
        ...config,
        shopPhase: resolvePhase(config),
        phaseIsForced: !!SHOP_PHASES[String(config.forcedShopPhase || '').trim()],
        shopPhases: {
            pickup: { ...SHOP_PHASES.pickup, days: formatDays(pickup) },
            reveal: { ...SHOP_PHASES.reveal, days: formatDays(reveal) },
            sale: { ...SHOP_PHASES.sale, days: formatDays(sale) },
            prep: { ...SHOP_PHASES.prep, days: formatDays(prep) },
        },
    };
};

const getConfigHelper = async () => {
    if (_configCache && Date.now() - _configCacheAt < CONFIG_CACHE_TTL_MS) {
        return withDerived(_configCache);
    }

    const configs = await SystemConfig.find({}).lean();
    const byKey = new Map(configs.map(c => [c.key, c.value]));

    const config = {};
    for (const [key, getDefault] of Object.entries(BOOL_KEYS)) {
        const stored = byKey.get(key);
        config[key] = stored === undefined ? getDefault() : !!stored;
    }
    for (const [key, getDefault] of Object.entries(STRING_KEYS)) {
        const stored = byKey.get(key);
        config[key] = stored === undefined ? getDefault() : String(stored);
    }
    for (const [key, getDefault] of Object.entries(NUMBER_KEYS)) {
        const stored = Number(byKey.get(key));
        config[key] = Number.isFinite(stored) && stored >= 0 ? stored : getDefault();
    }

    // Read-only / computed values
    config.realPaymentsEnabled = envBool('ENABLE_REAL_PAYMENTS', false);
    config.paymentsProvider = envStr('PAYMENTS_PROVIDER', 'sandbox').toLowerCase();
    // A real gateway is only "ready" when a non-sandbox provider is wired up AND
    // switched on in env. Until then the online-payment toggle can be turned on in
    // the admin panel but checkout must not treat it as a way to complete a payment.
    config.onlinePaymentReady = config.paymentsProvider !== 'sandbox' && config.realPaymentsEnabled;
    // Sandbox "mark as paid" shortcut: a developer convenience that must never be
    // reachable on the live site, where it would hand out free orders.
    config.sandboxPaymentsAllowed = process.env.NODE_ENV !== 'production'
        && config.paymentsProvider === 'sandbox'
        && envBool('ALLOW_SANDBOX_PAYMENTS', true);

    _configCache = config;
    _configCacheAt = Date.now();
    return withDerived(config);
};

const getPublicConfig = async (req, res) => {
    try {
        const config = await getConfigHelper();
        return res.status(200).json({ error: false, config });
    } catch (error) {
        console.error('Failed to get public config:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getAdminConfig = async (req, res) => {
    try {
        const config = await getConfigHelper();
        return res.status(200).json({ error: false, config });
    } catch (error) {
        console.error('Failed to get admin config:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

// Day-map settings are stored as strings but must stay parseable, and the three
// windows must not overlap. Otherwise a day would resolve to two phases at once.
const DAY_KEYS = ['dropPickupDays', 'dropRevealDays', 'dropSaleDays'];

const validateDayWindows = (updates, current) => {
    const resolved = {};
    for (const key of DAY_KEYS) {
        const raw = updates[key] !== undefined ? updates[key] : current[key];
        const days = parseDays(raw, null);
        if (days === null) {
            return { error: `${key} must list at least one weekday (0=Sun … 6=Sat)` };
        }
        resolved[key] = days;
    }

    const seen = new Map();
    for (const key of DAY_KEYS) {
        for (const day of resolved[key]) {
            if (seen.has(day)) {
                return { error: `${DAY_NAMES[day]} is assigned to both ${seen.get(day)} and ${key}` };
            }
            seen.set(day, key);
        }
    }
    return { values: resolved };
};

const updateConfig = async (req, res) => {
    try {
        const updates = req.body || {};

        // A typo here would pin the shop into a phase that resolves to nothing
        if (updates.forcedShopPhase !== undefined) {
            const forced = String(updates.forcedShopPhase || '').trim();
            if (forced && !SHOP_PHASES[forced]) {
                return res.status(400).json({
                    error: true,
                    msg: `forcedShopPhase must be empty (follow the schedule) or one of: ${Object.keys(SHOP_PHASES).join(', ')}`,
                });
            }
            updates.forcedShopPhase = forced;
        }

        if (DAY_KEYS.some(key => updates[key] !== undefined)) {
            const current = await getConfigHelper();
            const check = validateDayWindows(updates, current);
            if (check.error) {
                return res.status(400).json({ error: true, msg: check.error });
            }
            // Store the normalised form so a stray "3, 4," never reaches the readers
            for (const key of DAY_KEYS) {
                if (updates[key] !== undefined) updates[key] = check.values[key].join(',');
            }
        }

        for (const key of Object.keys(BOOL_KEYS)) {
            if (updates[key] !== undefined) {
                await SystemConfig.findOneAndUpdate(
                    { key },
                    { value: !!updates[key] },
                    { upsert: true, new: true }
                );
            }
        }

        for (const key of Object.keys(STRING_KEYS)) {
            if (updates[key] !== undefined) {
                const value = String(updates[key]).trim().slice(0, 500);
                await SystemConfig.findOneAndUpdate(
                    { key },
                    { value },
                    { upsert: true, new: true }
                );
            }
        }

        for (const key of Object.keys(NUMBER_KEYS)) {
            if (updates[key] !== undefined) {
                const value = Number(updates[key]);
                if (Number.isFinite(value) && value >= 0) {
                    await SystemConfig.findOneAndUpdate(
                        { key },
                        { value },
                        { upsert: true, new: true }
                    );
                }
            }
        }

        invalidateConfigCache();
        const config = await getConfigHelper();
        return res.status(200).json({ error: false, config, msg: 'Config updated successfully' });
    } catch (error) {
        console.error('Failed to update config:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = {
    getConfigHelper,
    getPublicConfig,
    getAdminConfig,
    updateConfig,
    getISTDay,
    parseDays,
    resolvePhase,
    invalidateConfigCache,
};
