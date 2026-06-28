"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Star } from "lucide-react";
import api, { mediaUrl } from "../utils/apiClient";
import { formatIndianCurrency } from "../hooks/usePlatformStats";
import RevealOnScroll from "./RevealOnScroll";

export default function FeaturedProducts() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchProducts = async () => {
            try {
                const { data } = await api.get("shop/products", { params: { sort: "popular", limit: 8 } });
                if (!cancelled && !data.error && Array.isArray(data.data)) {
                    // Prefer flagged-featured products, then the popular ordering from the API
                    const sorted = [...data.data].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
                    setProducts(sorted.slice(0, 4));
                }
            } catch {
                // Silent — section just won't render if it fails
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchProducts();
        return () => { cancelled = true; };
    }, []);

    if (!loading && products.length === 0) return null;

    return (
        <section className="relative bg-black py-20 sm:py-28 overflow-hidden">
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/[0.04] rounded-full blur-[160px] pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                    <div>
                        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-red-400/80 mb-3">
                            <ShoppingBag className="w-4 h-4" /> Gift Shop
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                            Popular in the <span className="text-gradient">Shop</span>
                        </h2>
                        <p className="text-neutral-400 mt-3 max-w-xl text-sm sm:text-base">
                            Hand-picked gifts loved by our community.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/shop")}
                        className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors group whitespace-nowrap"
                    >
                        Browse shop
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse h-72" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {products.map((p, i) => (
                            <RevealOnScroll key={p._id} delayMs={i * 80}>
                                <ProductCard product={p} onClick={() => router.push(`/shop/${p._id}`)} />
                            </RevealOnScroll>
                        ))}
                    </div>
                )}

                <div className="mt-10 text-center sm:hidden">
                    <button
                        onClick={() => router.push("/shop")}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                        Browse full shop <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}

function ProductCard({ product, onClick }) {
    const [broken, setBroken] = useState(false);
    const img = product.images?.[0] || product.thumbnail;
    const hasDiscount = product.discountedPrice && product.discountedPrice < product.basePrice;
    const currentPrice = hasDiscount ? product.discountedPrice : product.basePrice;

    return (
        <button
            onClick={onClick}
            className="group relative w-full rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] text-left hover:border-red-500/30 transition-all duration-300 flex flex-col"
        >
            <div className="relative aspect-square w-full overflow-hidden bg-neutral-900">
                {img && !broken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={mediaUrl(img)}
                        alt={product.name}
                        onError={() => setBroken(true)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                        <ShoppingBag className="w-10 h-10 text-red-500/40" />
                    </div>
                )}
                {hasDiscount && (
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wide">SALE</span>
                )}
                {product.rating > 0 && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" /> {Number(product.rating).toFixed(1)}
                    </span>
                )}
            </div>

            <div className="p-3 sm:p-4 flex-1 flex flex-col">
                {product.category && (
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">{product.category}</span>
                )}
                <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 flex-1">{product.name}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-white">{formatIndianCurrency(currentPrice)}</span>
                    {hasDiscount && (
                        <span className="text-xs text-neutral-500 line-through">{formatIndianCurrency(product.basePrice)}</span>
                    )}
                </div>
            </div>
        </button>
    );
}
