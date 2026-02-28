"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileUp,
    Zap,
    TrendingUp,
    DollarSign,
    Shield,
    Activity,
    Tag,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import ScanningAnimation from "./ScanningAnimation";
import AppealLetterPreview from "./AppealLetterPreview";
import PaymentModal from "./PaymentModal";
import CategorySelector from "./CategorySelector";
import GlassCard from "./GlassCard";
import WealthTicker from "./WealthTicker";
import LiveAgentFeed from "./LiveAgentFeed";
import ReasoningSidebar from "./ReasoningSidebar";
import UrgencyTicker from "./UrgencyTicker";
import { analyzeByCategory } from "@/lib/services/analyze-bill";
import { generateAppealByCategory, generateInstructionsByCategory } from "@/lib/services/appeal-router";
import { calculateSmartFee } from "@/lib/services/fee-calc";
import { createClient } from "@/lib/supabase/client";
import { DEMO_BILLS, CATEGORIES } from "@/lib/services/bill-categories";
import type { BillCategory, UnifiedAnalysisResult } from "@/lib/services/bill-categories";

type Screen = "idle" | "scanning" | "results";

// ─── Scanning stage labels per category ──────────────────────
const SCAN_LABELS: Record<BillCategory, string[]> = {
    medical: [
        "Parsing medical bill structure and extracting CPT codes...",
        "AI vision model scanning for procedure codes and ICD-10...",
        "Cross-referencing CMS Medicare Fee Schedule & regional data...",
        "Flagging charges exceeding 130% of fair market value...",
        "Drafting legal appeal letter with regulatory citations...",
    ],
    auto: [
        "Parsing insurance renewal notice and coverage breakdown...",
        "Extracting premium line items and deductible structure...",
        "Cross-referencing NAIC state average rates & competitor data...",
        "Flagging premium hikes exceeding 15% of state average...",
        "Drafting re-evaluation request with rate comparison data...",
    ],
    rent: [
        "Parsing lease statement and extracting line-item charges...",
        "Identifying non-standard fees and surcharges...",
        "Cross-referencing tenant rights law and fee caps by state...",
        "Flagging hidden fees and illegal late charge patterns...",
        "Drafting tenant rights dispute letter with legal citations...",
    ],
    utility: [
        "Parsing utility statement and billing period history...",
        "Detecting estimated vs. actual meter readings...",
        "Checking for back-billing beyond 12-month regulatory limit...",
        "Flagging over-estimated usage and rate discrepancies...",
        "Drafting utility commission complaint with billing analysis...",
    ],
};

