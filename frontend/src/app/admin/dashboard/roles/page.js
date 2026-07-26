"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { Shield, RefreshCw, Power, Check, Minus, Star } from "lucide-react";

const ROLE_LABELS = {
    super_admin: { label: "Super Admin", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    admin: { label: "Admin", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    verification_manager: { label: "Verification Mgr", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    inventory_manager: { label: "Inventory Mgr", color: "bg-green-500/10 text-green-400 border-green-500/20" },
    store_manager: { label: "Store Mgr", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    content_moderator: { label: "Moderator", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    support_agent: { label: "Support", color: "bg-neutral-800 text-neutral-300 border-white/10" },
};

const ROLES = Object.keys(ROLE_LABELS);

const PERMISSION_MATRIX = {
    "users:read": [false, true, false, false, false, false, true],
    "users:write": [false, true, false, false, false, false, false],
    "surprise:read": [false, true, true, false, false, false, false],
    "surprise:write": [false, true, true, false, false, false, false],
    "moments:read": [false, true, false, false, false, true, false],
    "moments:write": [false, true, false, false, false, true, false],
    "products:read": [false, true, false, true, false, false, false],
    "products:write": [false, true, false, true, false, false, false],
    "orders:read": [false, true, false, false, true, false, true],
    "orders:write": [false, true, false, false, true, false, false],
    "stores:read": [false, true, false, true, true, false, false],
    "stores:write": [false, true, false, false, true, false, false],
    "gifts:read": [false, true, false, false, false, false, false],
    "gifts:write": [false, true, false, false, false, false, false],
    "reports:read": [false, true, false, false, false, false, false],
};

function RolesAdminPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newRole, setNewRole] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("admin/roles/admins", { meta: { auth: "admin" } });
            if (!data.error) setAdmins(data.data || []);
        } catch (_) {}
        setLoading(false);
    }, []);

    useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

    const handleRoleUpdate = async (id) => {
        setSaving(true);
        try {
            await api.patch(`admin/roles/admins/${id}/role`, { role: newRole }, { meta: { auth: "admin" } });
            setEditingId(null);
            fetchAdmins();
        } catch (err) {
            alert(err?.response?.data?.msg || "Failed to update role");
        }
        setSaving(false);
    };

    const handleToggleActive = async (id) => {
        try {
            await api.patch(`admin/roles/admins/${id}/activate`, {}, { meta: { auth: "admin" } });
            fetchAdmins();
        } catch (_) {}
    };

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Roles & Access</h1>
                        <p className="text-sm text-neutral-500">RBAC: manage admin roles and permissions</p>
                    </div>
                </div>

                {/* Admin List */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden mb-8">
                    <div className="px-4 py-3 border-b border-white/10">
                        <h2 className="text-sm font-semibold text-white">Admin Accounts</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["Admin", "Email", "Role", "Status", "Last Login", "Actions"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-neutral-500">Loading...</td></tr>
                                ) : admins.map(a => (
                                    <tr key={a._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="px-4 py-3 text-sm text-white font-medium">{a.username || "-"}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{a.email}</td>
                                        <td className="px-4 py-3">
                                            {editingId === a._id ? (
                                                <div className="flex gap-2 items-center">
                                                    <select className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                                        value={newRole} onChange={e => setNewRole(e.target.value)}>
                                                        {ROLES.map(r => <option key={r} value={r} className="bg-black">{ROLE_LABELS[r]?.label}</option>)}
                                                    </select>
                                                    <button onClick={() => handleRoleUpdate(a._id)} disabled={saving}
                                                        className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-white/[0.05] border border-white/10 text-white rounded-lg">✕</button>
                                                </div>
                                            ) : (
                                                <span className={`text-xs px-2 py-1 rounded-full border ${ROLE_LABELS[a.role]?.color || "bg-neutral-800 text-neutral-400 border-white/10"}`}>
                                                    {ROLE_LABELS[a.role]?.label || a.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${a.isActive !== false ? "bg-green-500/10 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                                                {a.isActive !== false ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-500">
                                            {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString("en-IN") : "Never"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingId(a._id); setNewRole(a.role); }}
                                                    className="text-xs px-2 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-white flex items-center gap-1">
                                                    <RefreshCw className="w-3 h-3" /> Role
                                                </button>
                                                <button onClick={() => handleToggleActive(a._id)}
                                                    className={`text-xs px-2 py-1.5 border rounded-lg flex items-center gap-1 ${a.isActive !== false ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400" : "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400"}`}>
                                                    <Power className="w-3 h-3" /> {a.isActive !== false ? "Disable" : "Enable"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Permission Matrix */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                        <h2 className="text-sm font-semibold text-white">Permission Matrix</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">Super Admin has full access to all permissions (★)</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase">Permission</th>
                                    {["Super Admin", ...Object.values(ROLE_LABELS).slice(1).map(r => r.label)].map(r => (
                                        <th key={r} className="text-center px-3 py-3 text-xs text-neutral-500 font-medium">{r}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(PERMISSION_MATRIX).map(([perm, access]) => (
                                    <tr key={perm} className="border-b border-white/5">
                                        <td className="px-4 py-2 text-xs text-neutral-400 font-mono">{perm}</td>
                                        <td className="px-3 py-2 text-center text-yellow-400"><Star className="w-4 h-4 mx-auto fill-yellow-400" /></td>
                                        {access.map((has, i) => (
                                            <td key={i} className={`px-3 py-2 text-center ${has ? "text-green-400" : "text-neutral-700"}`}>
                                                {has ? <Check className="w-4 h-4 mx-auto" /> : <Minus className="w-4 h-4 mx-auto" />}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAdminAuth(RolesAdminPage);
