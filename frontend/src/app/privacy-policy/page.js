"use client"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HiLockClosed } from "react-icons/hi";

const EFFECTIVE_DATE = "May 28, 2026";
const POLICY_VERSION = "2026-05-28";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6">
                        <HiLockClosed className="text-red-500" />
                        <span className="text-neutral-300 text-sm font-medium tracking-wide uppercase">Data Protection</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Policy</span>
                    </h1>
                    <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Effective Date: {EFFECTIVE_DATE} | Version: {POLICY_VERSION}
                    </p>
                </div>
            </section>

            <section className="flex-1 px-4 sm:px-6 pb-24 relative z-10 w-full">
                <div className="max-w-4xl mx-auto">
                    <div className="premium-card rounded-3xl p-6 sm:p-10 md:p-14 space-y-10 border border-white/10">
                        <PolicySection
                            number="01"
                            title="Scope"
                            content="This Privacy Policy explains how OneMoreGift collects, uses, stores, shares, and protects personal data when you use our Platform in India."
                        />
                        
                        <PolicySection
                            number="03"
                            title="Personal Data We Collect"
                            content="Identifiers (name, email, phone), account credentials (hashed password), profile information (address, avatar), participation records, winner/claim records, support communications, and device/network metadata (IP, browser, logs)."
                        />
                        <PolicySection
                            number="04"
                            title="How We Collect Data"
                            content="Data is collected directly from you during registration and profile updates, from Google OAuth when you sign in via Google, and automatically through platform logs/cookies needed for service security and operation."
                        />
                        <PolicySection
                            number="05"
                            title="Purposes of Processing"
                            content="We process data to create and secure your account, administer giveaways, detect abuse/fraud, verify winners, deliver prizes, provide support, comply with legal obligations, and improve service quality."
                        />
                        <PolicySection
                            number="06"
                            title="Legal Basis and Consent"
                            content="Where required, processing is based on your consent. For account creation, we record your acceptance of Terms and Privacy Policy with timestamp, policy version, and technical metadata. Certain processing may continue if required by law."
                        />
                        <PolicySection
                            number="07"
                            title="Data Sharing"
                            content="We do not sell personal data. We may share limited data with service providers (email/courier/cloud), legal authorities when required, and internal teams under strict access controls."
                        />
                        <PolicySection
                            number="08"
                            title="Cross-Border Processing"
                            content="Some processors or infrastructure may operate outside India. We implement contractual and security safeguards appropriate to the data and applicable law."
                        />
                        <PolicySection
                            number="09"
                            title="Retention"
                            content="Data is retained only as long as needed for the stated purposes, account operation, dispute handling, fraud prevention, and legal compliance. When no longer required, data is deleted or anonymized."
                        />
                        <PolicySection
                            number="10"
                            title="Security Controls"
                            content="We use technical and organizational safeguards such as access control, encryption in transit, password hashing, monitoring, and incident response. No method is 100% secure, but we apply commercially reasonable protection."
                        />
                        <PolicySection
                            number="11"
                            title="Your Rights"
                            content="Subject to applicable law, you may request access, correction, erasure, grievance redressal, and withdrawal of consent. You can submit requests at contact@onemoregift.in."
                        />
                        <PolicySection
                            number="12"
                            title="Children's Data"
                            content="The Platform is not intended for children under 18. If we learn that an underage user account exists, we may suspend and remove associated personal data in accordance with law."
                        />
                        <PolicySection
                            number="13"
                            title="Breach and Incident Handling"
                            content="If a personal data breach occurs, we will take response actions and notifications required under applicable law and regulator directions."
                        />
                        <PolicySection
                            number="14"
                            title="Policy Updates"
                            content="We may update this policy to reflect legal or operational changes. Material updates will be published with a revised effective date/version, and where required, fresh consent will be requested."
                        />

                        <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 text-sm">
                            Legal note: This is an India-focused compliance draft aligned with current DPDP-era principles and related IT/consumer obligations. Obtain legal review before final publication.
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
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex-shrink-0 pt-1">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent tabular-nums">{number}</span>
            </div>
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                <div className="text-neutral-300 leading-relaxed text-base sm:text-lg">{content}</div>
            </div>
        </div>
    );
}
