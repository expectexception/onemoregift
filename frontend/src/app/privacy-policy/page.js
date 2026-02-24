"use client"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HiLockClosed } from "react-icons/hi";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            {/* Hero */}
            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm shadow-xl">
                        <HiLockClosed className="text-red-500" />
                        <span className="text-neutral-300 text-sm font-medium tracking-wide uppercase">Your Data Matters</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Policy</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Last updated: February 2026. We are committed to safeguarding your personal information and being transparent about its use.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="flex-1 px-4 sm:px-6 pb-24 relative z-10 w-full">
                <div className="max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="premium-card rounded-3xl p-6 sm:p-10 md:p-14 space-y-10 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px]"></div>

                        <div className="relative z-10 space-y-10">
                            <PolicySection
                                number="01"
                                title="Information We Collect"
                                content={<>
                                    <strong className="text-white font-semibold">Personal Information:</strong> When you register on OneMoreGift, we collect your name, email address, phone number, and shipping address. This information is necessary to manage your account, process entries, and deliver prizes.<br /><br />
                                    <strong className="text-white font-semibold">Automatically Collected Data:</strong> We collect certain technical data when you visit our Platform, including your IP address, browser type and version, device type, operating system, referring URLs, pages visited, time spent on pages, and click patterns. This data helps us understand usage patterns and improve our services.<br /><br />
                                    <strong className="text-white font-semibold">Google Sign-In Data:</strong> If you register or log in using Google OAuth, we receive your Google profile name and email address. We do not access your Google contacts, drive, or any other Google services.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <PolicySection
                                number="02"
                                title="How We Use Your Information"
                                content={<>
                                    We use your personal information for the following purposes:<br /><br />
                                    <ul className="list-disc list-outside space-y-3 ml-5 marker:text-red-500">
                                        <li>Account creation, authentication, and session management</li>
                                        <li>Processing giveaway entries and verifying participant eligibility</li>
                                        <li>Selecting and notifying winners via email</li>
                                        <li>Shipping prizes to winners&apos; registered addresses</li>
                                        <li>Communicating service updates, policy changes, and support responses</li>
                                        <li>Detecting and preventing fraud, abuse, and unauthorized access</li>
                                        <li>Analyzing aggregated, anonymized usage data to improve Platform performance</li>
                                    </ul>
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <PolicySection
                                number="03"
                                title="Data Storage & Security"
                                content={<>
                                    <strong className="text-white font-semibold">Storage:</strong> Your data is stored on secure cloud infrastructure (MongoDB Atlas) with encryption at rest and in transit. Our servers are hosted in geographically distributed data centers with enterprise-grade security.<br /><br />
                                    <strong className="text-white font-semibold">Security Measures:</strong> We implement multiple layers of security including SSL/TLS encryption for all data transmission, bcrypt password hashing, JWT-based session tokens with expiration, rate limiting on authentication endpoints, and regular security audits.<br /><br />
                                    <strong className="text-white font-semibold">Retention:</strong> We retain your personal data for as long as your account is active or as needed to provide services. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <PolicySection
                                number="04"
                                title="Data Sharing & Third Parties"
                                content={<>
                                    <strong className="text-white font-semibold">We Do Not Sell Your Data:</strong> OneMoreGift does not sell, rent, or trade your personal information to third parties for marketing or any other purpose.<br /><br />
                                    <strong className="text-white font-semibold">Limited Sharing:</strong> We may share your data only in these circumstances:<br /><br />
                                    <ul className="list-disc list-outside space-y-3 ml-5 marker:text-red-500">
                                        <li><strong className="text-white font-semibold">Prize Delivery:</strong> Shipping address shared with courier partners solely for prize delivery</li>
                                        <li><strong className="text-white font-semibold">Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request</li>
                                        <li><strong className="text-white font-semibold">Platform Protection:</strong> To enforce our terms, protect our rights, or investigate potential violations</li>
                                        <li><strong className="text-white font-semibold">Google OAuth:</strong> Authentication data processed through Google&apos;s secure OAuth 2.0 protocol</li>
                                    </ul>
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <PolicySection
                                number="05"
                                title="Cookies & Tracking"
                                content={<>
                                    <strong className="text-white font-semibold">Essential Cookies:</strong> We use essential cookies to maintain your login session and remember your preferences. These are required for the Platform to function correctly and cannot be disabled.<br /><br />
                                    <strong className="text-white font-semibold">Analytics:</strong> We may use anonymous analytics tools to understand how visitors interact with our Platform. This data is aggregated and cannot be used to identify individual users.<br /><br />
                                    <strong className="text-white font-semibold">No Advertising Cookies:</strong> We do not use advertising cookies or tracking pixels from third-party ad networks. Your browsing activity on OneMoreGift is not shared with advertisers.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <PolicySection
                                number="06"
                                title="Your Rights & Choices"
                                content={<>
                                    You have the following rights regarding your personal data:<br /><br />
                                    <ul className="list-disc list-outside space-y-3 ml-5 marker:text-red-500">
                                        <li><strong className="text-white font-semibold">Access:</strong> Request a copy of the personal data we hold about you</li>
                                        <li><strong className="text-white font-semibold">Correction:</strong> Update or correct inaccurate personal information through your profile settings</li>
                                        <li><strong className="text-white font-semibold">Deletion:</strong> Request deletion of your account and associated data</li>
                                        <li><strong className="text-white font-semibold">Portability:</strong> Request your data in a structured, machine-readable format</li>
                                        <li><strong className="text-white font-semibold">Withdrawal of Consent:</strong> Withdraw consent for data processing at any time (this may limit Platform functionality)</li>
                                    </ul>
                                    <br />
                                    To exercise any of these rights, email us at <a href="mailto:contact@onemoregift.in" className="text-red-400 hover:text-red-300 transition-colors font-medium">contact@onemoregift.in</a> with the subject line &quot;Data Request&quot;. We will respond within 15 business days.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <PolicySection
                                number="07"
                                title="Children's Privacy"
                                content={<>
                                    OneMoreGift is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from minors. If we discover that a user is under 18, we will promptly delete their account and all associated data. If you believe a minor has registered on our Platform, please contact us immediately at <a href="mailto:contact@onemoregift.in" className="text-red-400 hover:text-red-300 transition-colors font-medium">contact@onemoregift.in</a>.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <PolicySection
                                number="08"
                                title="Changes to This Policy"
                                content={<>
                                    We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or Platform features. When we make significant changes, we will notify registered users via email and update the &quot;Last updated&quot; date at the top of this page. We encourage you to review this policy periodically. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated policy.
                                </>}
                            />

                            <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 text-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
                                <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <HiLockClosed className="text-red-500 text-xl" />
                                </div>
                                <p className="text-neutral-400 text-base leading-relaxed max-w-lg mx-auto">
                                    For any privacy concerns, data requests, or questions about this policy, contact our data protection team at{" "}
                                    <a href="mailto:contact@onemoregift.in" className="text-red-400 hover:text-red-300 transition-colors font-medium">
                                        contact@onemoregift.in
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

function PolicySection({ number, title, content }) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 group">
            <div className="flex-shrink-0 pt-1">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent group-hover:from-red-500/40 transition-all duration-300 tabular-nums">{number}</span>
            </div>
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors">{title}</h3>
                <div className="text-neutral-300 leading-relaxed text-base sm:text-lg">{content}</div>
            </div>
        </div>
    );
}
