"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from "react-icons/hi";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import AnimatedGiftSVG from "./AnimatedGiftSVG";
import { fetchSiteConfig } from "../utils/siteConfig";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    // Contact details are admin-editable, so they are read from the live config
    // rather than hardcoded. Anything left blank simply doesn't render.
    const [contact, setContact] = useState({
        contactEmail: "contact@onemoregift.in",
        contactPhone: "",
        contactWhatsapp: "",
        businessAddress: "",
        instagramUrl: "",
    });

    useEffect(() => {
        let cancelled = false;
        fetchSiteConfig()
            .then((cfg) => {
                if (cancelled || !cfg) return;
                setContact((prev) => ({
                    contactEmail: cfg.contactEmail ?? prev.contactEmail,
                    contactPhone: cfg.contactPhone ?? "",
                    contactWhatsapp: cfg.contactWhatsapp ?? "",
                    businessAddress: cfg.businessAddress ?? "",
                    instagramUrl: cfg.instagramUrl ?? "",
                }));
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const whatsappDigits = String(contact.contactWhatsapp || "").replace(/\D/g, "");

    return (
        <footer className="relative overflow-hidden bg-black">
            {/* Top Line */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

            {/* Main Footer */}
            <div className="py-12 sm:py-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Footer Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
                        {/* Brand Column */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
                                <AnimatedGiftSVG className="w-12 sm:w-14 h-12 sm:h-14 flex-shrink-0" />
                                <span className="text-xl sm:text-2xl font-bold text-white">
                                    OneMore<span className="text-gradient">Gift</span>
                                </span>
                            </div>
                            <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-md mb-4 sm:mb-6">
                                Earn exciting gifts for free by joining giveaways and completing simple tasks. Our platform makes it easy, safe, and rewarding to participate. Start today, collect rewards, and discover how fun earning free gifts can be!
                            </p>

                            {contact.businessAddress && (
                                <div className="flex items-start gap-2.5 text-sm text-neutral-500 max-w-md">
                                    <HiOutlineLocationMarker className="text-lg flex-shrink-0 text-red-500 mt-0.5" />
                                    <address className="not-italic whitespace-pre-line leading-relaxed">
                                        {contact.businessAddress}
                                    </address>
                                </div>
                            )}

                            {(whatsappDigits || contact.instagramUrl) && (
                                <div className="flex items-center gap-3 mt-5">
                                    {whatsappDigits && (
                                        <a
                                            href={`https://wa.me/${whatsappDigits}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Chat on WhatsApp"
                                            className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                                        >
                                            <FaWhatsapp className="text-lg" />
                                        </a>
                                    )}
                                    {contact.instagramUrl && (
                                        <a
                                            href={contact.instagramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Instagram"
                                            className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-neutral-400 hover:text-fuchsia-400 hover:border-fuchsia-500/30 transition-colors"
                                        >
                                            <FaInstagram className="text-lg" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6">Quick Links</h4>
                            <ul className="space-y-2 sm:space-y-3">
                                <FooterLink href="/giveaway" label="Active Giveaways" />
                                <FooterLink href="/shop" label="Gift Shop" />
                                <FooterLink href="/winners" label="Recent Winners" />
                                <FooterLink href="/about-us" label="About Us" />
                                <FooterLink href="/faq" label="FAQ" />
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6">Legal</h4>
                            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                                <FooterLink href="/terms-conditions" label="Terms & Conditions" />
                                <FooterLink href="/privacy-policy" label="Privacy Policy" />
                            </ul>

                            {/* Contact */}
                            <h4 className="text-white font-semibold text-base sm:text-lg mb-3 sm:mb-4">Contact</h4>
                            <div className="space-y-2.5">
                                {contact.contactEmail && (
                                    <a
                                        href={`mailto:${contact.contactEmail}`}
                                        className="flex items-center gap-2 text-sm sm:text-base text-neutral-500 hover:text-red-400 transition-colors"
                                    >
                                        <HiOutlineMail className="text-lg flex-shrink-0 text-red-500" />
                                        <span className="break-all">{contact.contactEmail}</span>
                                    </a>
                                )}
                                {contact.contactPhone && (
                                    <a
                                        href={`tel:${contact.contactPhone.replace(/\s/g, "")}`}
                                        className="flex items-center gap-2 text-sm sm:text-base text-neutral-500 hover:text-red-400 transition-colors"
                                    >
                                        <HiOutlinePhone className="text-lg flex-shrink-0 text-red-500" />
                                        <span>{contact.contactPhone}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-6 sm:pt-8 border-t border-white/[0.06]">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                            <p className="text-xs sm:text-sm text-neutral-600 text-center sm:text-left">
                                &copy; {currentYear} OneMoreGift. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, label }) {
    return (
        <li>
            <Link
                href={href}
                className="text-sm sm:text-base text-neutral-500 hover:text-white transition-colors duration-300"
            >
                {label}
            </Link>
        </li>
    );
}
