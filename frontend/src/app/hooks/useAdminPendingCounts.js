"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/app/utils/apiClient";

// Polls lightweight count-only queries for items that need admin attention:
// freshly submitted surprise requests, freshly submitted happy moments, and
// products at/under their low-stock threshold. Used to badge the sidebar.
export function useAdminPendingCounts(intervalMs = 60000) {
    const [counts, setCounts] = useState({ surprise: 0, moments: 0, lowStock: 0 });

    const refresh = useCallback(async () => {
        try {
            const [surpriseRes, momentsRes, productsRes] = await Promise.all([
                api.get("admin/surprise", { params: { status: "submitted", limit: 1 }, meta: { auth: "admin" } }).catch(() => null),
                api.get("admin/moments", { params: { status: "submitted", limit: 1 }, meta: { auth: "admin" } }).catch(() => null),
                api.get("admin/products", { params: { lowStock: "true", limit: 1 }, meta: { auth: "admin" } }).catch(() => null),
            ]);
            setCounts({
                surprise: surpriseRes?.data?.total || 0,
                moments: momentsRes?.data?.total || 0,
                lowStock: productsRes?.data?.total || 0,
            });
        } catch (_) {
            // Non-fatal — sidebar simply shows no badges if this fails.
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, intervalMs);
        return () => clearInterval(id);
    }, [refresh, intervalMs]);

    return counts;
}
