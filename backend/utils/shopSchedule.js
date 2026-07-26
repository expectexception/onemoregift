'use strict';

// Works out whether the shop is open for orders at a given moment, and when it
// next opens or closes. Everything is reasoned about in IST, because that is the
// timezone the business actually runs on and the server may be anywhere.
//
// Precedence, highest first:
//   1. forcedShopPhase          admin pins a stage by hand
//   2. shopClosedDates          a specific date is blacked out (holiday)
//   3. shopOpenDates            a specific date is opened as a one-off drop
//   4. the weekly day map       dropSaleDays / dropRevealDays / dropPickupDays
// A sale day is only actually open between saleStartTime and saleEndTime.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINUTES_PER_DAY = 24 * 60;

const SHOP_PHASES = {
    pickup: { key: 'pickup', label: 'Order Pickup' },
    reveal: { key: 'reveal', label: 'Product & Price Reveal' },
    sale: { key: 'sale', label: 'Sale Live' },
    prep: { key: 'prep', label: 'Preparing Orders' },
};

// ---------------------------------------------------------------- parsing

const parseDays = (raw, fallback) => {
    const days = String(raw ?? '')
        .split(',')
        .map(part => Number(String(part).trim()))
        .filter(n => Number.isInteger(n) && n >= 0 && n <= 6);
    return days.length ? [...new Set(days)].sort((a, b) => a - b) : fallback;
};

const formatDays = (days) => (days.length ? days.map(d => DAY_NAMES[d]).join(', ') : '-');

// "20:00" -> 1200 minutes past midnight. Invalid input falls back.
const parseTime = (raw, fallback) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(raw ?? '').trim());
    if (!match) return fallback;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return fallback;
    return h * 60 + m;
};

const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 12-hour label for humans, e.g. "8:00 PM"
const formatTimeLabel = (minutes) => {
    const h24 = Math.floor(minutes / 60);
    const m = minutes % 60;
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};

// Comma or newline separated YYYY-MM-DD list
const parseDates = (raw) => {
    const seen = new Set();
    String(raw ?? '')
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s))
        .forEach(s => seen.add(s));
    return [...seen].sort();
};

// ---------------------------------------------------------------- IST helpers

// The wall-clock date and minute-of-day in IST for a given instant
const istParts = (date = new Date()) => {
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    return {
        dateKey: shifted.toISOString().slice(0, 10),
        weekday: shifted.getUTCDay(),
        minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    };
};

// Turn an IST wall-clock date + minute-of-day back into a real instant
const istToInstant = (dateKey, minutes) => {
    const base = Date.parse(`${dateKey}T00:00:00.000Z`);
    return new Date(base + minutes * 60 * 1000 - IST_OFFSET_MS);
};

const addDaysToKey = (dateKey, days) => {
    const d = new Date(Date.parse(`${dateKey}T00:00:00.000Z`) + days * 86400000);
    return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------- schedule

const readSchedule = (config = {}) => ({
    saleDays: parseDays(config.dropSaleDays, [5, 6]),
    revealDays: parseDays(config.dropRevealDays, [3, 4]),
    pickupDays: parseDays(config.dropPickupDays, [1, 2]),
    // A 00:00 to 23:59 window means "all day", which is how it behaved before times existed
    startMin: parseTime(config.saleStartTime, 0),
    endMin: parseTime(config.saleEndTime, MINUTES_PER_DAY - 1),
    closedDates: parseDates(config.shopClosedDates),
    openDates: parseDates(config.shopOpenDates),
    forced: SHOP_PHASES[String(config.forcedShopPhase || '').trim()]
        ? String(config.forcedShopPhase).trim()
        : '',
});

// Is this calendar date a selling day at all, ignoring the time of day?
const isSaleDate = (s, dateKey, weekday) => {
    if (s.closedDates.includes(dateKey)) return false;
    if (s.openDates.includes(dateKey)) return true;
    return s.saleDays.includes(weekday);
};

const withinWindow = (s, minutes) => minutes >= s.startMin && minutes <= s.endMin;

/**
 * The phase the shop is in right now. `sale` only when both the date and the
 * time of day qualify.
 */
const resolvePhase = (config, date = new Date()) => {
    const s = readSchedule(config);
    if (s.forced) return s.forced;

    const { dateKey, weekday, minutes } = istParts(date);

    if (isSaleDate(s, dateKey, weekday)) {
        if (withinWindow(s, minutes)) return 'sale';
        // On a sale day but outside the hours: before opening it is still the
        // reveal build-up, after closing the orders are being prepared.
        return minutes < s.startMin ? 'reveal' : 'prep';
    }

    if (s.closedDates.includes(dateKey)) return 'prep';
    if (s.revealDays.includes(weekday)) return 'reveal';
    if (s.pickupDays.includes(weekday)) return 'pickup';
    return 'prep';
};

const isShopOpen = (config, date = new Date()) => resolvePhase(config, date) === 'sale';

/**
 * The next instant the sale opens, scanning forward up to 60 days. Returns null
 * if the schedule never opens (no sale days and no one-off open dates), or if an
 * admin has pinned the phase, in which case a countdown would be a lie.
 */
const nextSaleOpen = (config, from = new Date()) => {
    const s = readSchedule(config);
    if (s.forced) return null;

    const { dateKey, weekday, minutes } = istParts(from);

    // Later today, if today qualifies and we have not reached the opening time
    if (isSaleDate(s, dateKey, weekday) && minutes < s.startMin) {
        return istToInstant(dateKey, s.startMin);
    }

    for (let i = 1; i <= 60; i++) {
        const key = addDaysToKey(dateKey, i);
        const wd = new Date(Date.parse(`${key}T00:00:00.000Z`)).getUTCDay();
        if (isSaleDate(s, key, wd)) return istToInstant(key, s.startMin);
    }
    return null;
};

/** When the current sale window closes. Null when the shop is not open. */
const currentSaleClose = (config, from = new Date()) => {
    const s = readSchedule(config);
    if (s.forced || !isShopOpen(config, from)) return null;
    const { dateKey } = istParts(from);
    return istToInstant(dateKey, s.endMin);
};

// Human summary for the UI, e.g. "Fri, Sat, 8:00 PM to 11:59 PM"
const describeSaleWindow = (config) => {
    const s = readSchedule(config);
    const days = formatDays(s.saleDays);
    const allDay = s.startMin === 0 && s.endMin >= MINUTES_PER_DAY - 1;
    return allDay ? days : `${days}, ${formatTimeLabel(s.startMin)} to ${formatTimeLabel(s.endMin)}`;
};

module.exports = {
    SHOP_PHASES,
    DAY_NAMES,
    IST_OFFSET_MS,
    parseDays,
    formatDays,
    parseTime,
    formatTime,
    formatTimeLabel,
    parseDates,
    istParts,
    istToInstant,
    readSchedule,
    resolvePhase,
    isShopOpen,
    nextSaleOpen,
    currentSaleClose,
    describeSaleWindow,
};
