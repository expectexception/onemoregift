'use strict';

// User-submitted media arrives as URL strings that later get rendered into <img>,
// <video> and <a href> on public pages. Anything that isn't a plain uploaded path
// or an http(s) URL: `javascript:`, `data:`, protocol-relative `//evil.tld`, must
// never reach the database, so every submit path funnels through here.

const MAX_URL_LENGTH = 500;

const isSafeUrl = (value) => {
    if (typeof value !== 'string') return false;
    const url = value.trim();
    if (!url || url.length > MAX_URL_LENGTH) return false;

    // Uploaded assets are served from our own /media and /uploads mounts
    if (url.startsWith('/')) return !url.startsWith('//');

    return /^https?:\/\/[^\s]+$/i.test(url);
};

// Plain array of URL strings (surprise documents, moment proofs)
const sanitizeUrlList = (input, max = 10) => {
    if (!Array.isArray(input)) return [];
    return input
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(isSafeUrl)
        .slice(0, max);
};

// Array of { url, type, thumbnail } media objects (happy moments)
const sanitizeMediaList = (input, max = 10) => {
    if (!Array.isArray(input)) return [];
    return input
        .map((item) => {
            const url = typeof item?.url === 'string' ? item.url.trim() : '';
            if (!isSafeUrl(url)) return null;
            const thumbnail = typeof item?.thumbnail === 'string' ? item.thumbnail.trim() : '';
            return {
                url,
                type: item?.type === 'video' ? 'video' : 'image',
                ...(isSafeUrl(thumbnail) ? { thumbnail } : {}),
            };
        })
        .filter(Boolean)
        .slice(0, max);
};

module.exports = { isSafeUrl, sanitizeUrlList, sanitizeMediaList };
