"use client";

import { motion } from "framer-motion";
import { Heart, Car, Home, Flame } from "lucide-react";
import type { BillCategory } from "@/lib/services/bill-categories";
import { CATEGORIES } from "@/lib/services/bill-categories";

const ICON_MAP: Record<string, React.ReactNode> = {
    Heart: <Heart className="w-6 h-6" />,
    Car: <Car className="w-6 h-6" />,
    Home: <Home className="w-6 h-6" />,
    Flame: <Flame className="w-6 h-6" />,
};

interface CategorySelectorProps {
    selected: BillCategory | null;
    onSelect: (category: BillCategory) => void;
    disabled?: boolean;
}

export default function CategorySelector({ selected, onSelect, disabled }: CategorySelectorProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat, i) => {
                const isActive = selected === cat.id;
                return (
                    <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.4 }}
                        onClick={() => !disabled && onSelect(cat.id)}
                        disabled={disabled}
                        className={`relative group p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isActive
                                ? "border-emerald-500/40 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10"
                                : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                            }`}
                        style={{
                            boxShadow: isActive ? `0 0 30px ${cat.accentColor}15` : undefined,
                        }}
                    >
                        {/* Selection indicator */}
                        {isActive && (
                            <motion.div
                                layoutId="category-glow"
                                className="absolute -top-px left-4 right-4 h-[2px] rounded-full"
                                style={{ backgroundColor: cat.accentColor }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}

                        {/* Icon */}
                        <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 transition-colors ${isActive
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                    : "bg-white/[0.03] border-white/10 text-gray-500 group-hover:text-gray-300"
                                }`}
                            style={isActive ? { color: cat.accentColor, borderColor: `${cat.accentColor}40`, backgroundColor: `${cat.accentColor}15` } : {}}
                        >
                            {ICON_MAP[cat.icon]}
                        </div>

                        {/* Label */}
                        <h3 className={`text-sm font-semibold mb-0.5 transition-colors ${isActive ? "text-white" : "text-gray-300"}`}>
                            {cat.label}
                        </h3>
                        <p className={`text-[11px] leading-tight transition-colors ${isActive ? "text-gray-400" : "text-gray-600"}`}>
                            {cat.tagline}
                        </p>

                        {/* Scan description tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[#0a0f1a] border border-white/10 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {cat.scanDescription}
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}
