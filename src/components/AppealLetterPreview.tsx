"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Lock,
    Unlock,
    Shield,
    FileText,
    ArrowRight,
    DollarSign,
    Sparkles,
    CheckCircle2,
    ExternalLink,
} from "lucide-react";

interface AppealLetterPreviewProps {
    appealLetterMarkdown: string;
    isUnlocked: boolean;
    potentialSavings: number;
    successFee: number;
    providerName: string;
    onUnlock: () => void;
    isUnlocking: boolean;
    feeLabel?: string;
    feeType?: "success_fee" | "quick_win";
}

export default function AppealLetterPreview({
    appealLetterMarkdown,
    isUnlocked,
    potentialSavings,
    successFee,
    providerName,
    onUnlock,
    isUnlocking,
    feeLabel = "20% Success Fee",
    feeType = "success_fee",
}: AppealLetterPreviewProps) {
    return (
        <div className="relative">
            <AnimatePresence mode="wait">
                {!isUnlocked ? (
                    /* ─── Locked State: Blurred Preview + Fee Card ──── */
                    <motion.div
                        key="locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Blurred Letter Preview */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/5">
                            <div
                                className="p-6 text-sm leading-relaxed text-gray-300 select-none"
                                style={{
                                    filter: "blur(6px)",
                                    WebkitFilter: "blur(6px)",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                }}
                            >
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-white">
                                        Formal Appeal Letter — Medical Billing Dispute
                                    </h2>
                                    <p>Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                                    <p>To: Billing Department, {providerName}</p>
                                    <p className="mt-4">
                                        Dear Billing Department, I am writing to formally dispute the charges on the
                                        above-referenced account. After a thorough review of the itemized bill against
                                        the 2024 CMS Medicare Physician Fee Schedule, Healthcare Bluebook fair pricing
                                        data, and regional average rates, I have identified multiple charges that
                                        significantly exceed fair market value.
                                    </p>
                                    <div className="border border-white/10 rounded-lg p-4 mt-4">
                                        <p className="font-mono text-xs">
                                            CPT 99285 | Emergency Dept Visit | Billed: $2,450.00 | Fair: $710.00 | Over: $1,740.00
                                        </p>
                                        <p className="font-mono text-xs mt-1">
                                            CPT 74177 | CT Abdomen w/ Contrast | Billed: $3,200.00 | Fair: $380.00 | Over: $2,820.00
                                        </p>
                                        <p className="font-mono text-xs mt-1">
                                            CPT 93000 | ECG Complete | Billed: $275.00 | Fair: $28.00 | Over: $247.00
                                        </p>
                                    </div>
                                    <p className="mt-4">
                                        This dispute is filed pursuant to the No Surprises Act (2022), Fair Debt
                                        Collection Practices Act, and State Consumer Protection Laws. The charges
                                        identified exceed the Medicare-allowed amount by 130% or more...
                                    </p>
                                    <p>
                                        I respectfully request that you reduce each disputed charge to the fair market
                                        price or provide a written, itemized justification for the excess charges.
                                        If no response is received within 30 days, I intend to file complaints with
                                        the State Attorney General and pursue Independent Dispute Resolution...
                                    </p>
                                </div>
                            </div>

                            {/* Gradient fade at the bottom of blurred content */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020617] to-transparent" />
                        </div>

                        {/* ─── Success Fee Overlay Card ──────────────── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                            className="absolute inset-0 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#0a0f1a]/95 backdrop-blur-2xl p-8 shadow-2xl shadow-emerald-500/10">
                                {/* Glowing top accent */}
                                <div className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

                                {/* Icon */}
                                <div className="flex justify-center mb-5">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                            <Shield className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <motion.div
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Lock className="w-3 h-3 text-black" />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-center text-lg font-bold text-white mb-2">
                                    Your Appeal Letter is Ready
                                </h3>
                                <p className="text-center text-gray-400 text-sm leading-relaxed mb-6">
                                    AI found{" "}
                                    <span className="text-emerald-400 font-bold text-base">
                                        ${potentialSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </span>{" "}
                                    in savings. Pay the{" "}
                                    <span className={`font-semibold ${feeType === "quick_win" ? "text-blue-400" : "text-white"}`}>
                                        {feeLabel} (${successFee.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                                    </span>{" "}
                                    to unlock your dispute letter and submission instructions.
                                </p>
                                {feeType === "quick_win" && (
                                    <div className="flex justify-center mb-2">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-bold text-blue-400 tracking-wider">
                                            ⚡ QUICK WIN — FLAT $10
                                        </span>
                                    </div>
                                )}

                                {/* Value breakdown */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5">
                                        <span className="text-xs text-gray-400 flex items-center gap-2">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                            Potential Savings
                                        </span>
                                        <span className="text-sm font-bold text-emerald-400">
                                            ${potentialSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5">
                                        <span className="text-xs text-gray-400 flex items-center gap-2">
                                            <FileText className={`w-3.5 h-3.5 ${feeType === "quick_win" ? "text-blue-500" : "text-emerald-500"}`} />
                                            {feeLabel}
                                        </span>
                                        <span className={`text-sm font-bold ${feeType === "quick_win" ? "text-blue-400" : "text-white"}`}>
                                            ${successFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <span className="text-xs text-emerald-400 flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            You Keep
                                        </span>
                                        <span className="text-sm font-bold text-emerald-300">
                                            ${(potentialSavings - successFee).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {/* Unlock button — swap this for Lemon Squeezy later */}
                                <button
                                    onClick={onUnlock}
                                    disabled={isUnlocking}
                                    id="unlock-appeal-button"
                                    className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUnlocking ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Unlock className="w-4 h-4" />
                                            </motion.div>
                                            <span>Unlocking...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            <span>Unlock Appeal Letter — ${successFee.toFixed(2)}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-[10px] text-gray-600 mt-3">
                                    🔒 Mock payment for demo — swap for Lemon Squeezy checkout
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    /* ─── Unlocked State: Full Letter ─────────────── */
                    <motion.div
                        key="unlocked"
                        initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="rounded-2xl border border-emerald-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl overflow-hidden"
                    >
                        {/* Success banner */}
                        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-400">
                                Appeal Letter Unlocked
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    className="text-xs text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                                    onClick={() => {
                                        navigator.clipboard.writeText(appealLetterMarkdown);
                                    }}
                                >
                                    <FileText className="w-3 h-3" />
                                    Copy
                                </button>
                                <span className="text-gray-700">|</span>
                                <button className="text-xs text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        {/* Rendered letter content */}
                        <div className="p-6 md:p-8 prose prose-invert prose-emerald max-w-none">
                            <div className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap font-mono">
                                {appealLetterMarkdown}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
