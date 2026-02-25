// ─── ClaimGuard Fee Calculator (Client-Safe) ────────────────
// Pure calculation functions — no server imports.
// Use this in client components (DiagnosisScreen, etc.)
// ──────────────────────────────────────────────────────────────

const SUCCESS_FEE_RATE = 0.20;
const QUICK_WIN_THRESHOLD = 50;
const QUICK_WIN_FEE = 10;

export type FeeType = "success_fee" | "quick_win";

export interface FeeCalculation {
    grossSavings: number;
    feeRate: number;
    fee: number;
    netSavings: number;
}

export interface SmartFeeCalculation extends FeeCalculation {
    feeType: FeeType;
    feeLabel: string;
}

export function calculateSuccessFee(grossSavings: number): FeeCalculation {
    if (grossSavings <= 0) {
        return { grossSavings: 0, feeRate: SUCCESS_FEE_RATE, fee: 0, netSavings: 0 };
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

export function calculateSmartFee(grossSavings: number): SmartFeeCalculation {
    if (grossSavings <= 0) {
        return { grossSavings: 0, feeRate: 0, fee: 0, netSavings: 0, feeType: "quick_win", feeLabel: "$10 Quick Win" };
    }

    if (grossSavings <= QUICK_WIN_THRESHOLD) {
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

    const baseFee = calculateSuccessFee(grossSavings);
    return { ...baseFee, feeType: "success_fee", feeLabel: "20% Success Fee" };
}
