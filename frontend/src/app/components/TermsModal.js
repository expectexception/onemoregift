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
import { Check, ShieldCheck, FileText, ChevronDown } from "lucide-react";

export default function TermsModal({ isOpen, onOpenChange, onAccept }) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Allow a small buffer (5px) for rounding errors
        if (scrollHeight - scrollTop <= clientHeight + 5) {
            setHasScrolledToBottom(true);
        }
    };

    // Reset scroll state when modal opens
    useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="glass-dark border-white/10 rounded-3xl max-w-2xl w-[95vw] p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">Terms of Service</DialogTitle>
                            <DialogDescription className="text-neutral-500 font-medium">Please review our guidelines to continue</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 flex flex-col h-[50vh]">
                    <div
                        className="flex-1 overflow-y-auto pr-4 custom-scrollbar relative"
                        onScroll={handleScroll}
                        ref={scrollRef}
                    >
                        <div className="space-y-8 py-4 text-neutral-400 text-sm leading-relaxed">
                            <section>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="text-red-500 text-xs font-bold px-2 py-0.5 rounded bg-red-500/10">01</span>
                                    Acceptance of Terms
                                </h4>
                                <p>By accessing or using the OneMoreGift platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Platform.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="text-red-500 text-xs font-bold px-2 py-0.5 rounded bg-red-500/10">02</span>
                                    Eligibility Requirements
                                </h4>
                                <p>You must be at least 18 years of age. Participation is currently limited to residents of India with a valid Indian shipping address. Accurate personal information is mandatory.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="text-red-500 text-xs font-bold px-2 py-0.5 rounded bg-red-500/10">03</span>
                                    Entry Rules & Fair Play
                                </h4>
                                <p>Entering giveaways is always free. One entry per person per giveaway. Multiple accounts or automated scripts are strictly prohibited and will lead to immediate disqualification.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="text-red-500 text-xs font-bold px-2 py-0.5 rounded bg-red-500/10">04</span>
                                    Prizes & Delivery
                                </h4>
                                <p>Prizes are non-transferable. Physical prizes take 7–15 business days for delivery within India. We are not responsible for courier delays or incorrect address details provided by you.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="text-red-500 text-xs font-bold px-2 py-0.5 rounded bg-red-500/10">05</span>
                                    Winner Selection
                                </h4>
                                <p>Winners are selected via a fair, computerized random process. Notification is sent within 48 hours via email. Winners must claim their prize within 7 days of notification.</p>
                            </section>

                            <section className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-red-500" />
                                    Privacy Policy Note
                                </h4>
                                <p>We value your privacy. Your data is used solely for giveaway participation and prize fulfillment. We do not sell your personal information to third parties.</p>
                            </section>
                        </div>

                        {!hasScrolledToBottom && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce pointer-events-none">
                                <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Scroll Down</span>
                                <ChevronDown className="w-4 h-4 text-red-500" />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-8 pt-4 bg-white/[0.01] border-t border-white/[0.06]">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl border-white/10 hover:bg-white/5 text-neutral-400"
                            onClick={() => onOpenChange(false)}
                        >
                            Decline
                        </Button>
                        <Button
                            disabled={!hasScrolledToBottom}
                            className={`flex-1 rounded-xl font-bold h-12 transition-all duration-300 ${hasScrolledToBottom
                                ? 'btn-gradient shadow-lg shadow-red-600/20'
                                : 'bg-neutral-800 text-neutral-500 grayscale cursor-not-allowed opacity-50'
                                }`}
                            onClick={() => {
                                onAccept();
                                onOpenChange(false);
                            }}
                        >
                            {hasScrolledToBottom ? (
                                <span className="flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    I Agree to Terms
                                </span>
                            ) : "Scroll to Read All"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
