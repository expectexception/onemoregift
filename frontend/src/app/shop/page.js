"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api, { mediaUrl } from "@/app/utils/apiClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import WeeklyDropStrip from "@/app/components/WeeklyDropStrip";
import { useToast } from "@/hooks/use-toast";
import { EmptyBoxIllustration, EmptyCartIllustration } from "@/app/components/SVGIcons";
import { CART_STORAGE_KEY, notifyCartUpdated } from "@/app/utils/cart";
import { fetchSiteConfig, dropDaysLabel } from "@/app/utils/siteConfig";
import {
    ShoppingBag,
    Search,
    SlidersHorizontal,
    Star,
    ShoppingCart,
    X,
    Plus,
    Minus,
    ArrowRight,
    Sparkles
} from "lucide-react";

export default function ShopPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Catalog State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("popular");
    const [priceRange, setPriceRange] = useState({ min: "", max: "" });
    const [showFilters, setShowFilters] = useState(false);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(12);

    // Cart State
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [brokenImages, setBrokenImages] = useState(() => new Set());

    // Weekly drop cycle config
    const [config, setConfig] = useState({ weeklyDropEnabled: false, shopPhase: "sale", shopPhases: null });
    const saleClosed = config.weeklyDropEnabled && config.shopPhase !== "sale";

    useEffect(() => {
        fetchSiteConfig()
            .then((cfg) => {
                setConfig({
                    weeklyDropEnabled: cfg.weeklyDropEnabled === true,
                    shopPhase: cfg.shopPhase || "sale",
                    shopPhases: cfg.shopPhases || null,
                });
            })
            .catch(() => {});
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const { data } = await api.get("shop/products/categories");
            if (!data.error) {
                setCategories(data.data || []);
            }
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    }, []);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                sort: sortBy,
            };
            if (selectedCategory) params.category = selectedCategory;
            if (searchQuery) params.search = searchQuery;
            if (priceRange.min) params.minPrice = priceRange.min;
            if (priceRange.max) params.maxPrice = priceRange.max;

            const { data } = await api.get("shop/products", { params });
            if (!data.error) {
                setProducts(data.data || []);
                setTotal(data.total || 0);
            }
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, selectedCategory, searchQuery, sortBy, priceRange.min, priceRange.max]);

    // Initialize cart from local storage
    useEffect(() => {
        const storedCart = localStorage.getItem("omg_cart");
        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (e) {
                setCart([]);
            }
        }
        fetchCategories();
    }, [fetchCategories]);

    // Sync cart to local storage
    const updateCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
        notifyCartUpdated();
    };

    // Trigger fetch on filter change
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Handle Search Submit
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    // Cart Handlers
    const addToCart = (product, variant = null) => {
        if (saleClosed) {
            toast({
                title: "Sale window closed",
                description: `Orders open on ${dropDaysLabel(config, "sale")} only. Products & prices reveal ${dropDaysLabel(config, "reveal")}.`,
                variant: "destructive",
            });
            return;
        }
        const cartKey = variant ? `${product._id}-${variant._id}` : product._id;
        const existingItemIndex = cart.findIndex(item => item.cartKey === cartKey);

        const limitStock = variant ? variant.stock : product.stock;
        
        if (existingItemIndex > -1) {
            const currentQty = cart[existingItemIndex].quantity;
            if (currentQty >= limitStock) {
                toast({ title: "Stock limit reached", description: `Only ${limitStock} item(s) in stock.`, variant: "destructive" });
                return;
            }
            const updated = [...cart];
            updated[existingItemIndex].quantity += 1;
            updateCart(updated);
        } else {
            if (limitStock <= 0) {
                toast({ title: "Out of stock", description: "This product is currently unavailable.", variant: "destructive" });
                return;
            }
            const newItem = {
                cartKey,
                productId: product._id,
                name: product.name,
                image: product.images?.[0] || "",
                price: product.discountedPrice || product.basePrice,
                variant: variant ? { _id: variant._id, name: variant.name } : null,
                quantity: 1,
                maxStock: limitStock
            };
            updateCart([...cart, newItem]);
        }
        setCartOpen(true);
    };

    const updateQuantity = (cartKey, delta) => {
        const itemIndex = cart.findIndex(item => item.cartKey === cartKey);
        if (itemIndex === -1) return;

        const updated = [...cart];
        const newQty = updated[itemIndex].quantity + delta;

        if (newQty <= 0) {
            updated.splice(itemIndex, 1);
        } else if (newQty > updated[itemIndex].maxStock) {
            toast({ title: "Stock limit reached", description: `Only ${updated[itemIndex].maxStock} unit(s) available.`, variant: "destructive" });
            return;
        } else {
            updated[itemIndex].quantity = newQty;
        }
        updateCart(updated);
    };

    const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none" />

            <Navbar />

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10">
                {/* Header Banner */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        Premium Curated Gifts & Rewards
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
                        Exquisite Gift Shop
                    </h1>
                    <p className="text-neutral-400 text-base sm:text-lg sm:leading-relaxed">
                        Quick limited-quantity weekly drops. Products & prices reveal {dropDaysLabel(config, "reveal")},
                        sale goes live {dropDaysLabel(config, "sale")}, and you pick up your order {dropDaysLabel(config, "pickup")}.
                    </p>
                </div>

                {/* Weekly drop cycle strip */}
                {config.weeklyDropEnabled && <WeeklyDropStrip phase={config.shopPhase} shopPhases={config.shopPhases} />}

                {/* Search & Main Action Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                    <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
                        <input
                            type="text"
                            placeholder="Search premium products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3.5 pl-11 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
                        />
                        <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-3.5" />
                    </form>

                    <div className="flex w-full md:w-auto items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all w-full sm:w-auto ${
                                showFilters 
                                    ? "bg-red-950/30 border-red-600 text-red-400" 
                                    : "bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                            }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                        </button>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-600 transition-colors cursor-pointer w-full sm:w-auto"
                        >
                            <option value="popular">Popularity</option>
                            <option value="newest">Newest Arrival</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="rating">Rating</option>
                        </select>

                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all shadow-lg shadow-red-600/10 cursor-pointer hidden md:flex"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Cart
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Filters Drawer/Panel */}
                {showFilters && (
                    <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 mb-8 animate-scale-in">
                        <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase mb-4">Filter Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Price range */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Price Range (₹)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-neutral-700"
                                    />
                                    <span className="text-neutral-600">to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-neutral-700"
                                    />
                                </div>
                            </div>

                            {/* Reset filter */}
                            <div className="flex items-end justify-end">
                                <button
                                    onClick={() => {
                                        setPriceRange({ min: "", max: "" });
                                        setSelectedCategory("");
                                        setSearchQuery("");
                                        setSortBy("popular");
                                        setPage(1);
                                    }}
                                    className="text-xs text-neutral-400 hover:text-red-400 transition-colors uppercase tracking-widest font-bold border-b border-dashed border-neutral-700 hover:border-red-400 pb-0.5"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Pills Slider */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide">
                    <button
                        onClick={() => { setSelectedCategory(""); setPage(1); }}
                        className={`px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategory === "" 
                                ? "bg-red-600 border-red-600 text-white" 
                                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setPage(1); }}
                            className={`px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-all capitalize cursor-pointer ${
                                selectedCategory === cat 
                                    ? "bg-red-600 border-red-600 text-white" 
                                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Catalog Listing */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <div key={n} className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-4 animate-pulse h-96 flex flex-col justify-between">
                                <div className="bg-neutral-900 rounded-xl h-48 w-full" />
                                <div className="space-y-3 mt-4">
                                    <div className="h-4 bg-neutral-900 rounded w-1/3" />
                                    <div className="h-6 bg-neutral-900 rounded w-3/4" />
                                    <div className="h-4 bg-neutral-900 rounded w-1/2" />
                                </div>
                                <div className="h-10 bg-neutral-900 rounded-xl mt-4 w-full" />
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-neutral-800 rounded-3xl bg-neutral-950/20">
                        <EmptyBoxIllustration className="w-28 h-28 mx-auto mb-2" />
                        <h3 className="text-lg font-bold text-neutral-300">No premium products found</h3>
                        <p className="text-neutral-500 text-sm mt-1">Try tweaking your filters or search terms.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((prod) => {
                                const hasDiscount = prod.discountedPrice && prod.discountedPrice < prod.basePrice;
                                const originalPrice = prod.basePrice;
                                const currentPrice = hasDiscount ? prod.discountedPrice : prod.basePrice;
                                const isLowStock = prod.stock > 0 && prod.stock <= prod.lowStockThreshold;

                                return (
                                    <div key={prod._id} className="premium-card rounded-2xl flex flex-col h-full overflow-hidden border border-neutral-900 bg-neutral-950">
                                        {/* Image Frame */}
                                        <div className="relative group/img aspect-square bg-neutral-950 overflow-hidden cursor-pointer" onClick={() => router.push(`/shop/${prod._id}`)}>
                                            {prod.images?.[0] && !brokenImages.has(prod._id) ? (
                                                <img
                                                    src={mediaUrl(prod.images[0])}
                                                    alt={prod.name}
                                                    onError={() => setBrokenImages(prev => new Set(prev).add(prod._id))}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-900">
                                                    <ShoppingBag className="w-12 h-12" />
                                                </div>
                                            )}

                                            {/* Tag */}
                                            {prod.category && (
                                                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-black/60 backdrop-blur-md text-red-400 border border-red-500/20">
                                                    {prod.category}
                                                </span>
                                            )}

                                            {/* Discount Flag */}
                                            {hasDiscount && (
                                                <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-600 text-white">
                                                    OFFER
                                                </span>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="p-5 flex-grow flex flex-col justify-between">
                                            <div>
                                                {/* Rating & Stock */}
                                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                                    <div className="flex items-center gap-1 text-yellow-500 text-xs">
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        <span className="font-semibold text-neutral-300">{prod.rating?.toFixed(1) || "4.8"}</span>
                                                    </div>
                                                    
                                                    {prod.stock === 0 ? (
                                                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Out of Stock</span>
                                                    ) : isLowStock ? (
                                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Only {prod.stock} left</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">In Stock</span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-bold text-white text-base hover:text-red-500 transition-colors line-clamp-2 cursor-pointer mb-2" onClick={() => router.push(`/shop/${prod._id}`)}>
                                                    {prod.name}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-neutral-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                                                    {prod.description}
                                                </p>
                                            </div>

                                            <div>
                                                {/* Price */}
                                                <div className="flex items-baseline gap-2 mb-4">
                                                    <span className="text-lg font-extrabold text-white">₹{currentPrice.toLocaleString("en-IN")}</span>
                                                    {hasDiscount && (
                                                        <span className="text-xs text-neutral-500 line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => router.push(`/shop/${prod._id}`)}
                                                        className="flex-1 text-center py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 transition-colors cursor-pointer"
                                                    >
                                                        Details
                                                    </button>
                                                    {prod.stock > 0 && (
                                                        <button
                                                            onClick={() => addToCart(prod)}
                                                            className={`px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${saleClosed
                                                                ? "bg-neutral-900 border border-neutral-800 text-neutral-600"
                                                                : "bg-red-600 hover:bg-red-700 text-white"}`}
                                                            title={saleClosed ? "Sale opens Friday" : "Add to Cart"}
                                                        >
                                                            <ShoppingCart className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {total > limit && (
                            <div className="flex items-center justify-center gap-3 mt-12">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    Prev
                                </button>
                                <span className="text-sm text-neutral-400">Page {page} of {Math.ceil(total / limit)}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                                    disabled={page >= Math.ceil(total / limit)}
                                    className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />

            {/* Cart Slide-over Drawer */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setCartOpen(false)}
                    />

                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-neutral-900 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-red-500" />
                                    Shopping Cart
                                </h2>
                                <button 
                                    onClick={() => setCartOpen(false)}
                                    className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cart List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="text-center py-16 text-neutral-500 space-y-4">
                                        <EmptyCartIllustration className="w-24 h-24 mx-auto" />
                                        <p className="text-sm font-medium">Your cart is empty</p>
                                        <button 
                                            onClick={() => setCartOpen(false)}
                                            className="text-xs text-red-500 hover:underline tracking-wider font-bold"
                                        >
                                            BROWSE PRODUCTS
                                        </button>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.cartKey} className="flex gap-4 p-3 rounded-xl bg-neutral-900/40 border border-neutral-900">
                                            {/* Thumbnail */}
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-850 flex-shrink-0">
                                                {item.image ? (
                                                    <img 
                                                        src={mediaUrl(item.image)} 
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-800 bg-neutral-900">
                                                        <ShoppingBag className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-grow flex flex-col justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                                                    {item.variant && (
                                                        <span className="text-[10px] text-red-400 font-semibold bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/30">
                                                            {item.variant.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-extrabold text-neutral-300">₹{item.price.toLocaleString("en-IN")}</span>
                                                    
                                                    {/* Qty controls */}
                                                    <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
                                                        <button 
                                                            onClick={() => updateQuantity(item.cartKey, -1)}
                                                            className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="px-2.5 text-xs font-bold text-white select-none">{item.quantity}</span>
                                                        <button 
                                                            onClick={() => updateQuantity(item.cartKey, 1)}
                                                            className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {cart.length > 0 && (
                                <div className="p-6 border-t border-neutral-900 bg-neutral-950 space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-400">Subtotal</span>
                                        <span className="text-lg font-bold text-white">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    <p className="text-[10px] text-neutral-500 leading-normal">
                                        * Taxes and pickup coordination are included. Claim and pick up from selected stores only.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setCartOpen(false);
                                            router.push("/shop/checkout");
                                        }}
                                        className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                    >
                                        Proceed to Checkout
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
