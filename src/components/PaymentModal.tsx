"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CreditCard, Building2, ArrowRight, Check, Copy, ImageIcon } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    billId: string;
    onSuccess?: (paymentResult: Record<string, unknown>) => void;
}

type PayMethod = "card" | "wise" | "bank";

const BANK_DETAILS = {
    accountName: "ClaimGuard Inc.",
    routingNumber: "021000021",
    accountNumber: "1234567890",
    bankName: "Chase Business Checking",
    reference: "",
    wiseEmail: "pay@claimguard.com",
};

export default function PaymentModal({
    isOpen,
    onClose,
    amount,
    billId,
    onSuccess,
}: PaymentModalProps) {
    const [step, setStep] = useState<"form" | "processing" | "receipt" | "success" | "error">("form");
    const [payMethod, setPayMethod] = useState<PayMethod>("card");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [cardName, setCardName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const receiptRef = useRef<HTMLInputElement>(null);

    const ref = `CG-${billId.slice(0, 8).toUpperCase()}`;

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 16);
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(" ") : cleaned;
    };

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 4);
        if (cleaned.length >= 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        return cleaned;
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep("processing");
        setErrorMessage("");
        try {
            const sessionRes = await fetch("/api/process-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create-session", billId, amount }),
            });
            const sessionData = await sessionRes.json();
            if (!sessionRes.ok || !sessionData.success) throw new Error(sessionData.error || "Failed to create checkout session");

            await new Promise((resolve) => setTimeout(resolve, 1500));
            const payRes = await fetch("/api/process-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "process", sessionId: sessionData.session.sessionId, cardNumber: cardNumber.replace(/\s/g, ""), expiry, cvc }),
            });
            const payData = await payRes.json();
            if (payData.success) {
                setStep("success");
                onSuccess?.(payData.payment);
            } else throw new Error(payData.payment?.error || payData.error || "Payment failed");
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Payment processing failed");
            setStep("error");
        }
    };

    const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setReceiptFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleReceiptUpload = async () => {
        if (!receiptFile) return;
        setUploading(true);
        try {
            // Upload receipt to API (stores in manual_payments table)
            const formData = new FormData();
            formData.append("receipt", receiptFile);
            formData.append("billId", billId);
            formData.append("amount", amount.toString());
            formData.append("method", payMethod);
            formData.append("reference", ref);

            const res = await fetch("/api/upload-bill", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setStep("success");
                onSuccess?.({ method: payMethod, receiptUploaded: true, reference: ref });
            } else {
                setErrorMessage("Receipt upload failed. Please try again.");
                setStep("error");
            }
        } catch {
            setErrorMessage("Network error. Please try again.");
            setStep("error");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setStep("form");
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setCardName("");
        setErrorMessage("");
        setReceiptFile(null);
        setReceiptPreview(null);
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
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="glass-card w-full max-w-lg p-0 relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">Pay Success Fee</h2>
                                <p className="text-sm text-gray-400 mt-0.5">Choose your preferred payment method</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {/* ─── Payment Method Selection ─────────── */}
                            {step === "form" && (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {/* Amount */}
                                    <div className="text-center mb-6">
                                        <span className="text-gray-400 text-sm">Amount Due</span>
                                        <div className="text-4xl font-bold text-emerald-400 text-glow">${amount.toFixed(2)}</div>
                                        <span className="text-xs text-gray-500">Ref: {ref}</span>
                                    </div>

                                    {/* Method Tabs */}
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        {([
                                            { id: "card" as PayMethod, label: "Card", icon: CreditCard },
                                            { id: "wise" as PayMethod, label: "Wise", icon: ArrowRight },
                                            { id: "bank" as PayMethod, label: "Bank Transfer", icon: Building2 },
                                        ]).map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setPayMethod(m.id)}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium ${payMethod === m.id
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                        : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/10"
                                                    }`}
                                            >
                                                <m.icon className="w-4 h-4" />
                                                <span>{m.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Card form */}
                                    {payMethod === "card" && (
                                        <form onSubmit={handleCardSubmit} className="space-y-4">
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Cardholder Name</label>
                                                <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe" required className="input-cyber" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Card Number</label>
                                                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" required maxLength={19} className="input-cyber font-mono tracking-widest" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">Expiry</label>
                                                    <input type="text" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="12/28" required maxLength={5} className="input-cyber font-mono" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">CVC</label>
                                                    <input type="text" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" required maxLength={4} className="input-cyber font-mono" />
                                                </div>
                                            </div>
                                            <button type="submit" className="btn-primary w-full mt-2 text-sm">💳 Pay ${amount.toFixed(2)}</button>
                                        </form>
                                    )}

                                    {/* Wise / Bank Transfer details */}
                                    {(payMethod === "wise" || payMethod === "bank") && (
                                        <div className="space-y-3">
                                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
                                                {payMethod === "wise" ? (
                                                    <>
                                                        <DetailRow label="Wise Email" value={BANK_DETAILS.wiseEmail} onCopy={copyToClipboard} copied={copiedField} />
                                                        <DetailRow label="Amount" value={`$${amount.toFixed(2)} USD`} onCopy={copyToClipboard} copied={copiedField} />
                                                        <DetailRow label="Reference" value={ref} onCopy={copyToClipboard} copied={copiedField} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <DetailRow label="Bank" value={BANK_DETAILS.bankName} onCopy={copyToClipboard} copied={copiedField} />
                                                        <DetailRow label="Account Name" value={BANK_DETAILS.accountName} onCopy={copyToClipboard} copied={copiedField} />
                                                        <DetailRow label="Routing #" value={BANK_DETAILS.routingNumber} onCopy={copyToClipboard} copied={copiedField} />
                                                        <DetailRow label="Account #" value={BANK_DETAILS.accountNumber} onCopy={copyToClipboard} copied={copiedField} />
                                                        <DetailRow label="Amount" value={`$${amount.toFixed(2)} USD`} onCopy={copyToClipboard} copied={copiedField} />
                                                        <DetailRow label="Reference" value={ref} onCopy={copyToClipboard} copied={copiedField} />
                                                    </>
                                                )}
                                            </div>

                                            <p className="text-[10px] text-gray-500 text-center">
                                                After sending payment, upload your receipt screenshot below.
                                            </p>

                                            <button
                                                onClick={() => setStep("receipt")}
                                                className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Upload Payment Receipt
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-center text-xs text-gray-600 mt-4">🔒 Secured by ClaimGuard • 256-bit encryption</p>
                                </motion.div>
                            )}

                            {/* ─── Receipt Upload ────────────────────── */}
                            {step === "receipt" && (
                                <motion.div key="receipt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div className="text-center mb-4">
                                        <h3 className="text-sm font-bold text-white mb-1">Upload Payment Receipt</h3>
                                        <p className="text-[11px] text-gray-500">
                                            Upload a screenshot of your {payMethod === "wise" ? "Wise" : "bank"} transfer confirmation.
                                        </p>
                                    </div>

                                    <input
                                        ref={receiptRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleReceiptSelect}
                                        className="hidden"
                                    />

                                    {receiptPreview ? (
                                        <div className="rounded-xl border border-emerald-500/20 overflow-hidden">
                                            <img src={receiptPreview} alt="Receipt" className="w-full max-h-64 object-contain bg-black/50" />
                                            <div className="p-3 flex items-center justify-between bg-white/[0.02]">
                                                <span className="text-xs text-gray-400 truncate">{receiptFile?.name}</span>
                                                <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => receiptRef.current?.click()}
                                            className="w-full py-12 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-emerald-500/30 transition-colors flex flex-col items-center gap-3 text-gray-500 hover:text-emerald-400"
                                        >
                                            <ImageIcon className="w-8 h-8" />
                                            <span className="text-sm">Click to upload receipt screenshot</span>
                                            <span className="text-[10px]">PNG, JPG, or PDF • Max 10MB</span>
                                        </button>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setStep("form")} className="py-2.5 rounded-xl border border-white/[0.06] text-sm text-gray-400 hover:text-white transition-colors">
                                            Back
                                        </button>
                                        <button
                                            onClick={handleReceiptUpload}
                                            disabled={!receiptFile || uploading}
                                            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {uploading ? (
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-400 rounded-full" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            {uploading ? "Uploading..." : "Submit Receipt"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ─── Processing ─────────────────────────── */}
                            {step === "processing" && (
                                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="w-16 h-16 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full mx-auto mb-6"
                                    />
                                    <h3 className="text-lg font-semibold text-white mb-2">Processing Payment</h3>
                                    <p className="text-sm text-gray-400">Verifying card and processing transaction...</p>
                                </motion.div>
                            )}

                            {/* ─── Success ────────────────────────────── */}
                            {step === "success" && (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4"
                                    >
                                        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {payMethod === "card" ? "Payment Successful!" : "Receipt Submitted!"}
                                    </h3>
                                    <p className="text-emerald-400 text-2xl font-bold mb-2">${amount.toFixed(2)}</p>
                                    <p className="text-sm text-gray-400 mb-6">
                                        {payMethod === "card"
                                            ? "Your success fee has been recorded. Appeal letter is now unlocked."
                                            : "Your receipt is being verified. Your appeal letter will unlock once confirmed (usually within 1-2 hours)."}
                                    </p>
                                    <button onClick={onClose} className="btn-primary text-sm">Close</button>
                                </motion.div>
                            )}

                            {/* ─── Error ──────────────────────────────── */}
                            {step === "error" && (
                                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl">✕</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
                                    <p className="text-sm text-red-400 mb-6">{errorMessage}</p>
                                    <button onClick={resetForm} className="btn-primary text-sm">Try Again</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─── Detail Row Component ──────────────────────────────── */
function DetailRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: (text: string, field: string) => void; copied: string | null }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <span className="text-[10px] text-gray-600 block">{label}</span>
                <span className="text-sm text-white font-mono">{value}</span>
            </div>
            <button
                onClick={() => onCopy(value, label)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-emerald-400 transition-colors"
            >
                {copied === label ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}
