"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, Timer } from "lucide-react";
import type { BillCategory } from "@/lib/services/bill-categories";

// ─── Filing windows by category ──────────────────────────────
const FILING_WINDOWS: Record<string, { days: number; label: string; statute: string }> = {
    medical: { days: 45, label: "No Surprises Act IDR filing window", statute: "42 USC §300gg-111(c)(1)" },
    auto: { days: 60, label: "State DOI rate complaint window", statute: "NAIC Model §4(7)" },
    rent: { days: 30, label: "Tenant rights dispute notice period", statute: "URLTA §1.402" },
    utility: { days: 30, label: "PUC billing dispute deadline", statute: "PUC Service Standard §4.3" },
};

interface UrgencyTickerProps {
    category: BillCategory;
    analysisDate?: Date;
}

export default function UrgencyTicker({ category, analysisDate }: UrgencyTickerProps) {
    const window = FILING_WINDOWS[category] || FILING_WINDOWS.medical;
    const startDate = analysisDate || new Date();

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const deadline = new Date(startDate.getTime() + window.days * 24 * 60 * 60 * 1000);

        const tick = () => {
            const now = new Date();
            const diff = Math.max(0, deadline.getTime() - now.getTime());
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [startDate, window.days]);

    const urgencyLevel = timeLeft.days <= 7 ? "critical" : timeLeft.days <= 14 ? "warning" : "normal";
    const urgencyColor = urgencyLevel === "critical" ? "text-red-400" : urgencyLevel === "warning" ? "text-amber-400" : "text-emerald-400";
    const urgencyBg = urgencyLevel === "critical" ? "bg-red-500/10 border-red-500/20" : urgencyLevel === "warning" ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20";
    const urgencyGlow = urgencyLevel === "critical" ? "shadow-red-500/10" : urgencyLevel === "warning" ? "shadow-amber-500/10" : "shadow-emerald-500/10";

    const digits = [
        { label: "DAYS", value: timeLeft.days },
        { label: "HRS", value: timeLeft.hours },
        { label: "MIN", value: timeLeft.minutes },
        { label: "SEC", value: timeLeft.seconds },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl bg-[#080d1a]/95 backdrop-blur-xl border border-white/[0.06] p-5 shadow-lg ${urgencyGlow}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={urgencyLevel === "critical" ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`w-8 h-8 rounded-lg ${urgencyBg} flex items-center justify-center`}
                    >
                        {urgencyLevel === "critical" ? (
                            <AlertTriangle className={`w-4 h-4 ${urgencyColor}`} />
                        ) : (
                            <Clock className={`w-4 h-4 ${urgencyColor}`} />
                        )}
                    </motion.div>
                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Legal Filing Window</h3>
                        <p className="text-[10px] text-gray-500">{window.label}</p>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${urgencyBg} ${urgencyColor}`}>
                    <Timer className="w-2.5 h-2.5 inline mr-1" />
                    {urgencyLevel === "critical" ? "URGENT" : urgencyLevel === "warning" ? "LIMITED" : "ACTIVE"}
                </div>
            </div>

            {/* Countdown digits */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {digits.map((d, i) => (
                    <motion.div
                        key={d.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className="text-center"
                    >
                        <div className={`rounded-xl bg-white/[0.03] border border-white/[0.06] py-3 px-2 ${urgencyLevel === "critical" ? "ring-1 ring-red-500/10" : ""}`}>
                            <motion.span
                                key={d.value}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-2xl font-black font-mono ${urgencyColor} drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]`}
                            >
                                {String(d.value).padStart(2, "0")}
                            </motion.span>
                        </div>
                        <span className="text-[9px] text-gray-600 font-medium tracking-widest mt-1.5 block">{d.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Message */}
            <div className={`rounded-xl ${urgencyBg} p-3`}>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                    <span className={`font-bold ${urgencyColor}`}>
                        {urgencyLevel === "critical"
                            ? "⚠ Time-sensitive: "
                            : urgencyLevel === "warning"
                                ? "⏳ Deadline approaching: "
                                : "📋 "}
                    </span>
                    Standard appeals for <span className="text-white font-semibold capitalize">{category}</span> bills
                    expire in <span className={`font-bold ${urgencyColor}`}>{timeLeft.days} days</span>.
                    Act now to secure your recovery.
                </p>
                <p className="text-[9px] text-gray-600 mt-1.5 font-mono">
                    Ref: {window.statute}
                </p>
            </div>
        </motion.div>
    );
}
