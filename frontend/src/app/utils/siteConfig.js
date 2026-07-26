import api from "./apiClient";

// Shared, memoized site-config fetch. Several components (navbar, homepage
// sections, shop pages, checkout) need the public config, without this each
// mounted component fired its own /config request on every page load.
const TTL_MS = 30 * 1000;

let cached = null;
let cachedAt = 0;
let inflight = null;

export async function fetchSiteConfig() {
    if (cached && Date.now() - cachedAt < TTL_MS) return cached;
    if (inflight) return inflight;

    inflight = api.get("config")
        .then(({ data }) => {
            if (data && !data.error && data.config) {
                cached = data.config;
                cachedAt = Date.now();
            }
            return cached || {};
        })
        .catch(() => cached || {})
        .finally(() => { inflight = null; });

    return inflight;
}

// For flows that just changed a setting (admin) and need a fresh read
export function invalidateSiteConfig() {
    cached = null;
    cachedAt = 0;
}

// ---- Weekly drop schedule helpers -------------------------------------------
// The drop days are admin-editable, so nothing in the UI may hardcode "Fri–Sat".
// The backend sends both the raw CSV day numbers and pre-formatted labels.

export const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseDropDays(raw, fallback = []) {
    const days = String(raw ?? "")
        .split(",")
        .map((part) => Number(String(part).trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    return days.length ? [...new Set(days)] : fallback;
}

// Human label for a phase, e.g. "Fri, Sat": falls back to the stock schedule
export function dropDaysLabel(config, phase) {
    const fallbacks = { pickup: "Mon, Tue", reveal: "Wed, Thu", sale: "Fri, Sat", prep: "Sun" };
    return config?.shopPhases?.[phase]?.days || fallbacks[phase] || "";
}

// Next N upcoming calendar dates that fall on one of the given weekdays
export function nextDatesForDays(dayNumbers, count = 2) {
    const days = dayNumbers.length ? dayNumbers : [1, 2];
    const out = [];
    const today = new Date();
    for (let i = 1; i <= 14 && out.length < count; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        if (days.includes(d.getDay())) out.push(d);
    }
    return out;
}
