"use client"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HiDocumentText } from "react-icons/hi";

export default function TermsConditions() {
    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            {/* Hero */}
            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
                <div className="absolute top-20 right-1/2 translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm shadow-xl">
                        <HiDocumentText className="text-red-500" />
                        <span className="text-neutral-300 text-sm font-medium tracking-wide uppercase">Legal Agreement</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Conditions</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Last updated: February 2026. Please read these terms carefully before using OneMoreGift.
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
                            <TermSection
                                number="01"
                                title="Acceptance of Terms"
                                content={<>
                                    By accessing or using the OneMoreGift platform (&quot;Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Platform. These terms apply to all visitors, users, and participants. OneMoreGift reserves the right to update these terms at any time, and your continued use of the Platform after such changes constitutes acceptance of the revised terms.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="02"
                                title="Eligibility Requirements"
                                content={<>
                                    <strong className="text-white font-semibold">Age Requirement:</strong> You must be at least 18 years of age to register and participate in giveaways on OneMoreGift.<br /><br />
                                    <strong className="text-white font-semibold">Geographic Restriction:</strong> Participation is currently limited to residents of India with a valid Indian shipping address for physical prize delivery.<br /><br />
                                    <strong className="text-white font-semibold">Account Requirement:</strong> A valid, verified account with accurate personal information (name, email, phone number) is required. Providing false or misleading information may result in immediate account suspension and forfeiture of any prizes won.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="03"
                                title="Entry Rules & Fair Play"
                                content={<>
                                    <strong className="text-white font-semibold">No Purchase Necessary:</strong> Entering giveaways is always free. No payment, fee, or purchase is required to enter or win any giveaway on OneMoreGift.<br /><br />
                                    <strong className="text-white font-semibold">One Entry Per Person:</strong> Each participant is limited to one entry per giveaway using one account. Creating multiple accounts, using automated scripts, bots, or any other method to gain additional entries is strictly prohibited.<br /><br />
                                    <strong className="text-white font-semibold">Fair Play:</strong> Any attempt to manipulate, exploit, or interfere with the proper functioning of a giveaway will result in disqualification and permanent account ban. This includes, but is not limited to, using VPNs to bypass restrictions, exploiting bugs, or colluding with other participants.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="04"
                                title="Prizes & Delivery"
                                content={<>
                                    <strong className="text-white font-semibold">Prize Description:</strong> Each giveaway listing specifies the prize(s) available. Prize images are for illustration purposes and may differ slightly from the actual product. Prize values listed are approximate retail values and may fluctuate.<br /><br />
                                    <strong className="text-white font-semibold">Non-Transferable:</strong> Prizes are non-transferable and cannot be exchanged for cash or other items unless explicitly stated in the giveaway listing.<br /><br />
                                    <strong className="text-white font-semibold">Delivery:</strong> Physical prizes will be shipped to the winner&apos;s registered address within India. Shipping typically takes 7–15 business days after winner verification. OneMoreGift is not responsible for delays caused by courier services, incorrect addresses, or circumstances beyond our control. Winners are responsible for ensuring their shipping address is accurate and up to date.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="05"
                                title="Winner Selection & Notification"
                                content={<>
                                    <strong className="text-white font-semibold">Random Selection:</strong> Winners are selected using a computerized random selection process after the giveaway end date. The selection process is fair, unbiased, and verifiable.<br /><br />
                                    <strong className="text-white font-semibold">Notification:</strong> Winners will be notified via their registered email address within 48 hours of selection. Results are also published on our Winners page.<br /><br />
                                    <strong className="text-white font-semibold">Claiming Prizes:</strong> Winners must respond to the notification email within 7 days to confirm their details and claim the prize. Failure to respond within this period may result in forfeiture, and an alternate winner may be selected. Winners may be required to provide proof of identity for verification purposes.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="06"
                                title="User Conduct & Account Termination"
                                content={<>
                                    Users agree not to: use the Platform for any unlawful purpose; impersonate another person or entity; interfere with or disrupt the Platform or its servers; attempt to gain unauthorized access to any portion of the Platform; harvest or collect user information without consent; or post or transmit any harmful, threatening, or objectionable content.<br /><br />
                                    OneMoreGift reserves the right to suspend or terminate any user account at its sole discretion, without prior notice, for violations of these terms or any behavior deemed harmful to the Platform or its community. Terminated users forfeit any pending prizes or entries.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="07"
                                title="Intellectual Property"
                                content={<>
                                    All content on the Platform including text, graphics, logos, images, and software is the property of OneMoreGift or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any Platform content without prior written consent from OneMoreGift.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="08"
                                title="Limitation of Liability"
                                content={<>
                                    OneMoreGift provides the Platform on an &quot;as is&quot; and &quot;as available&quot; basis. We make no warranties, express or implied, regarding the Platform&apos;s reliability, availability, or fitness for a particular purpose. To the maximum extent permitted by law, OneMoreGift shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform. Our total liability shall not exceed the value of the prize in dispute.
                                </>}
                            />
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <TermSection
                                number="09"
                                title="Governing Law & Dispute Resolution"
                                content={<>
                                    These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts in New Delhi, India. Before initiating any legal proceedings, parties agree to attempt resolution through good-faith negotiation for a period of 30 days.
                                </>}
                            />

                            <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 text-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
                                <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <HiDocumentText className="text-red-500 text-xl" />
                                </div>
                                <p className="text-neutral-400 text-base leading-relaxed max-w-lg mx-auto">
                                    By creating an account or participating in any giveaway on OneMoreGift, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. For questions regarding these terms, contact us at{" "}
                                    <a href="mailto:contact@onemoregift.in" className="text-red-400 hover:text-red-300 transition-colors font-medium">contact@onemoregift.in</a>
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

function TermSection({ number, title, content }) {
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
