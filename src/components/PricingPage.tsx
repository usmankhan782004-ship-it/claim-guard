"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    Zap,
    Users,
    Crown,
    Check,
    ArrowRight,
    TrendingUp,
    Sparkles,
    DollarSign,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ─── Tier Data ──────────────────────────────────────────────
interface PricingTier {
    id: string;
    name: string;
    price: number;
    period: string;
    tagline: string;
    icon: React.ReactNode;
    features: string[];
    highlight?: boolean;
    badge?: string;
    ctaLabel: string;
    accent: string;
    accentBg: string;
    accentBorder: string;
    billsPerMonth: number;
}

const TIERS: PricingTier[] = [
    {
        id: "quick_win",
        name: "Quick Win",
        price: 10,
        period: "per bill",
        tagline: "One-time disputes for small bills",
        icon: <Zap className="w-6 h-6" />,
        features: [
            "Single bill analysis",
            "AI-generated dispute letter",
            "All 4 bill categories",
            "Submission instructions",
            "Pay only if we find savings",
        ],
        ctaLabel: "Analyze a Bill",
        accent: "text-blue-400",
        accentBg: "bg-blue-500/10",
        accentBorder: "border-blue-500/20",
        billsPerMonth: 1,
    },
    {
        id: "family_vault",
        name: "Family Vault",
        price: 49,
        period: "/month",
        tagline: "Unlimited scans for the whole household",
        icon: <Users className="w-6 h-6" />,
        features: [
            "Unlimited bill scans",
            "All 4 categories (Medical, Auto, Rent, Utility)",
            "Priority dispute generation",
            "Family member accounts (up to 5)",
            "Monthly savings report",
            "CAM & notice period detection",
            "Comparative rate analysis",
            "Estimated vs actual meter checks",
        ],
        highlight: true,
        badge: "Recommended for Families",
        ctaLabel: "Start Free Trial",
        accent: "text-emerald-400",
        accentBg: "bg-emerald-500/10",
        accentBorder: "border-emerald-500/30",
        billsPerMonth: 15,
    },
    {
        id: "pro",
        name: "Pro Advocate",
        price: 149,
        period: "/month",
        tagline: "For advocates, attorneys & property managers",
        icon: <Crown className="w-6 h-6" />,
        features: [
            "Everything in Family Vault",
            "Unlimited client accounts",
            "White-label dispute letters",
            "Bulk bill upload & analysis",
            "API access for integrations",
            "Dedicated success manager",
            "Custom letterhead branding",
            "Audit trail & compliance logs",
        ],
        ctaLabel: "Contact Sales",
        accent: "text-amber-400",
        accentBg: "bg-amber-500/10",
        accentBorder: "border-amber-500/20",
        billsPerMonth: 100,
    },
];

// ─── Savings Calculator Logic ───────────────────────────────
const SAVINGS_RATE = 0.22; // Average 22% savings on flagged bills
const SUCCESS_FEE_RATE = 0.20;

