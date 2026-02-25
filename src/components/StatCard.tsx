"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, ReactNode } from "react";

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    delay?: number;
    color?: "emerald" | "amber" | "red" | "blue";
}

const colorMap = {
    emerald: {
        iconBg: "bg-emerald-500/10",
        iconText: "text-emerald-400",
        glow: "shadow-emerald-500/10",
        border: "border-emerald-500/20",
    },
    amber: {
        iconBg: "bg-amber-500/10",
        iconText: "text-amber-400",
        glow: "shadow-amber-500/10",
        border: "border-amber-500/20",
    },
    red: {
        iconBg: "bg-red-500/10",
        iconText: "text-red-400",
        glow: "shadow-red-500/10",
        border: "border-red-500/20",
    },
    blue: {
        iconBg: "bg-blue-500/10",
        iconText: "text-blue-400",
        glow: "shadow-blue-500/10",
        border: "border-blue-500/20",
    },
};

// ─── Animated Counter ────────────────────────────────────────
function AnimatedCounter({
    value,
    prefix = "",
    suffix = "",
}: {
    value: number;
    prefix?: string;
    suffix?: string;
}) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => {
        if (v >= 1000) {
            return `${prefix}${v.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}${suffix}`;
        }
        return `${prefix}${v.toFixed(2)}${suffix}`;
    });

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 2,
            ease: [0.25, 0.46, 0.45, 0.94],
        });
        return controls.stop;
    }, [count, value]);

    return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({
    icon,
    label,
    value,
    prefix = "$",
    suffix = "",
    trend,
    trendValue,
    delay = 0,
    color = "emerald",
}: StatCardProps) {
    const colors = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-card p-6 relative overflow-hidden group"
        >
            {/* Background glow effect */}
            <div
                className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 
        ${color === "emerald" ? "bg-emerald-500" : ""}
        ${color === "amber" ? "bg-amber-500" : ""}
        ${color === "red" ? "bg-red-500" : ""}
        ${color === "blue" ? "bg-blue-500" : ""}
        group-hover:opacity-30 transition-opacity duration-500`}
            />

            <div className="relative z-10">
                {/* Icon + Label */}
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBg}`}
                    >
                        <span className={colors.iconText}>{icon}</span>
                    </div>
                    <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                        {label}
                    </span>
                </div>

                {/* Value */}
                <div className="text-3xl font-bold text-white mb-2 tracking-tight">
                    <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
                </div>

                {/* Trend */}
                {trend && trendValue && (
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`text-xs font-semibold ${trend === "up"
                                    ? "text-emerald-400"
                                    : trend === "down"
                                        ? "text-red-400"
                                        : "text-gray-500"
                                }`}
                        >
                            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}{" "}
                            {trendValue}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
