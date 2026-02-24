"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingAdmin, setLoadingAdmin] = useState(true);

    const clearUserSession = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    const clearAdminSession = () => {
        localStorage.removeItem("atoken");
        setAdmin(null);
    };

    const refreshUserSession = async () => {
        try {
            const { data } = await api.get("auth/me", {
                meta: { auth: "user", skipAuthRedirect: true },
            });
            setUser(data.user || null);
            return data.user || null;
        } catch (error) {
            clearUserSession();
            return null;
        } finally {
            setLoadingUser(false);
        }
    };

    const refreshAdminSession = async () => {
        try {
            const { data } = await api.get("admin/me", {
                meta: { auth: "admin", skipAuthRedirect: true },
            });
            setAdmin(data.user || null);
            return data.user || null;
        } catch (error) {
            clearAdminSession();
            return null;
        } finally {
            setLoadingAdmin(false);
        }
    };

    const logoutUser = async () => {
        try {
            await api.post("auth/logout", {}, { meta: { skipAuthRedirect: true } });
        } catch (error) {
        } finally {
            clearUserSession();
        }
    };

    const logoutAdmin = async () => {
        try {
            await api.post("admin/logout", {}, { meta: { skipAuthRedirect: true } });
        } catch (error) {
        } finally {
            clearAdminSession();
        }
    };

    useEffect(() => {
        const hasUserToken = Boolean(localStorage.getItem("token"));
        const hasAdminToken = Boolean(localStorage.getItem("atoken"));

        if (hasUserToken) {
            refreshUserSession();
        } else {
            setLoadingUser(false);
        }

        if (hasAdminToken) {
            refreshAdminSession();
        } else {
            setLoadingAdmin(false);
        }
    }, []);

    const value = useMemo(() => ({
        user,
        admin,
        userAuthenticated: Boolean(user),
        adminAuthenticated: Boolean(admin),
        loadingUser,
        loadingAdmin,
        refreshUserSession,
        refreshAdminSession,
        logoutUser,
        logoutAdmin,
        setUser,
        setAdmin,
    }), [user, admin, loadingUser, loadingAdmin]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