export default function DiagnosisScreen() {
    const [screen, setScreen] = useState<Screen>("idle");
    const [category, setCategory] = useState<BillCategory | null>(null);
    const [analysis, setAnalysis] = useState<UnifiedAnalysisResult | null>(null);
    const [appealLetter, setAppealLetter] = useState("");
    const [submissionInstructions, setSubmissionInstructions] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [billId] = useState(() => crypto.randomUUID());
    const [billText, setBillText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const smartFee = analysis ? calculateSmartFee(analysis.potentialSavings) : null;
    const activeMeta = CATEGORIES.find((c) => c.id === category);

    // ─── Run Analysis (Demo or Uploaded) ─────────────────────────
    const runAnalysis = useCallback((text: string) => {
        if (!category || !text.trim()) return;
        setScreen("scanning");
        setAnalysis(null);
        setAppealLetter("");
        setIsUnlocked(false);

        const result = analyzeByCategory(text, category);
        setAnalysis(result);

        const letter = generateAppealByCategory(category, result);
        setAppealLetter(letter);

        const instructions = generateInstructionsByCategory(
            category,
            result.providerName || "Provider"
        );
        setSubmissionInstructions(instructions);
    }, [category]);

    const handleRunDemo = useCallback(() => {
        if (!category) return;
        const text = DEMO_BILLS[category];
        setBillText(text);
        runAnalysis(text);
    }, [category, runAnalysis]);

    // ─── File Upload Handler ─────────────────────────────────────
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                setBillText(content);
                if (category) runAnalysis(content);
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be re-selected
        e.target.value = "";
    }, [category, runAnalysis]);

    // ─── Paste Text Handler ──────────────────────────────────────
    const handlePasteAnalyze = useCallback(() => {
        if (billText.trim() && category) {
            runAnalysis(billText);
        }
    }, [billText, category, runAnalysis]);

    const handleScanComplete = useCallback(() => setScreen("results"), []);

    // ─── Open Payment Modal ─────────────────────────────────────
    const handleUnlock = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Redirect to a unified login page, passing redirect context
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
        }

        setIsPaymentModalOpen(true);
    }, []);

    const handlePaymentSuccess = useCallback(() => {
        setIsUnlocked(true);
        setIsUnlocking(false);
        setIsPaymentModalOpen(false);
    }, []);

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
            {/* ─── Header ──────────────────────────────────── */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/favicon.svg" alt="ClaimGuard" className="w-10 h-10 rounded-xl" />
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                Claim<span className="text-emerald-400">Guard</span>
                            </h1>
                            <p className="text-xs text-gray-500 -mt-0.5">
                                AI Bill Dispute Agent — Medical · Auto · Rent · Utility
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/pricing"
                            className="text-sm text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 border border-white/[0.08] rounded-xl px-4 py-2.5 hover:border-emerald-500/30"
                            id="view-pricing-btn"
                        >
                            <DollarSign className="w-4 h-4" />
                            <span>Pricing</span>
                        </Link>
                        <button
                            onClick={handleRunDemo}
                            disabled={screen === "scanning" || !category}
                            id="run-diagnosis-btn"
                            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <Zap className="w-4 h-4" />
                            <span>{screen === "idle" ? "Run Demo Diagnosis" : "Run Again"}</span>
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* ─── Category Selector ───────────────────────── */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Select Bill Category
                    </h2>
                </div>
                <CategorySelector
                    selected={category}
                    onSelect={(c) => {
                        setCategory(c);
                        if (screen === "results") {
                            setScreen("idle");
                            setAnalysis(null);
                        }
                    }}
                    disabled={screen === "scanning"}
                />
            </motion.section>

            {/* ─── Stats Row ───────────────────────────────── */}
            <AnimatePresence>
                {analysis && screen === "results" && smartFee && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        {[
                            {
                                icon: <DollarSign className="w-4 h-4" />,
                                label: "Total Billed",
                                value: `$${analysis.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                                color: "text-red-400",
                            },
                            {
                                icon: <TrendingUp className="w-4 h-4" />,
                                label: "Fair Market Price",
                                value: `$${analysis.totalFairPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                                color: "text-emerald-400",
                            },
                            {
                                icon: <Activity className="w-4 h-4" />,
                                label: "Potential Savings",
                                value: `$${analysis.potentialSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                                color: "text-emerald-300",
                                glow: true,
                            },
                            {
                                icon: <Sparkles className="w-4 h-4" />,
                                label: smartFee.feeLabel,
                                value: `$${smartFee.fee.toFixed(2)}`,
                                color: smartFee.feeType === "quick_win" ? "text-blue-400" : "text-amber-400",
                                badge: smartFee.feeType === "quick_win" ? "QUICK WIN" : undefined,
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                            >
                                <GlassCard delay={0.1 * i} className="text-center py-5">
                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                        <span className="text-emerald-500">{stat.icon}</span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                            {stat.label}
                                        </span>
                                    </div>
                                    <p className={`text-xl md:text-2xl font-bold ${stat.color} ${(stat as any).glow ? "text-glow" : ""}`}>
                                        {stat.value}
                                    </p>
                                    {(stat as any).badge && (
                                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-bold text-blue-400 tracking-wider">
                                            {(stat as any).badge}
                                        </span>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Main Content ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Left Column */}
                <div>
                    <AnimatePresence mode="wait">
                        {screen === "idle" && (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <GlassCard delay={0.2} hover={false} className="min-h-[400px] flex flex-col items-center justify-center">
                                    <div className="text-center max-w-sm">
                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".txt,.csv,.pdf,image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="bill-file-input"
                                        />

                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-20 h-20 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mx-auto mb-5 cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300"
                                        >
                                            <FileUp className="w-9 h-9 text-emerald-500/50" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                                            {category ? `Upload Your ${activeMeta?.label} Bill` : "Select a Category"}
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                            {category
                                                ? "Upload a bill file (.txt, .csv, image) or paste your bill text below."
                                                : "Choose your bill type above to get started. Each category has specialized analysis logic."}
                                        </p>

                                        {category && (
                                            <>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="btn-primary text-sm flex items-center gap-2 mx-auto mb-4"
                                                    id="upload-bill-btn"
                                                >
                                                    <FileUp className="w-4 h-4" />
                                                    <span>Upload Bill File</span>
                                                </button>

                                                <div className="relative my-4">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-white/10" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs">
                                                        <span className="bg-[#0a0f1e] px-3 text-gray-600">or paste text</span>
                                                    </div>
                                                </div>

                                                <textarea
                                                    value={billText}
                                                    onChange={(e) => setBillText(e.target.value)}
                                                    placeholder="Paste your bill text here..."
                                                    className="w-full h-28 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-gray-300 font-mono resize-none placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/30 transition-colors"
                                                    id="bill-text-input"
                                                />
                                                <button
                                                    onClick={handlePasteAnalyze}
                                                    disabled={!billText.trim()}
                                                    className="btn-primary text-xs flex items-center gap-1.5 mx-auto mt-3 disabled:opacity-30"
                                                    id="analyze-pasted-btn"
                                                >
                                                    <Zap className="w-3.5 h-3.5" />
                                                    <span>Analyze Pasted Bill</span>
                                                </button>
                                            </>
                                        )}

                                        {activeMeta && (
                                            <p className="text-xs text-gray-600 mt-3 italic">{activeMeta.scanDescription}</p>
                                        )}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {screen === "scanning" && category && (
                            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <ScanningAnimation
                                    isActive
                                    onComplete={handleScanComplete}
                                    stageDetails={SCAN_LABELS[category]}
                                    categoryLabel={activeMeta?.label || "Bill"}
                                />
                            </motion.div>
                        )}

                        {screen === "results" && analysis && (
                            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <GlassCard delay={0.1} hover={false}>
                                    <h2 className="text-sm font-bold text-gray-300 mb-1 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                        {analysis.disputeType} ({analysis.lineItems.length} issues)
                                    </h2>
                                    <p className="text-xs text-gray-500 mb-4">{analysis.analysisNotes}</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase">Code</th>
                                                    <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase">Description</th>
                                                    <th className="text-right py-3 px-2 text-gray-500 font-medium text-xs uppercase">Billed</th>
                                                    <th className="text-right py-3 px-2 text-gray-500 font-medium text-xs uppercase">Fair</th>
                                                    <th className="text-right py-3 px-2 text-gray-500 font-medium text-xs uppercase">Savings</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analysis.lineItems.map((item, i) => (
                                                    <motion.tr
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.05 * i }}
                                                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        <td className="py-3 px-2 font-mono text-emerald-400 text-xs">{item.code}</td>
                                                        <td className="py-3 px-2 text-gray-300 text-xs max-w-[200px] truncate">{item.description}</td>
                                                        <td className="py-3 px-2 text-right text-red-400 font-medium text-xs">${item.billedAmount.toFixed(2)}</td>
                                                        <td className="py-3 px-2 text-right text-emerald-400 font-medium text-xs">${item.fairPrice.toFixed(2)}</td>
                                                        <td className="py-3 px-2 text-right text-emerald-300 font-semibold text-xs">${item.savings.toFixed(2)}</td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Appeal Letter Preview */}
                <div>
                    <AnimatePresence mode="wait">
                        {screen === "idle" && (
                            <motion.div key="idle-right" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <GlassCard delay={0.3} hover={false} className="min-h-[400px] flex flex-col items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                            <Shield className="w-9 h-9 text-emerald-500/30" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Dispute Letter Preview</h3>
                                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                            Your AI-generated dispute letter will appear here after analysis.
                                        </p>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {screen === "scanning" && (
                            <motion.div key="scanning-right" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <LiveAgentFeed isActive={screen === "scanning"} />
                            </motion.div>
                        )}

                        {screen === "results" && analysis && smartFee && (
                            <motion.div key="results-right" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <AppealLetterPreview
                                    appealLetterMarkdown={appealLetter}
                                    isUnlocked={isUnlocked}
                                    potentialSavings={analysis.potentialSavings}
                                    successFee={smartFee.fee}
                                    providerName={analysis.providerName || "Provider"}
                                    onUnlock={handleUnlock}
                                    isUnlocking={isUnlocking}
                                    feeLabel={smartFee.feeLabel}
                                    feeType={smartFee.feeType}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ─── Wealth Ticker + Agent Feed (below main grid) ─── */}
            <AnimatePresence>
                {screen === "results" && analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                    >
                        <WealthTicker savedAmount={analysis.potentialSavings} />
                        <LiveAgentFeed isActive={false} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Reasoning Sidebar + Urgency Ticker (below Wealth row) ─── */}
            <AnimatePresence>
                {screen === "results" && analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                    >
                        <ReasoningSidebar category={category!} isVisible={true} lineItems={analysis.lineItems} />
                        <UrgencyTicker category={category!} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Submission Instructions (after unlock) ─── */}
            <AnimatePresence>
                {isUnlocked && submissionInstructions && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
                        <GlassCard delay={0} hover={false}>
                            <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <FileUp className="w-4 h-4 text-emerald-400" />
                                Submission Instructions
                            </h2>
                            <div className="text-sm leading-relaxed text-gray-400 whitespace-pre-wrap font-mono">{submissionInstructions}</div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Footer ──────────────────────────────────── */}
            <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-12 pb-8 text-center">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-6" />

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400/80 tracking-wider">HIPAA-COMPLIANT AI</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400/80 tracking-wider">BANK-LEVEL SECURITY</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400/80 tracking-wider">256-BIT ENCRYPTION</span>
                    </div>
                </div>

                <p className="text-xs text-gray-600">ClaimGuard © {new Date().getFullYear()} — AI-Powered Bill Dispute Agent</p>
                <p className="text-xs text-gray-700 mt-1">20% Success Fee or $10 Quick Win — Zero upfront cost.</p>

                <a
                    href="mailto:usmankhan7.8.2004@gmail.com?subject=ClaimGuard%20Support%20Request&body=Hi%20Usman,%20I%20need%20help%20with..."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all text-xs"
                >
                    💬 Contact Founder
                </a>
            </motion.footer>

            {/* ─── Payment Modal ──────────────────────────── */}
            {smartFee && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    amount={smartFee.fee}
                    billId={billId}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
