"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { TrendingUp, Vault, Clock, DollarSign } from "lucide-react";

// FV = P(1 + r)^n
const ANNUAL_RATE = 0.07;
const YEARS = 20;

function computeFV(principal: number): number {
    return principal * Math.pow(1 + ANNUAL_RATE, YEARS);
}

function formatCurrency(n: number): string {
    return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

// ─── Animated Counter Hook ──────────────────────────────────
function AnimatedCounter({ value, prefix = "$", className = "" }: { value: number; prefix?: string; className?: string }) {
    const motionValue = useMotionValue(0);
    const rounded = useTransform(motionValue, (v) => `${prefix}${Math.round(v).toLocaleString()}`);
    const [display, setDisplay] = useState(`${prefix}0`);

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 2,
            ease: [0.25, 0.46, 0.45, 0.94],
        });
        const unsub = rounded.on("change", (v) => setDisplay(v));
        return () => { controls.stop(); unsub(); };
    }, [value, motionValue, rounded]);

    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={className}
        >
            {display}
        </motion.span>
    );
}

// ─── Component ──────────────────────────────────────────────
interface WealthTickerProps {
    savedAmount: number; // P — current savings from disputes
}

export default function WealthTicker({ savedAmount }: WealthTickerProps) {
    const futureValue = computeFV(savedAmount);
    const growthMultiple = savedAmount > 0 ? (futureValue / savedAmount) : 0;

    const milestones = [
        { year: 5, value: savedAmount * Math.pow(1 + ANNUAL_RATE, 5) },
        { year: 10, value: savedAmount * Math.pow(1 + ANNUAL_RATE, 10) },
        { year: 20, value: futureValue },
    ];

    // Progress dots for the growth timeline
    const dotCount = 20;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-[#080d1a]/95 backdrop-blur-xl border border-white/[0.06] p-6"
        >
            {/* Ambient glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Vault className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Wealth Ticker</h3>
                    <p className="text-[10px] text-gray-600">Future Value · 7% annual · 20yr horizon</p>
                </div>
            </div>

            {/* Main FV Display */}
            <div className="relative z-10 mb-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">
                    Your savings could become
                </p>
                <div className="flex items-baseline gap-2">
                    <AnimatedCounter
                        value={Math.round(futureValue)}
                        className="text-3xl md:text-4xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    />
                    {savedAmount > 0 && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.5 }}
                            className="text-xs font-bold text-emerald-500/60"
                        >
                            {growthMultiple.toFixed(1)}× growth
                        </motion.span>
                    )}
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                    From <span className="text-emerald-500/80 font-semibold">{formatCurrency(savedAmount)}</span> saved today
                </p>
            </div>

            {/* Growth Timeline Bar */}
            <div className="relative z-10 mb-5">
                <div className="flex items-center gap-[3px]">
                    {Array.from({ length: dotCount }).map((_, i) => {
                        const progress = i / (dotCount - 1);
                        const isActive = savedAmount > 0;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: isActive ? 1 : 0.15, scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.03 }}
                                className="flex-1 h-1.5 rounded-full"
                                style={{
                                    background: isActive
                                        ? `linear-gradient(90deg, #10b981 ${progress * 50}%, #06b6d4 100%)`
                                        : "rgba(255,255,255,0.05)",
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Milestone Cards */}
            <div className="relative z-10 grid grid-cols-3 gap-3">
                {milestones.map((ms, i) => (
                    <motion.div
                        key={ms.year}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                        className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-center"
                    >
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-gray-600" />
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                                {ms.year} Years
                            </span>
                        </div>
                        <AnimatedCounter
                            value={Math.round(ms.value)}
                            className="text-sm font-bold text-emerald-400/90"
                        />
                    </motion.div>
                ))}
            </div>

            {/* Formula Citation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="relative z-10 mt-4 pt-3 border-t border-white/[0.04]"
            >
                <p className="text-[9px] text-gray-700 font-mono text-center">
                    FV = P(1 + r)<sup>n</sup> &nbsp;·&nbsp; r = 7% &nbsp;·&nbsp; n = 20 years &nbsp;·&nbsp; compounding annually
                </p>
            </motion.div>
        </motion.div>
    );
}