function formatCurrency(n: number): string {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ─── Component ──────────────────────────────────────────────
export default function PricingPage() {
    const [monthlyBills, setMonthlyBills] = useState(500);
    const [hoveredTier, setHoveredTier] = useState<string | null>(null);

    const savings = useMemo(() => {
        const grossSavings = monthlyBills * SAVINGS_RATE;
        const fee = grossSavings <= 50 ? 10 : grossSavings * SUCCESS_FEE_RATE;
        const netSavings = grossSavings - fee;
        const annual = netSavings * 12;
        return { grossSavings, fee, netSavings, annual };
    }, [monthlyBills]);

    // Slider progress percentage for gradient track
    const sliderPercent = ((monthlyBills - 100) / (5000 - 100)) * 100;

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
            {/* ─── Header ──────────────────────────────────── */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <Link href="/app" className="inline-flex items-center gap-2 mb-8 text-xs text-gray-500 hover:text-emerald-400 transition-colors">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back to Dashboard
                </Link>

                <div className="flex items-center justify-center gap-3 mb-4">
                    <img src="/favicon.svg" alt="ClaimGuard" className="w-10 h-10 rounded-xl" />
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        Claim<span className="text-emerald-400">Guard</span>
                    </h1>
                </div>

                <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                    Choose your plan. Only pay when we find savings.
                </p>

                <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mt-8" />
            </motion.header>

            {/* ─── Pricing Tiers ──────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {TIERS.map((tier, idx) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx, duration: 0.5 }}
                        onMouseEnter={() => setHoveredTier(tier.id)}
                        onMouseLeave={() => setHoveredTier(null)}
                        className="relative"
                    >
                        {/* Glowing badge for Family Vault */}
                        {tier.badge && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                                className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                            >
                                <div className="relative">
                                    {/* Glow pulse behind badge */}
                                    <motion.div
                                        animate={{
                                            boxShadow: [
                                                "0 0 15px 2px rgba(16,185,129,0.3)",
                                                "0 0 25px 6px rgba(16,185,129,0.5)",
                                                "0 0 15px 2px rgba(16,185,129,0.3)",
                                            ],
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-full"
                                    />
                                    <span className="relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-sm whitespace-nowrap">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {tier.badge}
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {/* Card */}
                        <div
                            className={`
                                relative overflow-hidden rounded-2xl p-[1px] h-full
                                ${tier.highlight
                                    ? "bg-gradient-to-b from-emerald-500/40 via-emerald-500/10 to-transparent"
                                    : "bg-white/[0.06]"
                                }
                            `}
                        >
                            {/* Ambient glow for highlighted card */}
                            {tier.highlight && (
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                            )}

                            <div
                                className={`
                                    relative rounded-2xl p-8 h-full flex flex-col
                                    bg-[#080d1a]/95 backdrop-blur-xl
                                    border ${tier.highlight ? "border-emerald-500/20" : "border-white/[0.06]"}
                                    transition-all duration-500
                                    ${hoveredTier === tier.id ? "border-emerald-500/30" : ""}
                                `}
                            >
                                {/* Icon + Name */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-11 h-11 rounded-xl ${tier.accentBg} border ${tier.accentBorder} flex items-center justify-center`}>
                                        <span className={tier.accent}>{tier.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                                        <p className="text-xs text-gray-500">{tier.tagline}</p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-black ${tier.accent}`}>
                                            ${tier.price}
                                        </span>
                                        <span className="text-sm text-gray-500 font-medium">{tier.period}</span>
                                    </div>
                                    {tier.id === "quick_win" && (
                                        <p className="text-[10px] text-gray-600 mt-1">or 20% success fee for larger savings</p>
                                    )}
                                </div>

                                {/* Separator line */}
                                <div className={`h-px ${tier.highlight ? "bg-emerald-500/15" : "bg-white/[0.06]"} mb-6`} />

                                {/* Features */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((feat, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + 0.04 * i }}
                                            className="flex items-start gap-2.5 text-sm text-gray-300"
                                        >
                                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.accent}`} />
                                            <span>{feat}</span>
                                        </motion.li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <button
                                    className={`
                                        w-full py-3.5 rounded-xl font-semibold text-sm
                                        flex items-center justify-center gap-2
                                        transition-all duration-300
                                        ${tier.highlight
                                            ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                                            : `${tier.accentBg} border ${tier.accentBorder} ${tier.accent} hover:bg-white/[0.08]`
                                        }
                                    `}
                                    id={`cta-${tier.id}`}
                                >
                                    <span>{tier.ctaLabel}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ─── Savings Calculator ─────────────────────── */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-16"
            >
                <div className="relative overflow-hidden rounded-2xl bg-[#080d1a]/95 backdrop-blur-xl border border-white/[0.06] p-8 md:p-12">
                    {/* Background ambient glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="relative z-10 text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider mb-4">
                            <TrendingUp className="w-3.5 h-3.5" />
                            SAVINGS CALCULATOR
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            How much could you <span className="text-emerald-400">save</span>?
                        </h2>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Drag the slider to your average monthly bill total. We&apos;ll show you your estimated savings.
                        </p>
                    </div>

                    {/* Slider */}
                    <div className="relative z-10 max-w-2xl mx-auto mb-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-600 font-medium">$100</span>
                            <span className="text-sm font-bold text-white">
                                Monthly Bills: <span className="text-emerald-400">{formatCurrency(monthlyBills)}</span>
                            </span>
                            <span className="text-xs text-gray-600 font-medium">$5,000</span>
                        </div>

                        {/* Custom styled range slider */}
                        <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                                style={{ width: `${sliderPercent}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min={100}
                            max={5000}
                            step={50}
                            value={monthlyBills}
                            onChange={(e) => setMonthlyBills(Number(e.target.value))}
                            className="w-full h-2 -mt-2 relative z-10 appearance-none bg-transparent cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400
                                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-300
                                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30
                                [&::-webkit-slider-thumb]:cursor-pointer
                                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-400
                                [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-300
                                [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-emerald-500/30
                                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0
                            "
                            id="savings-slider"
                        />
                    </div>

                    {/* Results Cards */}
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {
                                label: "Potential Savings",
                                value: formatCurrency(savings.grossSavings),
                                sub: `${Math.round(SAVINGS_RATE * 100)}% avg recovery`,
                                accent: "text-emerald-400",
                                icon: <TrendingUp className="w-4 h-4" />,
                            },
                            {
                                label: "Our Fee",
                                value: formatCurrency(savings.fee),
                                sub: savings.grossSavings <= 50 ? "$10 Quick Win" : "20% success fee",
                                accent: "text-blue-400",
                                icon: <DollarSign className="w-4 h-4" />,
                            },
                            {
                                label: "You Keep",
                                value: formatCurrency(savings.netSavings),
                                sub: "Your net savings",
                                accent: "text-emerald-300",
                                glow: true,
                                icon: <Shield className="w-4 h-4" />,
                            },
                            {
                                label: "Annual Savings",
                                value: formatCurrency(savings.annual),
                                sub: "Projected 12-month total",
                                accent: "text-amber-400",
                                icon: <Sparkles className="w-4 h-4" />,
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + 0.1 * i }}
                                className={`
                                    rounded-xl p-5 text-center
                                    bg-white/[0.02] border border-white/[0.06]
                                    ${(stat as any).glow ? "ring-1 ring-emerald-500/10" : ""}
                                `}
                            >
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <span className={stat.accent}>{stat.icon}</span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                        {stat.label}
                                    </span>
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={stat.value}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className={`text-xl md:text-2xl font-black ${stat.accent} ${(stat as any).glow ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" : ""}`}
                                    >
                                        {stat.value}
                                    </motion.p>
                                </AnimatePresence>
                                <p className="text-[10px] text-gray-600 mt-1">{stat.sub}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ─── Bottom CTA ─────────────────────────────── */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center mb-8"
            >
                <h3 className="text-lg font-bold text-white mb-2">Ready to stop overpaying?</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    Upload your first bill for free. Zero risk — you only pay when we find savings.
                </p>
                <Link
                    href="/app"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <Zap className="w-4 h-4" />
                    Analyze My First Bill
                </Link>
            </motion.section>

            {/* ─── Footer ─────────────────────────────────── */}
            <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-12 pb-8 text-center">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-6" />
                <p className="text-xs text-gray-600">ClaimGuard © {new Date().getFullYear()} — AI-Powered Bill Dispute Agent</p>
                <p className="text-xs text-gray-700 mt-1">20% Success Fee or $10 Quick Win — Zero upfront cost.</p>
            </motion.footer>
        </div>
    );
}
