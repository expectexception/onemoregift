"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import SessionLoader from "./SessionLoader";

export default function withAdminAuth(Component, options = {}) {
    const {
        redirectTo = "/admin/",
        loadingLabel = "Verifying admin access...",
        redirectingLabel = "Redirecting to admin login...",
    } = options;

    function AuthenticatedAdminComponent(props) {
        const router = useRouter();
        const { adminAuthenticated, loadingAdmin, refreshAdminSession } = useAuth();

        useEffect(() => {
            const verifyAdminSession = async () => {
                try {
                    await refreshAdminSession();
                } catch (error) {
                }
            };

            if (!adminAuthenticated) {
                verifyAdminSession();
            }
        }, [adminAuthenticated, refreshAdminSession]);

        useEffect(() => {
            if (!loadingAdmin && !adminAuthenticated) {
                router.replace(redirectTo);
            }
        }, [loadingAdmin, adminAuthenticated, router]);

        if (loadingAdmin) {
            return <SessionLoader label={loadingLabel} />;
        }

        if (!adminAuthenticated) {
            return <SessionLoader label={redirectingLabel} />;
        }

        return <Component {...props} />;
    }

    const wrappedName = Component.displayName || Component.name || "Component";
    AuthenticatedAdminComponent.displayName = `withAdminAuth(${wrappedName})`;

    return AuthenticatedAdminComponent;
}
