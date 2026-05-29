import Link from "next/link";
import { HiOutlineMail } from "react-icons/hi";
import AnimatedGiftSVG from "./AnimatedGiftSVG";

export default function Footer() {
    const currentYear = new Date().getFullYear();

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
                                India&apos;s leading premium giveaway platform. Win real rewards by participating in our daily updated contests. 100% verified and legitimate.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6">Quick Links</h4>
                            <ul className="space-y-2 sm:space-y-3">
                                <FooterLink href="/giveaway" label="Active Giveaways" />
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
                            <a
                                href="mailto:contact@onemoregift.in"
                                className="flex items-center gap-2 text-sm sm:text-base text-neutral-500 hover:text-red-400 transition-colors"
                            >
                                <HiOutlineMail className="text-lg flex-shrink-0 text-red-500" />
                                <span className="break-all">contact@onemoregift.in</span>
                            </a>
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
