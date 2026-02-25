"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    billId: string;
    onSuccess?: (paymentResult: Record<string, unknown>) => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    amount,
    billId,
    onSuccess,
}: PaymentModalProps) {
    const [step, setStep] = useState<"form" | "processing" | "success" | "error">(
        "form"
    );
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [cardName, setCardName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // ─── Format card number with spaces ────────────────────
    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 16);
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(" ") : cleaned;
    };

    // ─── Format expiry as MM/YY ────────────────────────────
    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 4);
        if (cleaned.length >= 2) {
            return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        }
        return cleaned;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep("processing");
        setErrorMessage("");

        try {
            // Step 1: Create checkout session
            const sessionRes = await fetch("/api/process-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create-session",
                    billId,
                    amount,
                }),
            });

            const sessionData = await sessionRes.json();
            if (!sessionRes.ok || !sessionData.success) {
                throw new Error(sessionData.error || "Failed to create checkout session");
            }

            // Step 2: Process payment (simulated delay for UX)
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const payRes = await fetch("/api/process-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "process",
                    sessionId: sessionData.session.sessionId,
                    cardNumber: cardNumber.replace(/\s/g, ""),
                    expiry,
                    cvc,
                }),
            });

            const payData = await payRes.json();

            if (payData.success) {
                setStep("success");
                onSuccess?.(payData.payment);
            } else {
                throw new Error(
                    payData.payment?.error || payData.error || "Payment failed"
                );
            }
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Payment processing failed"
            );
            setStep("error");
        }
    };

    const resetForm = () => {
        setStep("form");
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setCardName("");
        setErrorMessage("");
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="glass-card w-full max-w-md p-0 relative z-10 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">Pay Success Fee</h2>
                                <p className="text-sm text-gray-400 mt-0.5">
                                    Simulated checkout • Any card accepted
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center 
                         bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {/* ─── Payment Form ───────────────────────── */}
                            {step === "form" && (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    {/* Amount Display */}
                                    <div className="text-center mb-6">
                                        <span className="text-gray-400 text-sm">Amount Due</span>
                                        <div className="text-4xl font-bold text-emerald-400 text-glow">
                                            ${amount.toFixed(2)}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            20% success fee on savings
                                        </span>
                                    </div>

                                    {/* Card Name */}
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">
                                            Cardholder Name
                                        </label>
                                        <input
                                            type="text"
                                            value={cardName}
                                            onChange={(e) => setCardName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                            className="input-cyber"
                                        />
                                    </div>

                                    {/* Card Number */}
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">
                                            Card Number
                                        </label>
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={(e) =>
                                                setCardNumber(formatCardNumber(e.target.value))
                                            }
                                            placeholder="4242 4242 4242 4242"
                                            required
                                            maxLength={19}
                                            className="input-cyber font-mono tracking-widest"
                                        />
                                    </div>

                                    {/* Expiry + CVC */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">
                                                Expiry
                                            </label>
                                            <input
                                                type="text"
                                                value={expiry}
                                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                                placeholder="12/28"
                                                required
                                                maxLength={5}
                                                className="input-cyber font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">
                                                CVC
                                            </label>
                                            <input
                                                type="text"
                                                value={cvc}
                                                onChange={(e) =>
                                                    setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                                                }
                                                placeholder="123"
                                                required
                                                maxLength={4}
                                                className="input-cyber font-mono"
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary w-full mt-2 text-sm">
                                        💳 Pay ${amount.toFixed(2)}
                                    </button>

                                    <p className="text-center text-xs text-gray-600 mt-2">
                                        🔒 Secured by ClaimGuard • Simulated Mode
                                    </p>
                                </motion.form>
                            )}

                            {/* ─── Processing ─────────────────────────── */}
                            {step === "processing" && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-12"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="w-16 h-16 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full mx-auto mb-6"
                                    />
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Processing Payment
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Verifying card and processing transaction...
                                    </p>
                                </motion.div>
                            )}

                            {/* ─── Success ────────────────────────────── */}
                            {step === "success" && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 
                             flex items-center justify-center mx-auto mb-4"
                                    >
                                        <svg
                                            className="w-10 h-10 text-emerald-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </motion.div>

                                    <h3 className="text-xl font-bold text-white mb-1">
                                        Payment Successful!
                                    </h3>
                                    <p className="text-emerald-400 text-2xl font-bold mb-2">
                                        ${amount.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-400 mb-6">
                                        Your success fee has been recorded.
                                    </p>

                                    <button onClick={onClose} className="btn-primary text-sm">
                                        Close
                                    </button>
                                </motion.div>
                            )}

                            {/* ─── Error ──────────────────────────────── */}
                            {step === "error" && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl">✕</span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Payment Failed
                                    </h3>
                                    <p className="text-sm text-red-400 mb-6">{errorMessage}</p>

                                    <button onClick={resetForm} className="btn-primary text-sm">
                                        Try Again
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer gradient */}
                    <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
