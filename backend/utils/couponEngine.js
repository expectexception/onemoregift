'use strict';

// Works out whether a coupon applies to a cart and what it is worth. Kept pure so
// the rules can be tested without a database, and so the exact same function runs
// for the "preview" endpoint and for the real order. The client never gets to say
// what the discount is.

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Which part of the cart a coupon covers. A code limited to products or
 * categories only discounts the matching lines, not the whole basket.
 * `lines` are { productId, category, totalPrice }.
 */
const eligibleAmount = (coupon, lines) => {
    const hasProductFilter = Array.isArray(coupon.productIds) && coupon.productIds.length > 0;
    const hasCategoryFilter = Array.isArray(coupon.categories) && coupon.categories.length > 0;
    if (!hasProductFilter && !hasCategoryFilter) {
        return lines.reduce((sum, l) => sum + l.totalPrice, 0);
    }

    const productSet = new Set((coupon.productIds || []).map(String));
    const categorySet = new Set((coupon.categories || []).map(c => String(c).toLowerCase()));

    return lines.reduce((sum, line) => {
        const productHit = hasProductFilter && productSet.has(String(line.productId));
        const categoryHit = hasCategoryFilter && categorySet.has(String(line.category || '').toLowerCase());
        return productHit || categoryHit ? sum + line.totalPrice : sum;
    }, 0);
};

/**
 * @returns {{ ok: true, discount, eligible, message }} or {{ ok: false, reason }}
 * `userUses` is how many times this customer has already redeemed the code.
 */
const evaluateCoupon = (coupon, { lines, subtotal, userUses = 0, now = new Date() }) => {
    if (!coupon) return { ok: false, reason: 'That coupon code is not valid' };
    if (!coupon.isActive) return { ok: false, reason: 'This coupon is no longer active' };

    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
        return { ok: false, reason: 'This coupon is not active yet' };
    }
    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
        return { ok: false, reason: 'This coupon has expired' };
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return { ok: false, reason: 'This coupon has been fully redeemed' };
    }
    if (coupon.perUserLimit > 0 && userUses >= coupon.perUserLimit) {
        return {
            ok: false,
            reason: coupon.perUserLimit === 1
                ? 'You have already used this coupon'
                : `You have already used this coupon ${coupon.perUserLimit} times`,
        };
    }

    if (coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) {
        return { ok: false, reason: `Spend at least ₹${coupon.minOrderValue} to use this coupon` };
    }

    const eligible = eligibleAmount(coupon, lines);
    if (eligible <= 0) {
        return { ok: false, reason: 'This coupon does not apply to the items in your cart' };
    }

    let discount;
    if (coupon.discountType === 'percent') {
        discount = (eligible * coupon.discountValue) / 100;
        if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else {
        discount = coupon.discountValue;
    }

    // A flat coupon larger than the cart must not produce a negative total, and a
    // discount can never exceed the part of the cart it actually covers.
    discount = Math.min(discount, eligible, subtotal);
    discount = round2(Math.max(0, discount));

    if (discount <= 0) {
        return { ok: false, reason: 'This coupon does not reduce the price of your cart' };
    }

    const label = coupon.discountType === 'percent'
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue} off`;

    return { ok: true, discount, eligible: round2(eligible), message: `${label} applied` };
};

module.exports = { evaluateCoupon, eligibleAmount, round2 };
