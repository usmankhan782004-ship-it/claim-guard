"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, BookOpen, Scale, FileSearch, Gavel, ShieldCheck } from "lucide-react";

// ─── AI Action Stream ───────────────────────────────────────
interface AgentAction {
    id: number;
    icon: React.ReactNode;
    text: string;
    type: "research" | "legal" | "analysis" | "generation";
    timestamp: string;
}

const ACTION_POOL: Omit<AgentAction, "id" | "timestamp">[] = [
    { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Citing US Code § 1395 — Medicare billing regulations…", type: "legal" },
    { icon: <Scale className="w-3.5 h-3.5" />, text: "Cross-referencing CMS Fee Schedule for CPT-99213…", type: "research" },
    { icon: <FileSearch className="w-3.5 h-3.5" />, text: "Scanning statement for duplicate charge patterns…", type: "analysis" },
    { icon: <Gavel className="w-3.5 h-3.5" />, text: "Invoking URLTA § 47a-4 — prohibited lease terms…", type: "legal" },
    { icon: <Cpu className="w-3.5 h-3.5" />, text: "Running comparative rate analysis against NAIC data…", type: "research" },
    { icon: <FileSearch className="w-3.5 h-3.5" />, text: "Detecting estimated meter reading discrepancies…", type: "analysis" },
    { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Referencing PUC Service Standard § 4.3 — meter rules…", type: "legal" },
    { icon: <Scale className="w-3.5 h-3.5" />, text: "Benchmarking premium against state average rates…", type: "research" },
    { icon: <Cpu className="w-3.5 h-3.5" />, text: "Analyzing CAM charge itemization for GAAP compliance…", type: "analysis" },
    { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Generating dispute letter with regulatory citations…", type: "generation" },
    { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Checking 12-month back-billing regulatory limit…", type: "legal" },
    { icon: <Cpu className="w-3.5 h-3.5" />, text: "Extracting recurring payment signatures from CSV…", type: "analysis" },
    { icon: <Scale className="w-3.5 h-3.5" />, text: "Validating late fee against 5% statutory cap…", type: "research" },
    { icon: <Gavel className="w-3.5 h-3.5" />, text: "Drafting CFPB complaint under Dodd-Frank § 1031…", type: "legal" },
    { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Compiling evidence packet for insurance commissioner…", type: "generation" },
    { icon: <FileSearch className="w-3.5 h-3.5" />, text: "Flagging 23% month-over-month price increase…", type: "analysis" },
    { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Citing Fair Debt Collection Practices Act § 809…", type: "legal" },
    { icon: <Cpu className="w-3.5 h-3.5" />, text: "Cross-referencing Insurance Information Institute data…", type: "research" },
];

const TYPE_COLORS: Record<string, string> = {
    research: "text-blue-400",
    legal: "text-amber-400",
    analysis: "text-emerald-400",
    generation: "text-purple-400",
};

const TYPE_BG: Record<string, string> = {
    research: "bg-blue-500/10 border-blue-500/20",
    legal: "bg-amber-500/10 border-amber-500/20",
    analysis: "bg-emerald-500/10 border-emerald-500/20",
    generation: "bg-purple-500/10 border-purple-500/20",
};

function getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Component ──────────────────────────────────────────────
interface LiveAgentFeedProps {
    isActive: boolean;
    maxVisible?: number;
}

export default function LiveAgentFeed({ isActive, maxVisible = 8 }: LiveAgentFeedProps) {
    const [actions, setActions] = useState<AgentAction[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isActive) {
            // Clear when not active
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        // Feed initial burst
        const initial: AgentAction[] = [];
        for (let i = 0; i < 3; i++) {
            const pool = ACTION_POOL[Math.floor(Math.random() * ACTION_POOL.length)];
            initial.push({ ...pool, id: counterRef.current++, timestamp: getTimestamp() });
        }
        setActions(initial);

        // Stream new actions at interval
        intervalRef.current = setInterval(() => {
            const pool = ACTION_POOL[Math.floor(Math.random() * ACTION_POOL.length)];
            const action: AgentAction = {
                ...pool,
                id: counterRef.current++,
                timestamp: getTimestamp(),
            };
            setActions((prev) => [...prev.slice(-(maxVisible - 1)), action]);
        }, 2200);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, maxVisible]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [actions]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-[#080d1a]/95 backdrop-blur-xl border border-white/[0.06] p-5"
        >
            {/* Ambient glow */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-tight">Live Agent Feed</h3>
                        <p className="text-[9px] text-gray-600">AI Negotiation Log</p>
                    </div>
                </div>

                {isActive && (
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-1.5"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[9px] text-emerald-400 font-medium">LIVE</span>
                    </motion.div>
                )}
            </div>

            {/* Feed */}
            <div
                ref={scrollRef}
                className="relative z-10 space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent pr-1"
            >
                <AnimatePresence initial={false}>
                    {actions.map((action) => (
                        <motion.div
                            key={action.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: "auto" }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                        >
                            {/* Type icon */}
                            <div className={`mt-0.5 w-6 h-6 rounded-md ${TYPE_BG[action.type]} border flex items-center justify-center flex-shrink-0`}>
                                <span className={TYPE_COLORS[action.type]}>{action.icon}</span>
                            </div>

                            {/* Text + timestamp */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {action.text}
                                </p>
                                <p className="text-[9px] text-gray-700 font-mono mt-0.5">{action.timestamp}</p>
                            </div>

                            {/* Typing indicator for latest */}
                            {action.id === actions[actions.length - 1]?.id && isActive && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-0.5 mt-1"
                                >
                                    {[0, 1, 2].map((d) => (
                                        <motion.div
                                            key={d}
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                                            className="w-1 h-1 rounded-full bg-emerald-500"
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!isActive && actions.length === 0 && (
                    <div className="text-center py-8">
                        <Terminal className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">Awaiting analysis…</p>
                    </div>
                )}
            </div>

            {/* Bottom stats bar */}
            {actions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative z-10 flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]"
                >
                    <span className="text-[9px] text-gray-600 font-mono">
                        {actions.length} actions logged
                    </span>
                    <div className="flex items-center gap-3">
                        {(["legal", "research", "analysis", "generation"] as const).map((t) => {
                            const count = actions.filter((a) => a.type === t).length;
                            if (count === 0) return null;
                            return (
                                <span key={t} className={`text-[9px] font-mono ${TYPE_COLORS[t]}`}>
                                    {t}: {count}
                                </span>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
