'use strict';

// Every public counter can be left on the live figure, pinned to a number the
// admin types in, or hidden entirely. A brand new site legitimately wants to hide
// "0 winners" rather than advertise it, and a launch campaign sometimes needs a
// figure that counts things the database does not know about (offline events,
// gifts handed out before the site existed).
//
// Stored as one SystemConfig row holding an object, so adding a counter later does
// not need a schema change.

const STAT_KEYS = [
    { key: 'registeredUsers', label: 'Registered users' },
    { key: 'totalGiveaways', label: 'Giveaways hosted' },
    { key: 'activeGiveaways', label: 'Active giveaways' },
    { key: 'upcomingGiveaways', label: 'Upcoming giveaways' },
    { key: 'completedGiveaways', label: 'Giveaways closed' },
    { key: 'totalWinners', label: 'Gifts and wins delivered' },
    { key: 'giveawayWinners', label: 'Giveaway winners' },
    { key: 'giftsDelivered', label: 'Surprise gifts delivered' },
    { key: 'momentsShared', label: 'Happy moments shared' },
    { key: 'ordersCompleted', label: 'Shop orders collected' },
    { key: 'totalPrizeValue', label: 'Total prize value (₹)' },
    { key: 'verifiedDrawRate', label: 'Results declared (%)' },
];

const VALID_MODES = new Set(['auto', 'manual', 'hidden']);
const KEY_SET = new Set(STAT_KEYS.map(s => s.key));

// Drops unknown keys and coerces each entry into { mode, value }
const normalizeOverrides = (raw) => {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;

    for (const [key, entry] of Object.entries(raw)) {
        if (!KEY_SET.has(key) || !entry || typeof entry !== 'object') continue;

        const mode = VALID_MODES.has(entry.mode) ? entry.mode : 'auto';
        if (mode === 'auto') continue; // auto is the default, no need to store it

        const value = Number(entry.value);
        if (mode === 'manual' && (!Number.isFinite(value) || value < 0)) continue;

        out[key] = mode === 'manual'
            ? { mode, value: Math.floor(value) }
            : { mode };
    }
    return out;
};

/**
 * Applies the admin's choices to a freshly computed stats object.
 * Returns the adjusted stats plus a `statsHidden` map the UI uses to skip tiles,
 * and `statsManual` so an admin looking at the site knows what is pinned.
 */
const applyOverrides = (stats, rawOverrides) => {
    const overrides = normalizeOverrides(rawOverrides);
    const result = { ...stats };
    const hidden = {};
    const manual = {};

    for (const [key, entry] of Object.entries(overrides)) {
        if (entry.mode === 'hidden') {
            hidden[key] = true;
        } else if (entry.mode === 'manual') {
            result[key] = entry.value;
            manual[key] = true;
        }
    }

    result.statsHidden = hidden;
    result.statsManual = manual;
    return result;
};

module.exports = { STAT_KEYS, VALID_MODES, normalizeOverrides, applyOverrides };
