"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "../context/AuthContext";
import { TermsModalProvider } from "../context/TermsModalContext";

export default function AppProviders({ children }) {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const app = (
        <AuthProvider>
            <TermsModalProvider>
                {children}
            </TermsModalProvider>
        </AuthProvider>
    );

    if (!googleClientId) {
        return app;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {app}
        </GoogleOAuthProvider>
    );
}
