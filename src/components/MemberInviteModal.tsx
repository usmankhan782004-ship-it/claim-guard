"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Link2,
    Copy,
    Check,
    ShieldCheck,
    X,
    UserPlus,
    Mail,
    Sparkles,
} from "lucide-react";

// ─── Safe Link Generator ────────────────────────────────────
function generateSafeLink(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789";
    const segments = [8, 4, 4].map((len) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    );
    return `https://app.claimguard.com/join/${segments.join("-")}`;
}

// ─── Component ──────────────────────────────────────────────
interface MemberInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FamilyMember {
    id: string;
    name: string;
    email: string;
    status: "active" | "pending";
    joinedAt?: string;
}

export default function MemberInviteModal({ isOpen, onClose }: MemberInviteModalProps) {
    const [safeLink, setSafeLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Demo family members
    const [members] = useState<FamilyMember[]>([
        { id: "1", name: "You", email: "primary@email.com", status: "active", joinedAt: "Owner" },
    ]);

    const handleGenerateLink = useCallback(async () => {
        setIsGenerating(true);
        setCopied(false);
        // Simulate generation delay
        await new Promise((r) => setTimeout(r, 800));
        setSafeLink(generateSafeLink());
        setIsGenerating(false);
    }, []);

    const handleCopyLink = useCallback(async () => {
        if (!safeLink) return;
        try {
            await navigator.clipboard.writeText(safeLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback
            const ta = document.createElement("textarea");
            ta.value = safeLink;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    }, [safeLink]);

    const spotsLeft = 5 - members.length;

    return (
        <AnimatePresence>
            {isOpen && (
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg rounded-2xl bg-[#080d1a]/98 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden"
                    >
                        {/* Ambient glow */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.08] transition-all z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative z-10 p-8">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Family Shield</h2>
                                    <p className="text-xs text-gray-500">Invite up to 5 members to your vault</p>
                                </div>
                            </div>

                            {/* Spots indicator */}
                            <div className="flex items-center gap-2 mb-6">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1 * i }}
                                        className={`w-8 h-8 rounded-lg border flex items-center justify-center ${i < members.length
                                                ? "bg-emerald-500/15 border-emerald-500/30"
                                                : "bg-white/[0.02] border-white/[0.06] border-dashed"
                                            }`}
                                    >
                                        {i < members.length ? (
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <UserPlus className="w-3 h-3 text-gray-700" />
                                        )}
                                    </motion.div>
                                ))}
                                <span className="text-xs text-gray-500 ml-2">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} available</span>
                            </div>

                            {/* Current Members */}
                            <div className="mb-6">
                                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Members</h4>
                                <div className="space-y-2">
                                    {members.map((m) => (
                                        <div
                                            key={m.id}
                                            className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-emerald-400">{m.name[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-white font-medium">{m.name}</p>
                                                    <p className="text-[10px] text-gray-600">{m.email}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${m.status === "active"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                }`}>
                                                {m.joinedAt || m.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Generate Safe Link */}
                            <div className="mb-4">
                                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                                    <Link2 className="w-3.5 h-3.5" />
                                    Generate Safe Link
                                </h4>

                                {!safeLink ? (
                                    <button
                                        onClick={handleGenerateLink}
                                        disabled={isGenerating}
                                        className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                </motion.div>
                                                <span>Generating secure link…</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-4 h-4" />
                                                <span>Generate Invite Link</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="flex-1 py-2.5 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] font-mono text-xs text-emerald-400 truncate">
                                            {safeLink}
                                        </div>
                                        <button
                                            onClick={handleCopyLink}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copied
                                                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                                                    : "bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08]"
                                                }`}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Quick email invite */}
                            <div>
                                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    Send via Email
                                </h4>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="family@email.com"
                                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/30 transition-colors"
                                    />
                                    <button
                                        disabled={!inviteEmail.includes("@")}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-30 disabled:hover:bg-emerald-500"
                                    >
                                        Invite
                                    </button>
                                </div>
                            </div>

                            {/* Security note */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-5 pt-4 border-t border-white/[0.04] text-center"
                            >
                                <p className="text-[9px] text-gray-700 flex items-center justify-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3" />
                                    Safe Links expire in 72 hours · End-to-end encrypted · Revocable anytime
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
