"use client";

import { use, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Zap,
    Users,
    ArrowRight,
    ChevronRight,
    Lock,
} from "lucide-react";
import Link from "next/link";
import PaymentModal from "@/components/PaymentModal";

const PLAN_INFO: Record<string, { name: string; price: number; icon: React.ReactNode; features: string[] }> = {
    defender: {
        name: "Defender",
        price: 29,
        icon: <Zap className="w-6 h-6 text-blue-400" />,
        features: [
            "5 bill scans per month",
            "3 categories (Medical, Auto, Utility)",
            "Full dispute letters with legal citations",
            "AI legal reasoning sidebar",
        ],
    },
    family_vault: {
        name: "Family Vault",
        price: 49,
        icon: <Users className="w-6 h-6 text-emerald-400" />,
        features: [
            "Unlimited bill scans",
            "All 4 categories",
            "Family member accounts (up to 5)",
            "Priority dispute generation",
            "Wise / Bank Transfer support",
        ],
    },
};

interface PayPageProps {
    params: Promise<{ plan: string }>;
}

export default function PayPage({ params }: PayPageProps) {
    const { plan } = use(params);
    const info = PLAN_INFO[plan];

    const [isSecuring, setIsSecuring] = useState(true);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [billId] = useState(() => crypto.randomUUID());
    const [isPaid, setIsPaid] = useState(false);

    // Auto-show loading then open modal on mount
    useState(() => {
        const t = setTimeout(() => {
            setIsSecuring(false);
            setIsPaymentOpen(true);
        }, 1000);
        return () => clearTimeout(t);
    });

    const handlePaymentSuccess = useCallback(() => {
        setIsPaymentOpen(false);
        setIsPaid(true);
    }, []);

    if (!info) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Plan not found</h1>
                    <p className="text-gray-400 text-sm mb-6">The plan &quot;{plan}&quot; doesn&apos;t exist.</p>
                    <Link href="/pricing" className="text-emerald-400 hover:text-emerald-300 text-sm underline underline-offset-2">
                        ← Back to Pricing
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Back link */}
                <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors mb-8">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back to Pricing
                </Link>

                {/* Plan summary card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/[0.08] bg-[#080d1a]/95 backdrop-blur-xl p-8 mb-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            {info.icon}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">You selected: {info.name}</h1>
                            <p className="text-sm text-gray-400">
                                <span className="text-emerald-400 font-bold text-lg">${info.price}</span>
                                <span className="text-gray-500">/month</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/[0.06] mb-6" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {info.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Pay button if modal was closed */}
                {!isPaymentOpen && !isPaid && !isSecuring && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <button
                            onClick={() => setIsPaymentOpen(true)}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Lock className="w-4 h-4" />
                            <span>Pay ${info.price} Now</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* Paid confirmation */}
                {isPaid && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Payment Submitted!</h2>
                        <p className="text-sm text-gray-400 mb-6">Your {info.name} plan is being activated. You&apos;ll get access within 1-2 hours.</p>
                        <Link
                            href="/app"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
                        >
                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Securing overlay */}
            {isSecuring && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                >
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full mx-auto mb-6"
                        />
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-lg font-semibold text-white">Securing your connection…</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                            Preparing {info.name} payment details
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                amount={info.price}
                billId={billId}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
