"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scan,
    ShieldCheck,
    FileSearch,
    Database,
    Brain,
    CheckCircle2,
    Loader2,
} from "lucide-react";

interface ScanStage {
    id: number;
    icon: React.ReactNode;
    label: string;
    detail: string;
    durationMs: number;
}

const SCAN_STAGES: ScanStage[] = [
    {
        id: 1,
        icon: <FileSearch className="w-4 h-4" />,
        label: "DOCUMENT INGESTION",
        detail: "Parsing uploaded bill structure and extracting line items...",
        durationMs: 1800,
    },
    {
        id: 2,
        icon: <Scan className="w-4 h-4" />,
        label: "OCR ANALYSIS",
        detail: "AI vision model scanning for CPT/HCPCS procedure codes...",
        durationMs: 2200,
    },
    {
        id: 3,
        icon: <Database className="w-4 h-4" />,
        label: "PRICE CROSS-REFERENCE",
        detail: "Comparing against CMS Medicare Fee Schedule & regional data...",
        durationMs: 2000,
    },
    {
        id: 4,
        icon: <Brain className="w-4 h-4" />,
        label: "OVERCHARGE DETECTION",
        detail: "AI flagging charges exceeding 130% of fair market value...",
        durationMs: 1500,
    },
    {
        id: 5,
        icon: <ShieldCheck className="w-4 h-4" />,
        label: "APPEAL GENERATION",
        detail: "Drafting legal appeal letter with regulatory citations...",
        durationMs: 2000,
    },
];

interface ScanningAnimationProps {
    onComplete: () => void;
    isActive: boolean;
    stageDetails?: string[];
    categoryLabel?: string;
}

export default function ScanningAnimation({ onComplete, isActive, stageDetails, categoryLabel }: ScanningAnimationProps) {
    // Merge custom stage details if provided
    const stages = stageDetails
        ? SCAN_STAGES.map((s, i) => ({
            ...s,
            detail: stageDetails[i] || s.detail,
        }))
        : SCAN_STAGES;
    const [currentStage, setCurrentStage] = useState(0);
    const [progress, setProgress] = useState(0);
    const [completedStages, setCompletedStages] = useState<number[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const stageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasCompletedRef = useRef(false);

    useEffect(() => {
        if (!isActive) return;
        hasCompletedRef.current = false;

        let stageIndex = 0;

        const runStage = (index: number) => {
            if (index >= stages.length) {
                setProgress(100);
                if (!hasCompletedRef.current) {
                    hasCompletedRef.current = true;
                    setTimeout(onComplete, 600);
                }
                return;
            }

            setCurrentStage(index);
            setProgress(0);

            const stage = stages[index];
            const tickMs = 50;
            const ticks = stage.durationMs / tickMs;
            let tick = 0;

            intervalRef.current = setInterval(() => {
                tick++;
                const p = Math.min(100, (tick / ticks) * 100);
                setProgress(p);

                if (tick >= ticks) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setCompletedStages((prev) => [...prev, index]);

                    stageTimeoutRef.current = setTimeout(() => {
                        stageIndex++;
                        runStage(stageIndex);
                    }, 300);
                }
            }, tickMs);
        };

        runStage(0);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (stageTimeoutRef.current) clearTimeout(stageTimeoutRef.current);
        };
    }, [isActive, onComplete]);

    const overallProgress = Math.min(
        100,
        ((completedStages.length + (progress / 100)) / stages.length) * 100
    );

    if (!isActive) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0a0f1a]/90 backdrop-blur-xl p-6"
        >
            {/* Scanning sweep line */}
            <motion.div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <Scan className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-white font-semibold text-sm tracking-wide">
                        AI {categoryLabel?.toUpperCase() || "BILL"} ANALYSIS IN PROGRESS
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                        ClaimGuard Agent is scanning your {categoryLabel?.toLowerCase() || ""} bill
                    </p>
                </div>
            </div>

            {/* Overall progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">
                        Overall Progress
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-bold">
                        {Math.round(overallProgress)}%
                    </span>
                </div>
                <div className="h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300 rounded-full"
                        style={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Stage list */}
            <div className="space-y-3">
                {stages.map((stage, idx) => {
                    const isCompleted = completedStages.includes(idx);
                    const isCurrent = currentStage === idx && !isCompleted;
                    const isPending = idx > currentStage;

                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${isCurrent
                                ? "bg-emerald-500/5 border border-emerald-500/20"
                                : isCompleted
                                    ? "bg-emerald-500/[0.03] border border-transparent"
                                    : "border border-transparent opacity-40"
                                }`}
                        >
                            {/* Status icon */}
                            <div
                                className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${isCompleted
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : isCurrent
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-gray-800 text-gray-600"
                                    }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    stage.icon
                                )}
                            </div>

                            {/* Stage content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs font-bold tracking-wider ${isCompleted || isCurrent ? "text-emerald-400" : "text-gray-600"
                                            }`}
                                    >
                                        {stage.label}
                                    </span>
                                    {isCompleted && (
                                        <span className="text-[10px] text-emerald-500/60 font-mono">DONE</span>
                                    )}
                                </div>
                                {(isCurrent || isCompleted) && (
                                    <p className={`text-xs mt-1 ${isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                                        {stage.detail}
                                    </p>
                                )}

                                {/* Stage progress bar */}
                                {isCurrent && (
                                    <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-emerald-500/70 rounded-full"
                                            style={{ width: `${progress}%` }}
                                            transition={{ duration: 0.1 }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Duration */}
                            {!isPending && (
                                <span className="text-[10px] text-gray-600 font-mono flex-shrink-0 mt-1">
                                    {(stage.durationMs / 1000).toFixed(1)}s
                                </span>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500/30 rounded-br-2xl pointer-events-none" />
        </motion.div>
    );
}
