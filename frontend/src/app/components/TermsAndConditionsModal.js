"use client"
import { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, FileText, ChevronDown, X } from "lucide-react";
import Link from "next/link";

export default function TermsAndConditionsModal({ isOpen, onOpenChange, onAccept }) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 5) {
            setHasScrolledToBottom(true);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
        }
    }, [isOpen]);

    const termsContent = [
        {
            number: "01",
            title: "Who We Are",
            content: "OneMoreGift is India's leading premium giveaway platform. These Terms govern your use of our website, web application, and related services."
        },
        {
            number: "02",
            title: "Acceptance of Terms",
            content: "By accessing or using the OneMoreGift platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Platform."
        },
        {
            number: "03",
            title: "Eligibility Requirements",
            content: "You must be at least 18 years of age. Participation is currently limited to residents of India with a valid Indian shipping address. You must provide accurate and current information."
        },
        {
            number: "04",
            title: "No-Purchase Requirement",
            content: "Giveaway entry is completely free. No purchase or payment is required to participate. Our platform is 100% verified and legitimate."
        },
        {
            number: "05",
            title: "Fair Play & Entry Rules",
            content: "One entry per person per giveaway. Creating multiple accounts, using automated scripts, or any form of cheating will result in immediate disqualification and account suspension."
        },
        {
            number: "06",
            title: "Winner Selection & Verification",
            content: "Winners are selected via a fair, computerized random process. Winners must provide valid identification for verification. Prizes must be claimed within 7 days of notification."
        },
        {
            number: "07",
            title: "Prizes & Delivery",
            content: "Prizes are non-transferable. Physical prizes typically take 7–15 business days for delivery within India. We are not responsible for courier delays or address-related issues."
        },
        {
            number: "08",
            title: "Intellectual Property Rights",
            content: "All software, content, logos, graphics, and trademarks on the Platform are owned by or licensed to OneMoreGift. Unauthorized copying, distribution, or reverse engineering is prohibited."
        },
        {
            number: "09",
            title: "User Content & Feedback",
            content: "Any content, feedback, or suggestions you submit grants us a non-exclusive, royalty-free license to use it for operating and improving the Platform."
        },
        {
            number: "10",
            title: "Prohibited Conduct",
            content: "You must not impersonate others, tamper with Platform security, violate applicable laws, or engage in any fraudulent activity. Violations may result in account termination."
        },
        {
            number: "11",
            title: "Disclaimer of Warranties",
            content: "The Platform is provided 'as is' and 'as available'. While we use commercially reasonable safeguards, we do not guarantee uninterrupted availability or error-free operation."
        },
        {
            number: "12",
            title: "Limitation of Liability",
            content: "To the maximum extent permitted by law, OneMoreGift is not liable for indirect, incidental, special, or consequential damages arising from your use of the Platform."
        },
        {
            number: "13",
            title: "Termination & Suspension",
            content: "We reserve the right to suspend or terminate accounts for policy violations, legal requirements, fraud prevention, or security risks. You may stop using the Platform anytime."
        },
        {
            number: "14",
            title: "Privacy & Data Protection",
            content: "Your personal data is protected and used solely for giveaway participation and prize fulfillment. We do not sell your information to third parties. See our Privacy Policy for details."
        },
        {
            number: "15",
            title: "Governing Law",
            content: "These Terms are governed by the laws of India. Exclusive jurisdiction lies with courts at New Delhi, India, subject to mandatory consumer forum rights under applicable law."
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="glass-dark border-white/10 rounded-3xl max-w-3xl w-[95vw] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <DialogHeader className="p-6 md:p-8 pb-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/30">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                    Terms & Conditions
                                </DialogTitle>
                                <DialogDescription className="text-neutral-500 font-medium text-sm md:text-base">
                                    Effective Date: May 28, 2026 | Version: 2026-05-28
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 px-6 md:px-8 overflow-hidden flex flex-col">
                    <div
                        className="flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar"
                        onScroll={handleScroll}
                        ref={scrollRef}
                    >
                        <div className="space-y-6 py-4 text-neutral-400 text-sm md:text-base leading-relaxed">
                            {termsContent.map((section) => (
                                <section key={section.number} className="group">
                                    <div className="flex gap-3 md:gap-4">
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs md:text-sm font-bold text-white bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-600/20 group-hover:shadow-lg group-hover:shadow-red-600/40 transition-shadow">
                                                {section.number}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold text-base md:text-lg mb-2 group-hover:text-red-400 transition-colors">
                                                {section.title}
                                            </h4>
                                            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                                                {section.content}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            ))}

                            {/* Privacy Note Box */}
                            <div className="mt-8 bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-500/20 p-4 md:p-6 rounded-2xl">
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-red-400" />
                                    Privacy & Security
                                </h4>
                                <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-3">
                                    We take your privacy seriously. Your personal data is used solely for giveaway participation and prize fulfillment. We do not share or sell your information to third parties.
                                </p>
                                <p className="text-neutral-500 text-xs md:text-sm">
                                    For complete privacy details, visit our{" "}
                                    <Link href="/privacy-policy" className="text-red-400 hover:text-red-300 font-semibold underline">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {/* Scroll Indicator */}
                        {!hasScrolledToBottom && (
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                                <span className="text-[10px] md:text-xs text-red-400 font-bold uppercase tracking-widest animate-pulse">
                                    Scroll to Continue
                                </span>
                                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-red-500 animate-bounce" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 md:p-8 pt-4 bg-white/[0.02] border-t border-white/10 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white font-medium transition-colors"
                            onClick={() => onOpenChange(false)}
                        >
                            Decline
                        </Button>
                        <Button
                            disabled={!hasScrolledToBottom}
                            className={`flex-1 rounded-xl font-bold h-11 md:h-12 transition-all duration-300 flex items-center justify-center gap-2 ${hasScrolledToBottom
                                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30 hover:shadow-red-600/50'
                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                                }`}
                            onClick={() => {
                                onAccept?.();
                                onOpenChange(false);
                            }}
                        >
                            {hasScrolledToBottom ? (
                                <>
                                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                                    <span>I Agree & Continue</span>
                                </>
                            ) : (
                                "Scroll to Read All"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
