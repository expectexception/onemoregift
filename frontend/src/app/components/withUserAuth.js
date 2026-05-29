"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import SessionLoader from "./SessionLoader";

export default function withUserAuth(Component, options = {}) {
    const {
        redirectTo = "/login",
        loadingLabel = "Checking your account session...",
        redirectingLabel = "Redirecting to login...",
    } = options;

    function AuthenticatedUserComponent(props) {
        const router = useRouter();
        const { userAuthenticated, loadingUser } = useAuth();

        useEffect(() => {
            if (!loadingUser && !userAuthenticated) {
                router.replace(redirectTo);
            }
        }, [loadingUser, userAuthenticated, router]);

        if (loadingUser) {
            return <SessionLoader label={loadingLabel} />;
        }

        if (!userAuthenticated) {
            return <SessionLoader label={redirectingLabel} />;
        }

        return <Component {...props} />;
    }

    const wrappedName = Component.displayName || Component.name || "Component";
    AuthenticatedUserComponent.displayName = `withUserAuth(${wrappedName})`;

    return AuthenticatedUserComponent;
}
