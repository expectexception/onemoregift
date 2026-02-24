"use client";
import { useState, useMemo } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HelpCircle, MessageSquare, Trophy, Settings, Search } from "lucide-react";
import Link from "next/link";

const categories = [
    { key: "all", label: "All", icon: HelpCircle },
    { key: "general", label: "General", icon: HelpCircle },
    { key: "account", label: "Account", icon: Settings },
    { key: "prizes", label: "Prizes & Winners", icon: Trophy },
    { key: "technical", label: "Technical", icon: MessageSquare },
];

const faqs = [
    {
        category: "general",
        question: "What is OneMoreGift?",
        answer: "OneMoreGift is India's premier online giveaway platform where brands and creators host exciting prize giveaways. We connect participants with legitimate opportunities to win real prizes through fair, transparent draws."
    },
    {
        category: "general",
        question: "Is OneMoreGift free to use?",
        answer: "Yes! OneMoreGift is completely free for participants. Simply register an account and start entering giveaways. We never charge any entry fees."
    },
    {
        category: "general",
        question: "How do I enter a giveaway?",
        answer: "Browse the active giveaways on our homepage, click on one that interests you, and click the 'Enter Giveaway' button. You must be logged in to enter. Each giveaway may have specific entry requirements listed on its page."
    },
    {
        category: "general",
        question: "Can I enter the same giveaway multiple times?",
        answer: "No. Each user is limited to one entry per giveaway to ensure fair participation. Our system automatically prevents duplicate entries."
    },
    {
        category: "account",
        question: "How do I create an account?",
        answer: "Click 'Sign Up' in the top navigation bar. You can register using your email and phone number, or sign up instantly with your Google account. Ensure your information is accurate for prize delivery purposes."
    },
    {
        category: "account",
        question: "Can I sign in with Google?",
        answer: "Yes! You can use Google Sign-In for a quick, password-free registration and login experience. Your account will be linked to your Google email automatically."
    },
    {
        category: "account",
        question: "I forgot my password. How do I reset it?",
        answer: "On the login page, click 'Forgot Password?' and enter your registered email. You'll receive a password reset link in your inbox. Check your spam folder if you don't see it within a few minutes."
    },
    {
        category: "account",
        question: "Can I change my registered phone number?",
        answer: "Currently, phone number changes must be done through account settings or by contacting our support team at support@onemoregift.in. We are working on a self-service option."
    },
    {
        category: "prizes",
        question: "How are winners selected?",
        answer: "Winners are selected randomly and fairly using our certified random draw system after the giveaway closes. Every eligible participant has an equal chance of winning."
    },
    {
        category: "prizes",
        question: "How will I know if I've won?",
        answer: "If you win, you'll receive an email notification at your registered email address. The winner is also announced on the giveaway page. Make sure to check your account dashboard regularly."
    },
    {
        category: "prizes",
        question: "How long does prize delivery take?",
        answer: "Once you respond to our winner notification, tax compliance documents (if applicable) are collected and the prize is dispatched within 7–15 business days, depending on the prize type and your location."
    },
    {
        category: "prizes",
        question: "Can prizes be exchanged for cash?",
        answer: "No. Prizes are non-transferable and cannot be exchanged for cash alternatives, unless explicitly stated in the giveaway's terms."
    },
    {
        category: "technical",
        question: "What devices can I use to access OneMoreGift?",
        answer: "OneMoreGift is fully responsive and works on all modern browsers desktop, tablet, and mobile. We recommend using Chrome, Firefox, Safari, or Edge for the best experience."
    },
    {
        category: "technical",
        question: "Is my personal data safe?",
        answer: "We take your privacy seriously. We use industry-standard encryption and never sell your data to third parties. Please read our Privacy Policy for full details on how we handle your information."
    },
    {
        category: "technical",
        question: "I'm having trouble entering a giveaway. What should I do?",
        answer: "First, make sure you're logged into your account and that you haven't already entered this giveaway. If problems persist, try clearing your browser cache, switching browsers, or contacting us at support@onemoregift.in."
    },
    {
        category: "technical",
        question: "Why am I not receiving OTP emails?",
        answer: "If you're not receiving OTP emails, please: (1) check your spam or junk folder, (2) ensure you entered the correct email address, (3) wait a few minutes, and (4) use the 'Resend OTP' option. If the issue continues, contact support."
    },
];

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFaqs = useMemo(() => {
        return faqs.filter((faq) => {
            const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
            const matchesSearch = !searchQuery.trim() ||
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    return (
        <div className="min-h-screen bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            {/* Hero */}
            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 max-w-3xl mx-auto px-6 text-center animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm shadow-xl">
                        <HelpCircle className="w-4 h-4 text-red-500" />
                        <span className="text-neutral-300 text-sm font-medium tracking-wide uppercase">Support Center</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">help you?</span>
                    </h1>
                    <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Find answers to common questions about OneMoreGift, giveaways, prizes, and your account.
                    </p>
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
                {/* Search */}
                <div className="relative mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search for questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 focus:bg-white/10 transition-all text-lg shadow-inner"
                    />
                </div>

                {/* Category Tabs - Mobile optimized horizontal scroll */}
                <div className="mb-10 w-full overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex flex-nowrap md:flex-wrap gap-3 pb-4 md:pb-0 overflow-x-auto scrollbar-hide md:justify-center px-1">
                        {categories.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => { setActiveCategory(key); setSearchQuery(""); }}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${activeCategory === key
                                    ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transform scale-105"
                                    : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FAQ Accordion */}
                <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
                    {filteredFaqs.length > 0 ? (
                        <Accordion type="single" collapsible className="space-y-4">
                            {filteredFaqs.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
                                >
                                    <AccordionTrigger className="px-6 py-5 text-left text-white hover:text-red-400 hover:no-underline font-semibold text-lg transition-colors group">
                                        <span className="flex-1 pr-4">{faq.question}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2 text-neutral-400 leading-relaxed text-base border-t border-white/5 mt-2">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-20 premium-card rounded-3xl border border-white/5">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <HelpCircle className="w-10 h-10 text-neutral-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No results found</h3>
                            <p className="text-neutral-500 text-lg max-w-md mx-auto">
                                We couldn't find any answers matching your search. Try adjusting your keywords or selecting a different category.
                            </p>
                        </div>
                    )}
                </div>

                {/* Contact CTA */}
                <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-10 text-center relative overflow-hidden animate-fade-up" style={{ animationDelay: '0.4s' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 w-20 h-20 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 rotate-3 shadow-[0_0_30px_rgba(220,38,38,0.15)]">
                        <MessageSquare className="w-10 h-10 text-red-500 -rotate-3" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Still have questions?</h3>
                    <p className="text-neutral-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                        Our dedicated support team is always here to help. Reach out and we'll get back to you within 24 hours.
                    </p>
                    <Link
                        href="mailto:support@onemoregift.in"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl btn-gradient text-white font-semibold transition-all hover:scale-105 shadow-glow text-lg w-full sm:w-auto"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Contact Support
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
