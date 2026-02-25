"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    hover?: boolean;
    glow?: boolean;
    onClick?: () => void;
}

export default function GlassCard({
    children,
    className = "",
    delay = 0,
    hover = true,
    glow = false,
    onClick,
}: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            whileHover={
                hover
                    ? {
                        scale: 1.01,
                        transition: { duration: 0.2 },
                    }
                    : undefined
            }
            className={`glass-card p-6 ${glow ? "glow-emerald" : ""} ${onClick ? "cursor-pointer" : ""
                } ${className}`}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}
