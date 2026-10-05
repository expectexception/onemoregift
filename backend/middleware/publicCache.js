'use strict';

// Short-lived in-memory cache for public GET endpoints. Each of these hits
// MongoDB Atlas (~70-150 ms from the server) while most visitors ask for the
// same lists, so answering from memory for a few seconds removes that wait.
//
// Any successful write anywhere clears the whole cache (see clearPublicCacheOnWrite),
// so admin edits, new orders and giveaway joins show up immediately. The
// backend runs as a single process, so there is no other instance to notify.

// Off in tests (they stub models per test) unless a test sets the TTL itself.
const TTL_MS = Number(process.env.PUBLIC_CACHE_TTL_MS ?? (process.env.NODE_ENV === 'test' ? 0 : 30000));
const MAX_ENTRIES = 500;
const store = new Map(); // originalUrl -> { body: string, expires: number }

// Requests carrying a user login may get a personalized response (e.g. the
// `joined` flag on giveaways), which must never be shared between visitors.
const hasUserCredentials = (req) =>
    Boolean(req.header('Authorization') || req.cookies?.user_token);

const publicCache = ({ anonymousOnly = false } = {}) => (req, res, next) => {
    if (req.method !== 'GET' || TTL_MS <= 0) return next();
    if (anonymousOnly && hasUserCredentials(req)) return next();

    const key = req.originalUrl;
    const hit = store.get(key);
    if (hit && hit.expires > Date.now()) {
        res.set('X-Cache', 'HIT');
        return res.type('application/json').send(hit.body);
    }

    const json = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode === 200) {
            if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
            store.set(key, { body: JSON.stringify(body), expires: Date.now() + TTL_MS });
        }
        res.set('X-Cache', 'MISS');
        return json(body);
    };
    next();
};

const clearPublicCacheOnWrite = (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    res.on('finish', () => {
        if (res.statusCode < 400) store.clear();
    });
    next();
};

module.exports = { publicCache, clearPublicCacheOnWrite, _store: store };
