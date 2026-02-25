"use client";

import { motion } from "framer-motion";
import { Scale, BookOpen, Shield, FileText, AlertTriangle } from "lucide-react";
import type { BillCategory } from "@/lib/services/bill-categories";

// ─── Legal codes by category ─────────────────────────────────
const LEGAL_CODES: Record<string, { code: string; name: string; icon: "scale" | "book" | "shield" | "file" | "alert" }[]> = {
    medical: [
        { code: "§2799A-1", name: "No Surprises Act — Balance Billing Protection", icon: "shield" },
        { code: "FDCPA §808", name: "Fair Debt Collection — Prohibited Practices", icon: "scale" },
        { code: "42 USC §300gg-111", name: "Independent Dispute Resolution Process", icon: "file" },
        { code: "HIPAA §164.530", name: "Right to Accounting of Disclosures", icon: "book" },
        { code: "ACA §1557", name: "Non-Discrimination in Health Programs", icon: "shield" },
        { code: "EMTALA §1867", name: "Emergency Medical Treatment & Labor Act", icon: "alert" },
    ],
    auto: [
        { code: "CA Ins. §1861.02(b)", name: "Good Driver Discount Mandate", icon: "scale" },
        { code: "NAIC Model Act §4(7)", name: "Unfair Rate Discrimination Prohibition", icon: "shield" },
        { code: "FL §627.062", name: "Rate Standards — Actuarial Justification", icon: "file" },
        { code: "TX Ins. §2251", name: "Anti-Rate-Gouging Provisions", icon: "alert" },
        { code: "15 USC §1681", name: "FCRA — Credit-Based Rating Review", icon: "book" },
    ],
    rent: [
        { code: "URLTA §1.402", name: "Uniform Residential Landlord Tenant Act", icon: "scale" },
        { code: "CA AB 2219", name: "Online Payment Convenience Fee Ban", icon: "shield" },
        { code: "NY RPL §235-e", name: "Prohibited Fee Surcharges", icon: "alert" },
        { code: "HSTPA 2019 §7-108", name: "Security Deposit Cap (1 Month Max)", icon: "file" },
        { code: "24 CFR §5.609", name: "HUD Income & Rent Calculation Rules", icon: "book" },
        { code: "42 USC §1437f", name: "Section 8 Housing Choice Voucher Act", icon: "shield" },
    ],
    utility: [
        { code: "PUC §4.3", name: "Meter Reading Frequency Standards", icon: "scale" },
        { code: "NARUC §6.1", name: "Reconnection Fee Cost Limits", icon: "shield" },
        { code: "CA PUC §453", name: "Anti-Junk-Fee Regulations", icon: "alert" },
        { code: "NY PSC §§13-14", name: "Undisclosed Surcharge Prohibition", icon: "file" },
        { code: "16 CFR §429", name: "FTC Cooling-Off Rule", icon: "book" },
    ],
};

const ICON_MAP = {
    scale: Scale,
    book: BookOpen,
    shield: Shield,
    file: FileText,
    alert: AlertTriangle,
};

interface ReasoningSidebarProps {
    category: BillCategory;
    isVisible: boolean;
}

export default function ReasoningSidebar({ category, isVisible }: ReasoningSidebarProps) {
    if (!isVisible) return null;

    const codes = LEGAL_CODES[category] || LEGAL_CODES.medical;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl bg-[#080d1a]/95 backdrop-blur-xl border border-white/[0.06] p-6 h-fit"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Legal Reasoning</h3>
                    <p className="text-[10px] text-gray-500">Statutes cited in this dispute</p>
                </div>
            </div>

            <div className="h-px bg-white/[0.06] mb-4" />

            {/* Code list */}
            <div className="space-y-3">
                {codes.map((item, i) => {
                    const Icon = ICON_MAP[item.icon];
                    return (
                        <motion.div
                            key={item.code}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.06 }}
                            className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-default"
                        >
                            <div className="w-6 h-6 rounded-md bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Icon className="w-3 h-3 text-emerald-400/70" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-mono font-bold text-emerald-400/90 leading-tight">
                                    {item.code}
                                </p>
                                <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
                                    {item.name}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-[9px] text-gray-600 leading-relaxed">
                    Legal citations are AI-generated references. Verify applicability with a licensed attorney for your jurisdiction.
                </p>
            </div>
        </motion.div>
    );
}
