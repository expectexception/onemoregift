"use client"
import { createContext, useState, useContext } from "react";

const TermsModalContext = createContext();

export function TermsModalProvider({ children }) {
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    return (
        <TermsModalContext.Provider value={{
            isTermsOpen,
            setIsTermsOpen,
            isPrivacyOpen,
            setIsPrivacyOpen
        }}>
            {children}
        </TermsModalContext.Provider>
    );
}

export function useTermsModal() {
    const context = useContext(TermsModalContext);
    if (!context) {
        throw new Error('useTermsModal must be used within TermsModalProvider');
    }
    return context;
}
