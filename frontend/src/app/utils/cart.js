// Shared helpers for the localStorage-backed shop cart ("omg_cart").
// Pages that mutate the cart should call notifyCartUpdated() after writing to
// localStorage so the Navbar (and any other listener) can refresh its badge
// without needing a shared cart context.

export const CART_STORAGE_KEY = "omg_cart";
export const CART_UPDATED_EVENT = "omg-cart-updated";

export function readCartCount() {
    if (typeof window === "undefined") return 0;
    try {
        const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        return raw.reduce((acc, item) => acc + (item.quantity || 0), 0);
    } catch {
        return 0;
    }
}

export function notifyCartUpdated() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
