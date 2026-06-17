"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { 
    ShoppingBag, 
    Star, 
    ShoppingCart, 
    Plus, 
    Minus, 
    ArrowLeft,
    CheckCircle,
    Truck,
    Clock,
    ShieldCheck
} from "lucide-react";

export default function ProductDetailPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState("");
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    // Fetch product details
    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data } = await api.get(`shop/products/${id}`);
            if (!data.error && data.data) {
                setProduct(data.data);
                
                // Set initial active image
                if (data.data.images && data.data.images.length > 0) {
                    setActiveImage(data.data.images[0]);
                }

                // If product has variants, select first active variant
                if (data.data.hasVariants && data.data.variants && data.data.variants.length > 0) {
                    const firstActive = data.data.variants.find(v => v.isActive);
                    setSelectedVariant(firstActive || data.data.variants[0]);
                }

                // Fetch related products
                fetchRelated(data.data.category, data.data._id);
            } else {
                setError("Product not found");
            }
        } catch (err) {
            console.error("Failed to load product details:", err);
            setError("Failed to load product details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchRelated = async (category, excludeId) => {
        try {
            const { data } = await api.get("shop/products", {
                params: { category, limit: 4 }
            });
            if (!data.error && data.data) {
                // Filter out current product
                setRelated(data.data.filter(p => p._id !== excludeId));
            }
        } catch (err) {
            console.error("Failed to load related products:", err);
        }
    };

    // Load cart on mount
    useEffect(() => {
        const storedCart = localStorage.getItem("omg_cart");
        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (e) {
                setCart([]);
            }
        }
        fetchProduct();
    }, [id, fetchProduct]);

    const updateCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem("omg_cart", JSON.stringify(newCart));
    };

    const handleAddToCart = (redirectToCheck = false) => {
        if (!product) return;

        const limitStock = product.hasVariants && selectedVariant ? selectedVariant.stock : product.stock;
        
        if (limitStock <= 0) {
            alert("This item/variant is currently out of stock.");
            return;
        }

        if (quantity > limitStock) {
            alert(`Only ${limitStock} items available in stock.`);
            return;
        }

        const cartKey = product.hasVariants && selectedVariant ? `${product._id}-${selectedVariant._id}` : product._id;
        const existingItemIndex = cart.findIndex(item => item.cartKey === cartKey);

        const updatedCart = [...cart];

        if (existingItemIndex > -1) {
            const currentQty = updatedCart[existingItemIndex].quantity;
            if (currentQty + quantity > limitStock) {
                alert(`Cannot add more. Max stock limit is ${limitStock}.`);
                return;
            }
            updatedCart[existingItemIndex].quantity += quantity;
        } else {
            updatedCart.push({
                cartKey,
                productId: product._id,
                name: product.name,
                image: product.images?.[0] || "",
                price: product.hasVariants && selectedVariant ? selectedVariant.price : (product.discountedPrice || product.basePrice),
                variant: product.hasVariants && selectedVariant ? { _id: selectedVariant._id, name: selectedVariant.name } : null,
                quantity: quantity,
                maxStock: limitStock
            });
        }

        updateCart(updatedCart);

        if (redirectToCheck) {
            router.push("/shop/checkout");
        } else {
            alert("Added to cart successfully!");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-between">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-neutral-400">Loading exquisite details...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-between">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <ShoppingBag className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">{error || "Product not found"}</h2>
                        <p className="text-neutral-500 text-sm mb-6">The item you are looking for might have been archived or deleted.</p>
                        <button
                            onClick={() => router.push("/shop")}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-semibold hover:bg-neutral-850 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Shop
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const currentPrice = product.hasVariants && selectedVariant 
        ? selectedVariant.price 
        : (product.discountedPrice || product.basePrice);

    const hasOriginalPrice = !product.hasVariants && product.discountedPrice && product.discountedPrice < product.basePrice;
    const currentStock = product.hasVariants && selectedVariant ? selectedVariant.stock : product.stock;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none" />

            <Navbar />

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10">
                {/* Back button */}
                <button
                    onClick={() => router.push("/shop")}
                    className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-8 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Catalog
                </button>

                {/* Two-Column Detail Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
                    {/* Media Column */}
                    <div className="lg:col-span-6 space-y-4">
                        <div className="premium-card aspect-square bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-900 flex items-center justify-center">
                            {activeImage ? (
                                <img 
                                    src={activeImage.startsWith('http') ? activeImage : `http://localhost:9000${activeImage}`} 
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ShoppingBag className="w-20 h-20 text-neutral-800" />
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {product.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(img)}
                                        className={`w-20 h-20 rounded-xl overflow-hidden border bg-neutral-950 transition-all flex-shrink-0 cursor-pointer ${
                                            activeImage === img ? "border-red-600 scale-95" : "border-neutral-900 opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <img 
                                            src={img.startsWith('http') ? img : `http://localhost:9000${img}`} 
                                            alt={`${product.name} thumbnail ${index}`} 
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Specifications / Purchase Column */}
                    <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            {/* Occasion / Category Header */}
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-neutral-900 text-red-400 border border-neutral-850">
                                    {product.category}
                                </span>
                                {product.isFeatured && (
                                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-red-950/20 text-red-500 border border-red-900/30">
                                        EXCLUSIVE
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {product.name}
                            </h1>

                            {/* Ratings & Stock info */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="font-semibold text-neutral-200">{product.rating?.toFixed(1) || "4.8"}</span>
                                    <span className="text-neutral-500 text-xs">({product.totalOrders > 0 ? `${product.totalOrders} reviews` : "Verified Rating"})</span>
                                </div>
                                <div className="h-4 w-px bg-neutral-800" />
                                {currentStock === 0 ? (
                                    <span className="text-red-500 font-bold uppercase tracking-wider text-xs">Out of Stock</span>
                                ) : currentStock <= (product.lowStockThreshold || 5) ? (
                                    <span className="text-amber-500 font-bold uppercase tracking-wider text-xs">Only {currentStock} Left</span>
                                ) : (
                                    <span className="text-emerald-500 font-semibold uppercase tracking-wider text-xs">In Stock</span>
                                )}
                            </div>

                            <p className="text-neutral-400 text-sm leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* Variant Selector */}
                        {product.hasVariants && product.variants && product.variants.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">Select Option</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v._id}
                                            disabled={!v.isActive}
                                            onClick={() => {
                                                setSelectedVariant(v);
                                                setQuantity(1);
                                            }}
                                            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                                                selectedVariant?._id === v._id
                                                    ? "bg-red-600 border-red-600 text-white"
                                                    : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700"
                                            }`}
                                        >
                                            {v.name} - ₹{v.price.toLocaleString("en-IN")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price & Quantity Box */}
                        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-4">
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-extrabold text-white">₹{currentPrice.toLocaleString("en-IN")}</span>
                                {hasOriginalPrice && (
                                    <span className="text-sm text-neutral-500 line-through">₹{product.basePrice.toLocaleString("en-IN")}</span>
                                )}
                            </div>

                            {currentStock > 0 && (
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Quantity:</span>
                                    <div className="flex items-center border border-neutral-800 rounded-xl overflow-hidden bg-black">
                                        <button 
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="p-2.5 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="px-5 font-bold text-white text-sm select-none">{quantity}</span>
                                        <button 
                                            onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                                            className="p-2.5 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="text-[11px] text-neutral-500 font-medium">(Max: {currentStock})</span>
                                </div>
                            )}

                            {/* Purchase Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    onClick={() => handleAddToCart(false)}
                                    disabled={currentStock <= 0}
                                    className="flex-1 py-3.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => handleAddToCart(true)}
                                    disabled={currentStock <= 0}
                                    className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Buy It Now
                                </button>
                            </div>
                        </div>

                        {/* Store Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-900 pt-6">
                            <div className="flex gap-3 items-start">
                                <Truck className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-200">Local Pickup Only</h4>
                                    <p className="text-[10px] text-neutral-500 mt-0.5">Collect order directly from nearest local hub.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-200">Fast Collection</h4>
                                    <p className="text-[10px] text-neutral-500 mt-0.5">Ready for pickup within 2 hours of payment approval.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <ShieldCheck className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-200">Secure Order Verification</h4>
                                    <p className="text-[10px] text-neutral-500 mt-0.5">Verify order at storefront using unique secure QR code.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specs Details Accordion/List */}
                <div className="p-8 rounded-2xl bg-neutral-950 border border-neutral-900 mb-20">
                    <h3 className="text-base font-extrabold mb-6 tracking-wide border-b border-neutral-900 pb-4">Specifications & Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                        <div className="space-y-4">
                            <div className="flex justify-between py-2.5 border-b border-neutral-900/50">
                                <span className="text-neutral-500">Stock SKU</span>
                                <span className="font-semibold text-neutral-300">{product.sku || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-2.5 border-b border-neutral-900/50">
                                <span className="text-neutral-500">Weight</span>
                                <span className="font-semibold text-neutral-300">{product.weight ? `${product.weight} kg` : "N/A"}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between py-2.5 border-b border-neutral-900/50">
                                <span className="text-neutral-500">Category Tag</span>
                                <span className="font-semibold text-neutral-300 capitalize">{product.category}</span>
                            </div>
                            {product.dimensions && (
                                <div className="flex justify-between py-2.5 border-b border-neutral-900/50">
                                    <span className="text-neutral-500">Dimensions (W x H x D)</span>
                                    <span className="font-semibold text-neutral-300">
                                        {product.dimensions.width || 0} x {product.dimensions.height || 0} x {product.dimensions.depth || 0} cm
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recommendations Grid */}
                {related.length > 0 && (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-8">Related Masterpieces</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {related.map((prod) => {
                                const currentPrice = prod.discountedPrice || prod.basePrice;
                                return (
                                    <div 
                                        key={prod._id}
                                        onClick={() => router.push(`/shop/${prod._id}`)}
                                        className="premium-card rounded-2xl flex flex-col h-full overflow-hidden border border-neutral-900 bg-neutral-950 cursor-pointer"
                                    >
                                        <div className="aspect-video bg-neutral-950 overflow-hidden relative">
                                            {prod.images?.[0] ? (
                                                <img 
                                                    src={prod.images[0].startsWith('http') ? prod.images[0] : `http://localhost:9000${prod.images[0]}`} 
                                                    alt={prod.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-900">
                                                    <ShoppingBag className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-grow flex flex-col justify-between">
                                            <h4 className="font-bold text-white text-sm line-clamp-1 mb-1">{prod.name}</h4>
                                            <span className="text-xs font-extrabold text-neutral-400">₹{currentPrice.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
