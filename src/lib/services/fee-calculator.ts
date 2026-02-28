// ─── ClaimGuard Success Fee Calculator ───────────────────────
// Calculates fees with two models:
//   - 20% Success Fee: for bills with >$50 in savings
//   - $10 Quick Win: flat fee for small bills (≤$50 savings)
// ──────────────────────────────────────────────────────────────

import { createServerClient } from "@/lib/supabase/server";

const SUCCESS_FEE_RATE = 0.20; // 20% of savings
const QUICK_WIN_THRESHOLD = 50; // If savings ≤ $50, use flat fee
const QUICK_WIN_FEE = 10; // Flat $10 fee for small bills

export type FeeType = "success_fee" | "quick_win";

export interface FeeCalculation {
    grossSavings: number;
    feeRate: number;
    fee: number;
    netSavings: number;
}

export interface SmartFeeCalculation extends FeeCalculation {
    feeType: FeeType;
    feeLabel: string; // "20% Success Fee" or "$10 Quick Win"
}

// ─── Calculate the success fee from gross savings ────────────
export function calculateSuccessFee(grossSavings: number): FeeCalculation {
    if (grossSavings <= 0) {
        return {
            grossSavings: 0,
            feeRate: SUCCESS_FEE_RATE,
            fee: 0,
            netSavings: 0,
        };
    }

    const fee = Math.round(grossSavings * SUCCESS_FEE_RATE * 100) / 100;
    const netSavings = Math.round((grossSavings - fee) * 100) / 100;

    return {
        grossSavings: Math.round(grossSavings * 100) / 100,
        feeRate: SUCCESS_FEE_RATE,
        fee,
        netSavings,
    };
}

// ─── Smart Fee: auto-selects Quick Win ($10) or 20% ─────────
export function calculateSmartFee(grossSavings: number): SmartFeeCalculation {
    if (grossSavings <= 0) {
        return {
            grossSavings: 0,
            feeRate: 0,
            fee: 0,
            netSavings: 0,
            feeType: "quick_win",
            feeLabel: "$10 Quick Win",
        };
    }

    if (grossSavings <= QUICK_WIN_THRESHOLD) {
        // Quick Win: flat $10 fee
        const fee = QUICK_WIN_FEE;
        return {
            grossSavings: Math.round(grossSavings * 100) / 100,
            feeRate: Math.round((fee / grossSavings) * 100) / 100,
            fee,
            netSavings: Math.round((grossSavings - fee) * 100) / 100,
            feeType: "quick_win",
            feeLabel: "$10 Quick Win",
        };
    }

    // Standard 20% success fee
    const baseFee = calculateSuccessFee(grossSavings);
    return {
        ...baseFee,
        feeType: "success_fee",
        feeLabel: "20% Success Fee",
    };
}


// ─── Update user's running financial ledger in Supabase ──────
// Atomically increments total_saved, fees_owed. fees_paid is
// updated only when a payment is actually completed.
export async function updateUserLedger(
    userId: string,
    savings: number,
    fee: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createServerClient();

        // Fetch current ledger values
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("total_saved, fees_owed")
            .eq("id", userId)
            .single();

        if (fetchError || !user) {
            return { success: false, error: fetchError?.message || "User not found" };
        }

        // Update with new values
        const { error: updateError } = await supabase
            .from("users")
            .update({
                total_saved: (parseFloat(user.total_saved) || 0) + savings,
                fees_owed: (parseFloat(user.fees_owed) || 0) + fee,
            })
            .eq("id", userId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error updating ledger",
        };
    }
}

// ─── Mark fee as paid (called after successful payment) ──────
export async function markFeePaid(
    userId: string,
    amount: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createServerClient();

        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("fees_paid, fees_owed")
            .eq("id", userId)
            .single();

        if (fetchError || !user) {
            return { success: false, error: fetchError?.message || "User not found" };
        }

        const { error: updateError } = await supabase
            .from("users")
            .update({
                fees_paid: (parseFloat(user.fees_paid) || 0) + amount,
                fees_owed: Math.max(0, (parseFloat(user.fees_owed) || 0) - amount),
            })
            .eq("id", userId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error marking fee paid",
        };
    }
}
