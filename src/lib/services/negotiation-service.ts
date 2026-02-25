// ─── ClaimGuard Negotiation Service ──────────────────────────
// Handles creating negotiations, unlocking premium content,
// and managing the pay-to-unlock flow.
// Works in both Supabase-connected and demo (local) modes.
// ──────────────────────────────────────────────────────────────

import { createServerClient } from "@/lib/supabase";
import type { AnalysisResult } from "./analysis-engine";
import { generateAppealLetter, generateSubmissionInstructions } from "./appeal-generator";

const SUCCESS_FEE_RATE = 0.20;

export interface NegotiationRecord {
    id: string;
    user_id: string;
    bill_id: string | null;
    bill_analysis: AnalysisResult;
    total_billed: number;
    potential_savings: number;
    success_fee: number;
    fee_rate: number;
    is_unlocked: boolean;
    unlocked_at: string | null;
    provider_name: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface PremiumContent {
    id: string;
    negotiation_id: string;
    user_id: string;
    final_appeal_letter_markdown: string;
    submission_instructions: string;
    legal_references: unknown[];
    created_at: string;
    updated_at: string;
}

// ─── Create a negotiation + premium content from analysis ────
export async function createNegotiation(
    userId: string,
    analysis: AnalysisResult,
    billId?: string
): Promise<{ negotiation: NegotiationRecord | null; error?: string }> {
    try {
        const supabase = await createServerClient();

        const successFee = Math.round(analysis.potentialSavings * SUCCESS_FEE_RATE * 100) / 100;

        // Insert negotiation record
        const { data: negotiation, error: negError } = await supabase
            .from("negotiations_v2")
            .insert({
                user_id: userId,
                bill_id: billId || null,
                bill_analysis: analysis,
                total_billed: analysis.totalBilled,
                potential_savings: analysis.potentialSavings,
                success_fee: successFee,
                fee_rate: SUCCESS_FEE_RATE * 100,
                is_unlocked: false,
                provider_name: analysis.providerName,
                status: "analyzed",
            })
            .select()
            .single();

        if (negError || !negotiation) {
            return { negotiation: null, error: negError?.message || "Failed to create negotiation" };
        }

        // Generate and store premium content (appeal letter)
        const appealLetter = generateAppealLetter({
            patientName: "Patient Name",
            providerName: analysis.providerName || "Healthcare Provider",
            dateOfService: new Date().toLocaleDateString("en-US"),
            accountNumber: `CG-${Date.now().toString(36).toUpperCase()}`,
            lineItems: analysis.lineItems,
            totalBilled: analysis.totalBilled,
            totalFairPrice: analysis.totalFairPrice,
            potentialSavings: analysis.potentialSavings,
        });

        const submissionInstructions = generateSubmissionInstructions(
            analysis.providerName || "Healthcare Provider"
        );

        const { error: contentError } = await supabase
            .from("premium_content")
            .insert({
                negotiation_id: negotiation.id,
                user_id: userId,
                final_appeal_letter_markdown: appealLetter,
                submission_instructions: submissionInstructions,
                legal_references: [
                    { name: "No Surprises Act (2022)", url: "https://www.cms.gov/nosurprises" },
                    { name: "FDCPA", url: "https://www.ftc.gov/legal-library/browse/statutes/fair-debt-collection-practices-act" },
                    { name: "CMS Fee Schedule", url: "https://www.cms.gov/medicare/payment/fee-schedules/physician" },
                ],
            });

        if (contentError) {
            console.error("Failed to create premium content:", contentError);
        }

        return { negotiation };
    } catch (err) {
        return {
            negotiation: null,
            error: err instanceof Error ? err.message : "Failed to create negotiation",
        };
    }
}

// ─── Unlock a negotiation (flip is_unlocked to true) ─────────
// This is the function the "Mock Unlock" button calls.
// In production, this would be called AFTER a successful
// Lemon Squeezy / Stripe webhook confirms payment.
export async function unlockNegotiation(
    negotiationId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createServerClient();

        const { error } = await supabase
            .from("negotiations_v2")
            .update({
                is_unlocked: true,
                unlocked_at: new Date().toISOString(),
                status: "unlocked",
            })
            .eq("id", negotiationId)
            .eq("user_id", userId);

        if (error) {
            return { success: false, error: error.message };
        }

        // Update user ledger
        const { data: neg } = await supabase
            .from("negotiations_v2")
            .select("success_fee, potential_savings")
            .eq("id", negotiationId)
            .single();

        if (neg) {
            const { data: user } = await supabase
                .from("users")
                .select("fees_paid, total_saved")
                .eq("id", userId)
                .single();

            if (user) {
                await supabase
                    .from("users")
                    .update({
                        fees_paid: (parseFloat(user.fees_paid) || 0) + parseFloat(neg.success_fee),
                        total_saved: (parseFloat(user.total_saved) || 0) + parseFloat(neg.potential_savings),
                    })
                    .eq("id", userId);
            }
        }

        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to unlock negotiation",
        };
    }
}

// ─── Fetch premium content (only works if unlocked via RLS) ──
export async function fetchPremiumContent(
    negotiationId: string
): Promise<{ content: PremiumContent | null; error?: string }> {
    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase
            .from("premium_content")
            .select("*")
            .eq("negotiation_id", negotiationId)
            .single();

        if (error) {
            return { content: null, error: error.message };
        }

        return { content: data };
    } catch (err) {
        return {
            content: null,
            error: err instanceof Error ? err.message : "Failed to fetch premium content",
        };
    }
}
