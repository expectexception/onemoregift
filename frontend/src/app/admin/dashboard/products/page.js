"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { ShoppingBag, Plus, Pencil, Archive, Trash2, Search, AlertTriangle } from "lucide-react";

function ProductsAdminPage() {
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [lowStock, setLowStock] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState({ name: "", description: "", category: "", basePrice: "", stock: "", occasions: "", isActive: true });
    const [saving, setSaving] = useState(false);
    const [stockModal, setStockModal] = useState(null);
    const [stockAdj, setStockAdj] = useState("");
    const [stockReason, setStockReason] = useState("");
    const limit = 15;

    const fetchCategories = useCallback(async () => {
        try {
            const { data } = await api.get("admin/products/categories", { meta: { auth: "admin" } });
            if (!data.error) setCategories(data.data || []);
        } catch (_) {}
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (search) params.search = search;
            if (category) params.category = category;
            if (lowStock) params.lowStock = "true";
            const { data } = await api.get("admin/products", { params, meta: { auth: "admin" } });
            if (!data.error) { setProducts(data.data || []); setTotal(data.total || 0); }
        } catch (_) {}
        setLoading(false);
    }, [page, search, category, lowStock]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const openEdit = (p) => {
        setEditProduct(p);
        setForm({ name: p.name, description: p.description || "", category: p.category, basePrice: p.basePrice, stock: p.stock, occasions: (p.occasions || []).join(", "), isActive: p.isActive });
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...form, basePrice: Number(form.basePrice), stock: Number(form.stock), occasions: form.occasions.split(",").map(o => o.trim()).filter(Boolean) };
            if (editProduct) {
                await api.patch(`admin/products/${editProduct._id}`, payload, { meta: { auth: "admin" } });
            } else {
                await api.post("admin/products", payload, { meta: { auth: "admin" } });
            }
            setShowForm(false);
            setEditProduct(null);
            setForm({ name: "", description: "", category: "", basePrice: "", stock: "", occasions: "", isActive: true });
            fetchProducts();
            fetchCategories();
        } catch (_) {}
        setSaving(false);
    };

    const handleArchive = async (id) => {
        if (!confirm("Archive this product?")) return;
        try { await api.patch(`admin/products/${id}/archive`, {}, { meta: { auth: "admin" } }); fetchProducts(); } catch (_) {}
    };

    const handleDelete = async (id) => {
        if (!confirm("Permanently delete this product?")) return;
        try { await api.delete(`admin/products/${id}`, { meta: { auth: "admin" } }); fetchProducts(); } catch (_) {}
    };

    const handleStockAdjust = async () => {
        if (!stockModal || !stockAdj) return;
        try {
            await api.patch(`admin/products/${stockModal._id}/stock`, { adjustment: Number(stockAdj), reason: stockReason }, { meta: { auth: "admin" } });
            setStockModal(null); setStockAdj(""); setStockReason("");
            fetchProducts();
        } catch (_) {}
    };

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Products</h1>
                            <p className="text-sm text-neutral-500">Manage shop inventory</p>
                        </div>
                    </div>
                    <button onClick={() => { setEditProduct(null); setForm({ name: "", description: "", category: "", basePrice: "", stock: "", occasions: "", isActive: true }); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <Plus className="w-4 h-4" /> Add Product
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
                            placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                        <option value="" className="bg-black">All Categories</option>
                        {categories.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                        <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} />
                        <AlertTriangle className="w-3 h-3 text-yellow-400" /> Low Stock
                    </label>
                </div>

                {/* Table */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["Product", "Category", "Price", "Stock", "Status", "Actions"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-neutral-500">Loading...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No products found</td></tr>
                                ) : products.map(p => (
                                    <tr key={p._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-white font-medium">{p.name}</div>
                                            {p.occasions?.length > 0 && <div className="text-xs text-neutral-500">{p.occasions.join(", ")}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{p.category}</td>
                                        <td className="px-4 py-3 text-sm text-white">₹{p.basePrice?.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-semibold ${p.stock <= (p.lowStockThreshold || 5) ? "text-yellow-400" : "text-white"}`}>{p.stock}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${p.isArchived ? "bg-neutral-800 text-neutral-500" : p.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                                {p.isArchived ? "Archived" : p.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(p)} className="text-xs px-2 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-white"><Pencil className="w-3 h-3" /></button>
                                                <button onClick={() => setStockModal(p)} className="text-xs px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400">± Stock</button>
                                                <button onClick={() => handleArchive(p._id)} className="text-xs px-2 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-400"><Archive className="w-3 h-3" /></button>
                                                <button onClick={() => handleDelete(p._id)} className="text-xs px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <span className="text-xs text-neutral-500">{total} total products</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Prev</button>
                            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-lg font-bold text-white">{editProduct ? "Edit Product" : "Add Product"}</h2>
                                <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white">✕</button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: "Product Name", key: "name", type: "text" },
                                    { label: "Category", key: "category", type: "text" },
                                    { label: "Base Price (₹)", key: "basePrice", type: "number" },
                                    { label: "Stock", key: "stock", type: "number" },
                                    { label: "Occasions (comma separated)", key: "occasions", type: "text" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs text-neutral-500 mb-1">{f.label}</label>
                                        <input type={f.type}
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                            value={form[f.key]}
                                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1">Description</label>
                                    <textarea rows={3} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
                                        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                                    Active
                                </label>
                            </div>
                            <button onClick={handleSave} disabled={saving}
                                className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                                {saving ? "Saving..." : editProduct ? "Update Product" : "Create Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Adjust Modal */}
            {stockModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-bold text-white">Adjust Stock</h2>
                                <button onClick={() => setStockModal(null)} className="text-neutral-500 hover:text-white">✕</button>
                            </div>
                            <p className="text-sm text-neutral-400 mb-4">{stockModal.name} — Current: <span className="text-white font-bold">{stockModal.stock}</span></p>
                            <div className="space-y-3">
                                <input type="number" placeholder="Adjustment (e.g. +10 or -5)"
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                    value={stockAdj} onChange={e => setStockAdj(e.target.value)} />
                                <input type="text" placeholder="Reason (optional)"
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                    value={stockReason} onChange={e => setStockReason(e.target.value)} />
                                <button onClick={handleStockAdjust} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl">Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAdminAuth(ProductsAdminPage);
