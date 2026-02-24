import Image from "next/image";
import Link from "next/link";
import { HiOutlineMail, HiHeart, HiGlobe } from "react-icons/hi";
import { FaFacebook, FaTwitter, FaInstagram, FaTelegram } from "react-icons/fa";
import { HiGift } from "react-icons/hi2";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden bg-black">
            {/* Top Line */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

            {/* Main Footer */}
            <div className="py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Footer Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-glow">
                                    <HiGift className="text-white text-2xl" />
                                </div>
                                <span className="text-2xl font-bold text-white">
                                    OneMore<span className="text-gradient">Gift</span>
                                </span>
                            </div>
                            <p className="text-neutral-500 text-base leading-relaxed max-w-md mb-6">
                                India&apos;s leading premium giveaway platform. Win real rewards by participating in our daily updated contests. 100% verified and legitimate.
                            </p>
                            {/* Social Links */}
                            <div className="flex gap-3">
                                <SocialIcon icon={<FaFacebook />} href="#" />
                                <SocialIcon icon={<FaTwitter />} href="#" />
                                <SocialIcon icon={<FaInstagram />} href="#" />
                                <SocialIcon icon={<FaTelegram />} href="#" />
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-semibold text-lg mb-6">Quick Links</h4>
                            <ul className="space-y-3">
                                <FooterLink href="/giveaway" label="Active Giveaways" />
                                <FooterLink href="/winners" label="Recent Winners" />
                                <FooterLink href="/about-us" label="About Us" />
                                <FooterLink href="/faq" label="FAQ" />
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-white font-semibold text-lg mb-6">Legal</h4>
                            <ul className="space-y-3">
                                <FooterLink href="/terms-conditions" label="Terms & Conditions" />
                                <FooterLink href="/privacy-policy" label="Privacy Policy" />
                            </ul>

                            {/* Contact */}
                            <h4 className="text-white font-semibold text-lg mt-8 mb-4">Contact</h4>
                            <a
                                href="mailto:contact@onemoregift.in"
                                className="flex items-center gap-2 text-neutral-500 hover:text-red-400 transition-colors"
                            >
                                <HiOutlineMail className="text-lg text-red-500" />
                                <span>contact@onemoregift.in</span>
                            </a>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/[0.06]">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-neutral-600 text-sm text-center md:text-left">
                                &copy; {currentYear} OneMoreGift. All rights reserved.
                            </p>
                            
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialIcon({ icon, href }) {
    return (
        <a
            href={href}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.08] text-neutral-500 hover:border-red-600/40 hover:text-red-400 transition-all duration-300 hover:shadow-glow bg-white/[0.02]"
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, label }) {
    return (
        <li>
            <Link
                href={href}
                className="text-neutral-500 hover:text-white transition-colors duration-300 text-sm"
            >
                {label}
            </Link>
        </li>
    );
}
