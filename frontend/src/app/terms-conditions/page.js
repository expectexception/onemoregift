"use client"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HiDocumentText } from "react-icons/hi";

const EFFECTIVE_DATE = "May 28, 2026";
const POLICY_VERSION = "2026-05-28";

export default function TermsConditions() {
    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6">
                        <HiDocumentText className="text-red-500" />
                        <span className="text-neutral-300 text-sm font-medium tracking-wide uppercase">User Agreement</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Conditions</span>
                    </h1>
                    <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Effective Date: {EFFECTIVE_DATE} | Version: {POLICY_VERSION}
                    </p>
                </div>
            </section>

            <section className="flex-1 px-4 sm:px-6 pb-24 relative z-10 w-full">
                <div className="max-w-4xl mx-auto">
                    <div className="premium-card rounded-3xl p-6 sm:p-10 md:p-14 space-y-10 border border-white/10">
                        <TermSection
                            number="01"
                            title="Who We Are"
                            content="These Terms govern your use of the OneMoreGift website, web application, and related services (collectively, the Platform). The Platform is intended for users in India."
                        />
                        <TermSection
                            number="02"
                            title="Acceptance of Terms"
                            content="By creating an account, clicking accept, accessing, or using the Platform, you agree to these Terms, our Privacy Policy, and all applicable laws in India. If you do not agree, do not use the Platform."
                        />
                        <TermSection
                            number="03"
                            title="Eligibility"
                            content="You must be at least 18 years old, legally competent to contract, and provide accurate, current, and complete information. You are responsible for keeping your account credentials secure."
                        />
                        <TermSection
                            number="04"
                            title="No-Purchase Giveaway Model"
                            content="Unless explicitly stated otherwise, no purchase is required to enter giveaways. Entry rules, dates, winner count, eligibility filters, and prize details are shown on each giveaway page."
                        />
                        <TermSection
                            number="05"
                            title="Fair Use and Prohibited Conduct"
                            content="You must not create multiple accounts to gain unfair advantage, use bots/scripts, exploit bugs, impersonate others, tamper with Platform security, or violate applicable law. We may suspend or terminate accounts for abuse."
                        />
                        <TermSection
                            number="06"
                            title="Prize, Winners, and Verification"
                            content="Winners are selected according to the mechanics disclosed on the giveaway page. We may require identity and eligibility verification before prize fulfillment. If a winner fails verification or is unreachable in the claim window, we may select an alternate winner."
                        />
                        <TermSection
                            number="07"
                            title="Taxes, Compliance, and KYC"
                            content="Winners are responsible for personal tax obligations unless mandatory law requires us to deduct or collect at source. Where required by law, additional details/documents may be requested for compliance."
                        />
                        <TermSection
                            number="08"
                            title="Intellectual Property"
                            content="All software, content, logos, graphics, and trademarks on the Platform are owned by or licensed to OneMoreGift. You may not copy, distribute, reverse engineer, or commercially exploit Platform materials without written permission."
                        />
                        <TermSection
                            number="09"
                            title="User Content and Feedback"
                            content="If you submit content, feedback, or suggestions, you grant us a non-exclusive, royalty-free license to use it for operating and improving the Platform, subject to applicable law and our Privacy Policy."
                        />
                        <TermSection
                            number="10"
                            title="Disclaimers"
                            content="The Platform is provided on an 'as is' and 'as available' basis. While we use commercially reasonable safeguards, we do not guarantee uninterrupted availability, error-free operation, or specific outcomes."
                        />
                        <TermSection
                            number="11"
                            title="Limitation of Liability"
                            content="To the maximum extent permitted by law, OneMoreGift is not liable for indirect, incidental, special, consequential, or punitive damages. Aggregate liability, if any, is limited to INR 10,000 or the value of the relevant prize, whichever is lower."
                        />
                        <TermSection
                            number="12"
                            title="Termination and Suspension"
                            content="We may suspend or terminate accounts for policy violations, legal requirements, fraud prevention, security risks, or operational reasons. You may stop using the Platform at any time."
                        />
                        <TermSection
                            number="13"
                            title="Governing Law and Jurisdiction"
                            content="These Terms are governed by the laws of India. Courts at New Delhi, India, shall have exclusive jurisdiction, subject to mandatory consumer forum rights under applicable law."
                        />
                        <TermSection
                            number="14"
                            title="Grievance Redressal and Contact"
                            content={
                                <>
                                    For complaints, policy concerns, or legal notices, contact:
                                    <br />
                                    Email: <a href="mailto:contact@onemoregift.in" className="text-red-400 hover:text-red-300">contact@onemoregift.in</a>
                                    <br />
                                    Grievance Officer: [Add Name]
                                    <br />
                                    Postal Address: [Add Registered Office Address]
                                    <br />
                                    We target acknowledgment within 48 hours and resolution timelines as required by law.
                                </>
                            }
                        />

                        <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 text-sm">
                            Legal note: This draft is prepared for India-focused compliance alignment (including DPDP-era consent principles and Indian IT/consumer frameworks) and should be reviewed by qualified legal counsel before production publication.
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
