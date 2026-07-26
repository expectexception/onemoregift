'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { evaluateCoupon, eligibleAmount } = require('../utils/couponEngine');

const base = {
    isActive: true,
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: 0,
    minOrderValue: 0,
    usageLimit: 0,
    perUserLimit: 1,
    usedCount: 0,
    productIds: [],
    categories: [],
};

const cart = (...lines) => ({
    lines,
    subtotal: lines.reduce((s, l) => s + l.totalPrice, 0),
});

test('a percentage coupon takes its cut of the cart', () => {
    const r = evaluateCoupon(base, cart({ productId: 'a', category: 'gifts', totalPrice: 1000 }));
    assert.equal(r.ok, true);
    assert.equal(r.discount, 100);
});

test('maxDiscount caps a percentage coupon', () => {
    const r = evaluateCoupon({ ...base, discountValue: 50, maxDiscount: 200 },
        cart({ productId: 'a', category: 'gifts', totalPrice: 1000 }));
    assert.equal(r.discount, 200, 'half of 1000 is capped at 200');
});

test('a flat coupon never exceeds the cart total', () => {
    const r = evaluateCoupon({ ...base, discountType: 'flat', discountValue: 900 },
        cart({ productId: 'a', category: 'gifts', totalPrice: 300 }));
    assert.equal(r.discount, 300, 'discount is clamped so the total cannot go negative');
});

test('minimum order value is enforced', () => {
    const r = evaluateCoupon({ ...base, minOrderValue: 500 },
        cart({ productId: 'a', category: 'gifts', totalPrice: 300 }));
    assert.equal(r.ok, false);
    assert.match(r.reason, /at least/i);
});

test('expiry and start dates are respected', () => {
    const now = new Date('2026-08-01T12:00:00Z');
    assert.equal(evaluateCoupon({ ...base, validUntil: '2026-07-31T00:00:00Z' },
        { ...cart({ productId: 'a', category: 'g', totalPrice: 100 }), now }).ok, false);
    assert.equal(evaluateCoupon({ ...base, validFrom: '2026-09-01T00:00:00Z' },
        { ...cart({ productId: 'a', category: 'g', totalPrice: 100 }), now }).ok, false);
    assert.equal(evaluateCoupon({ ...base, validFrom: '2026-07-01T00:00:00Z', validUntil: '2026-08-31T00:00:00Z' },
        { ...cart({ productId: 'a', category: 'g', totalPrice: 100 }), now }).ok, true);
});

test('global and per-user limits both block redemption', () => {
    assert.equal(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 },
        cart({ productId: 'a', category: 'g', totalPrice: 100 })).ok, false, 'fully redeemed');
    assert.equal(evaluateCoupon(base,
        { ...cart({ productId: 'a', category: 'g', totalPrice: 100 }), userUses: 1 }).ok, false, 'already used by this customer');
    assert.equal(evaluateCoupon({ ...base, perUserLimit: 0 },
        { ...cart({ productId: 'a', category: 'g', totalPrice: 100 }), userUses: 99 }).ok, true, '0 means unlimited');
});

test('an inactive coupon is refused', () => {
    assert.equal(evaluateCoupon({ ...base, isActive: false },
        cart({ productId: 'a', category: 'g', totalPrice: 100 })).ok, false);
    assert.equal(evaluateCoupon(null, cart({ productId: 'a', category: 'g', totalPrice: 100 })).ok, false);
});

test('a product-limited coupon only discounts matching lines', () => {
    const coupon = { ...base, discountValue: 50, productIds: ['p1'] };
    const c = cart(
        { productId: 'p1', category: 'gifts', totalPrice: 400 },
        { productId: 'p2', category: 'gifts', totalPrice: 600 },
    );
    const r = evaluateCoupon(coupon, c);
    assert.equal(r.eligible, 400, 'only the matching line counts');
    assert.equal(r.discount, 200, 'half of 400, not half of 1000');
});

test('a category-limited coupon only discounts matching lines', () => {
    const coupon = { ...base, discountValue: 25, categories: ['Toys'] };
    const c = cart(
        { productId: 'p1', category: 'toys', totalPrice: 800 },
        { productId: 'p2', category: 'gifts', totalPrice: 200 },
    );
    const r = evaluateCoupon(coupon, c);
    assert.equal(r.eligible, 800, 'category match is case-insensitive');
    assert.equal(r.discount, 200);
});

test('a coupon that matches nothing in the cart is refused', () => {
    const r = evaluateCoupon({ ...base, productIds: ['nope'] },
        cart({ productId: 'p1', category: 'gifts', totalPrice: 500 }));
    assert.equal(r.ok, false);
    assert.match(r.reason, /does not apply/i);
});

test('a zero-value discount is refused rather than applied as nothing', () => {
    const r = evaluateCoupon({ ...base, discountType: 'flat', discountValue: 0 },
        cart({ productId: 'a', category: 'g', totalPrice: 500 }));
    assert.equal(r.ok, false);
});

test('eligibleAmount covers the whole cart when no filters are set', () => {
    assert.equal(eligibleAmount(base, [
        { productId: 'a', category: 'x', totalPrice: 100 },
        { productId: 'b', category: 'y', totalPrice: 250 },
    ]), 350);
});

test('money is rounded to paise, not left as a float artefact', () => {
    const r = evaluateCoupon({ ...base, discountValue: 33 },
        cart({ productId: 'a', category: 'g', totalPrice: 99.99 }));
    assert.equal(r.discount, 33, 'rounded to 2dp');
});
