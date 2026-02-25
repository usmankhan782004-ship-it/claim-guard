"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface MonologueStep {
    id: number;
    label: string;
    detail: string;
    durationMs: number;
}

interface AgentMonologueProps {
    steps: MonologueStep[];
    onComplete?: () => void;
    autoStart?: boolean;
}

export default function AgentMonologue({
    steps,
    onComplete,
    autoStart = true,
}: AgentMonologueProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [typedText, setTypedText] = useState("");

    // Auto-start the monologue
    useEffect(() => {
        if (autoStart && steps.length > 0 && !isActive) {
            setIsActive(true);
            setCurrentStepIndex(0);
        }
    }, [autoStart, steps, isActive]);

    // Step progression
    useEffect(() => {
        if (currentStepIndex < 0 || currentStepIndex >= steps.length) return;

        const step = steps[currentStepIndex];

        // Type out the detail text character by character
        let charIndex = 0;
        setTypedText("");
        const typeInterval = setInterval(() => {
            if (charIndex < step.detail.length) {
                setTypedText(step.detail.slice(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 20);

        // After the step duration, move to the next step
        const timer = setTimeout(() => {
            setCompletedSteps((prev) => [...prev, step.id]);

            if (currentStepIndex < steps.length - 1) {
                setCurrentStepIndex(currentStepIndex + 1);
            } else {
                setIsActive(false);
                onComplete?.();
            }
        }, step.durationMs);

        return () => {
            clearInterval(typeInterval);
            clearTimeout(timer);
        };
    }, [currentStepIndex, steps, onComplete]);

    if (steps.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-0 overflow-hidden"
        >
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/30">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-gray-500 font-mono ml-2">
                    claimguard-agent — analysis engine v2.1
                </span>
                {isActive && (
                    <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-auto flex items-center gap-1.5"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-emerald-400 font-mono">SCANNING</span>
                    </motion.div>
                )}
                {!isActive && completedSteps.length === steps.length && (
                    <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-emerald-400 font-mono">COMPLETE</span>
                    </div>
                )}
            </div>

            {/* Terminal Body */}
            <div className="p-4 font-mono text-sm max-h-[400px] overflow-y-auto">
                <AnimatePresence mode="sync">
                    {steps.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isCurrent = index === currentStepIndex;
                        const isUpcoming = index > currentStepIndex;

                        if (isUpcoming && !isCurrent) return null;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`mb-3 ${isUpcoming ? "opacity-30" : ""}`}
                            >
                                {/* Step Label */}
                                <div className="flex items-center gap-2 mb-1">
                                    {isCompleted && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-emerald-400 text-xs"
                                        >
                                            ✓
                                        </motion.span>
                                    )}
                                    {isCurrent && !isCompleted && (
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="text-emerald-400 text-xs"
                                        >
                                            ⟳
                                        </motion.span>
                                    )}
                                    <span
                                        className={`text-xs uppercase tracking-wider font-semibold ${isCompleted
                                                ? "text-emerald-400"
                                                : isCurrent
                                                    ? "text-emerald-300"
                                                    : "text-gray-600"
                                            }`}
                                    >
                                        Step {step.id}: {step.label}
                                    </span>
                                </div>

                                {/* Step Detail */}
                                <div className="pl-5">
                                    <span className="text-gray-400 text-xs">
                                        <span className="text-emerald-600 mr-1">{">"}</span>
                                        {isCurrent && !isCompleted ? (
                                            <span>
                                                {typedText}
                                                <span className="typing-cursor" />
                                            </span>
                                        ) : isCompleted ? (
                                            step.detail
                                        ) : null}
                                    </span>
                                </div>

                                {/* Progress Bar for current step */}
                                {isCurrent && !isCompleted && (
                                    <div className="pl-5 mt-2">
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden w-48">
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{
                                                    duration: step.durationMs / 1000,
                                                    ease: "linear",
                                                }}
                                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
