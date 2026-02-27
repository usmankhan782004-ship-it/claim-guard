"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface InvitePageProps {
    params: Promise<{ id: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
    const { id } = use(params);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617]">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring", damping: 20 }}
                className="w-full max-w-md"
            >
                <div className="rounded-2xl border border-white/[0.08] bg-[#080d1a]/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/40 text-center relative overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

                    {/* Icon */}
                    <div className="relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-emerald-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            You&apos;re Invited!
                        </h1>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Someone shared their{" "}
                            <span className="text-emerald-400 font-semibold">ClaimGuard Family Vault</span>{" "}
                            with you. Join to fight unfair bills together with AI-powered dispute letters.
                        </p>

                        {/* Invite ID badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-mono text-gray-500">
                                Invite: {id}
                            </span>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-3 mb-8 text-left">
                            {[
                                "AI scans your bills for overcharges in seconds",
                                "Generates legal dispute letters with citations",
                                "Covers Medical, Auto, Rent & Utility bills",
                            ].map((benefit, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-2.5 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                                >
                                    <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-300">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/app"
                            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors"
                        >
                            <span>Get Started with ClaimGuard</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <p className="text-[10px] text-gray-600 mt-4">
                            🔒 HIPAA-compliant · Bank-level encryption · Zero upfront cost
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
