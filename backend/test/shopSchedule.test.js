'use strict';

const test = require('node:test');
const assert = require('node:assert');
const s = require('../utils/shopSchedule');

// Build an instant from an IST wall clock, so the assertions read in the
// timezone the business actually runs on.
const ist = (dateKey, hhmm) => s.istToInstant(dateKey, s.parseTime(hhmm, 0));

// 2026-07-29 Wed, 2026-07-30 Thu, 2026-07-31 Fri, 2026-08-01 Sat
const FRI_8PM = { dropSaleDays: '5,6', saleStartTime: '20:00', saleEndTime: '23:00' };

test('sale window respects the time of day, not just the weekday', () => {
    assert.equal(s.isShopOpen(FRI_8PM, ist('2026-07-31', '19:59')), false);
    assert.equal(s.isShopOpen(FRI_8PM, ist('2026-07-31', '20:00')), true);
    assert.equal(s.isShopOpen(FRI_8PM, ist('2026-07-31', '23:00')), true);
    assert.equal(s.isShopOpen(FRI_8PM, ist('2026-07-31', '23:01')), false);
    assert.equal(s.isShopOpen(FRI_8PM, ist('2026-07-30', '21:00')), false, 'Thursday is not a sale day');
});

test('a sale day reads as reveal before opening and prep after closing', () => {
    assert.equal(s.resolvePhase(FRI_8PM, ist('2026-07-31', '10:00')), 'reveal');
    assert.equal(s.resolvePhase(FRI_8PM, ist('2026-07-31', '23:30')), 'prep');
});

test('countdown points at the next opening', () => {
    assert.equal(
        s.nextSaleOpen(FRI_8PM, ist('2026-07-31', '10:00')).toISOString(),
        ist('2026-07-31', '20:00').toISOString(),
        'later the same day',
    );
    assert.equal(
        s.nextSaleOpen(FRI_8PM, ist('2026-07-29', '10:00')).toISOString(),
        ist('2026-07-31', '20:00').toISOString(),
        'from Wednesday it is Friday',
    );
    assert.equal(s.currentSaleClose(FRI_8PM, ist('2026-07-30', '21:00')), null, 'no close time while shut');
});

test('a blacked-out date closes the shop and pushes the countdown on', () => {
    const cfg = { ...FRI_8PM, shopClosedDates: '2026-07-31' };
    assert.equal(s.isShopOpen(cfg, ist('2026-07-31', '21:00')), false);
    assert.equal(
        s.nextSaleOpen(cfg, ist('2026-07-31', '10:00')).toISOString(),
        ist('2026-08-01', '20:00').toISOString(),
    );
});

test('a one-off open date sells on a normally closed day, still within hours', () => {
    const cfg = { ...FRI_8PM, shopOpenDates: '2026-07-29' };
    assert.equal(s.isShopOpen(cfg, ist('2026-07-29', '21:00')), true);
    assert.equal(s.isShopOpen(cfg, ist('2026-07-29', '19:00')), false);
});

test('a closed date beats an open date for the same day', () => {
    const cfg = { ...FRI_8PM, shopOpenDates: '2026-07-29', shopClosedDates: '2026-07-29' };
    assert.equal(s.isShopOpen(cfg, ist('2026-07-29', '21:00')), false);
});

test('without times configured the shop stays open all day, as before', () => {
    const legacy = { dropSaleDays: '5,6' };
    assert.equal(s.isShopOpen(legacy, ist('2026-07-31', '00:30')), true);
    assert.equal(s.isShopOpen(legacy, ist('2026-07-31', '23:58')), true);
    assert.equal(s.describeSaleWindow(legacy), 'Fri, Sat');
});

test('a manual phase pin overrides the schedule and suppresses the countdown', () => {
    const pinned = { ...FRI_8PM, forcedShopPhase: 'sale' };
    assert.equal(s.isShopOpen(pinned, ist('2026-07-27', '03:00')), true, 'open on a Monday');
    assert.equal(s.nextSaleOpen(pinned), null);
});

test('malformed times and dates fall back instead of throwing', () => {
    assert.equal(s.parseTime('99:99', 0), 0);
    assert.equal(s.parseTime('nonsense', 615), 615);
    assert.deepEqual(s.parseDates('2026-07-31, junk, 2026-08-01'), ['2026-07-31', '2026-08-01']);
});

test('the window is described for humans', () => {
    assert.equal(s.describeSaleWindow(FRI_8PM), 'Fri, Sat, 8:00 PM to 11:00 PM');
});
