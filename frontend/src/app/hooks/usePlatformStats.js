"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/app/utils/apiClient";

const DEFAULT_STATS = {
    registeredUsers: 0,
    totalUsers: 0,
    totalGiveaways: 0,
    activeGiveaways: 0,
    completedGiveaways: 0,
    totalWinners: 0,
    totalPrizeValue: 0,
    verifiedDrawRate: 0,
    updatedAt: null,
};

const normalizeStats = (data = {}) => ({
    registeredUsers: Number(data.registeredUsers || 0),
    totalUsers: Number(data.totalUsers || data.registeredUsers || 0),
    totalGiveaways: Number(data.totalGiveaways || 0),
    activeGiveaways: Number(data.activeGiveaways || 0),
    completedGiveaways: Number(data.completedGiveaways || 0),
    totalWinners: Number(data.totalWinners || 0),
    totalPrizeValue: Number(data.totalPrizeValue || 0),
    verifiedDrawRate: Number(data.verifiedDrawRate ?? data.verifiedLegit ?? 0),
    updatedAt: data.updatedAt || null,
});

export function usePlatformStats({ refreshMs = 10000 } = {}) {
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const fetchStats = async () => {
            try {
                const { data } = await api.get("admin/stats");
                if (!cancelled && !data.error) {
                    setStats(normalizeStats(data));
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchStats();
        const interval = refreshMs ? setInterval(fetchStats, refreshMs) : null;

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
        };
    }, [refreshMs]);

    return useMemo(() => ({ stats, loading, error }), [stats, loading, error]);
}

export const formatCompactNumber = (value) => (
    new Intl.NumberFormat("en-IN", {
        notation: Number(value) >= 10000 ? "compact" : "standard",
        maximumFractionDigits: 1,
    }).format(Number(value || 0))
);

export const formatIndianCurrency = (value) => (
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0))
);
