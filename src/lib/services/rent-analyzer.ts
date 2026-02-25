// ─── Rent Analyzer ───────────────────────────────────────────
// Scans rental statements for hidden fees and illegal late
// charges based on standard tenant rights laws.
// ──────────────────────────────────────────────────────────────

import type { FlaggedItem, UnifiedAnalysisResult } from "./bill-categories";

// Common fees that are often illegal or disputable
const QUESTIONABLE_FEES: Record<string, { maxReasonable: number; legalNote: string }> = {
    admin_fee: { maxReasonable: 0, legalNote: "Admin/processing fees are prohibited in many states (NY, CA, IL) unless explicitly in the lease" },
    amenity_fee: { maxReasonable: 50, legalNote: "Amenity fees above $50/mo may be considered unreasonable unless amenities are clearly documented" },
    trash_fee: { maxReasonable: 25, legalNote: "Trash removal above $25/mo may be inflated; many jurisdictions include this in municipal services" },
    digital_fee: { maxReasonable: 0, legalNote: "Digital access/portal fees are not a legitimate housing cost and are prohibited in several states" },
    insurance_fee: { maxReasonable: 0, legalNote: "Charging a fee for insurance requirements (vs requiring insurance) may be an illegal surcharge" },
    parking_fee: { maxReasonable: 100, legalNote: "Parking above $100/mo should be market-comparable; mandatory parking fees may violate tenant rights" },
};

const FEE_PATTERNS: { pattern: RegExp; key: string }[] = [
    { pattern: /admin|processing/i, key: "admin_fee" },
    { pattern: /amenity/i, key: "amenity_fee" },
    { pattern: /trash|garbage|waste/i, key: "trash_fee" },
    { pattern: /digital|portal|access|technology/i, key: "digital_fee" },
    { pattern: /insurance\s+(require|fee)/i, key: "insurance_fee" },
    { pattern: /parking/i, key: "parking_fee" },
];

// Late fee analysis
const MAX_LATE_FEE_PERCENT = 0.05; // 5% of rent is the max in most states
const MIN_GRACE_PERIOD_DAYS = 3; // Most states require at least 3-5 days

interface ExtractedRentCharge {
    type: string;
    key: string;
    amount: number;
    rawLine: string;
}

function extractRentCharges(billText: string): {
    baseRent: number;
    lateFee: number;
    charges: ExtractedRentCharge[];
    gracePeriod: number | null;
} {
    const lines = billText.split("\n");
    let baseRent = 0;
    let lateFee = 0;
    let gracePeriod: number | null = null;
    const charges: ExtractedRentCharge[] = [];

    for (const line of lines) {
        const amount = line.match(/\$[\d,]+\.?\d*/);
        if (!amount) continue;
        const value = parseFloat(amount[0].replace(/[$,]/g, ""));
        if (isNaN(value)) continue;

        // Detect base rent
        if (/base\s+rent/i.test(line) && !(/late|fee|charge/i.test(line))) {
            baseRent = value;
            continue;
        }

        // Detect late fee
        if (/late\s+(fee|charge|penalty)/i.test(line)) {
            lateFee = value;
            continue;
        }

        // Detect questionable fees
        for (const fp of FEE_PATTERNS) {
            if (fp.pattern.test(line)) {
                charges.push({ type: fp.key, key: fp.key, amount: value, rawLine: line.trim() });
                break;
            }
        }
    }

    // Detect grace period
    for (const line of lines) {
        const graceMatch = line.match(/grace\s+period[:\s]*(\d+)\s*day/i);
        if (graceMatch) {
            gracePeriod = parseInt(graceMatch[1]);
        }
        if (/grace\s+period[:\s]*none/i.test(line)) {
            gracePeriod = 0;
        }
    }

    return { baseRent, lateFee, charges, gracePeriod };
}

function extractProviderName(text: string): string | null {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
        if (/property|management|realty|housing|apartment|landlord/i.test(l)) return l;
    }
    return lines[0] || null;
}

export function analyzeRentBill(billText: string): UnifiedAnalysisResult {
    const { baseRent, lateFee, charges, gracePeriod } = extractRentCharges(billText);
    const provider = extractProviderName(billText);

    const flaggedItems: FlaggedItem[] = [];
    let totalBilled = baseRent;
    let totalFair = baseRent; // Base rent itself isn't disputed

    // Flag questionable fees
    for (const charge of charges) {
        const ref = QUESTIONABLE_FEES[charge.key];
        if (!ref) continue;

        totalBilled += charge.amount;
        totalFair += ref.maxReasonable;

        if (charge.amount > ref.maxReasonable) {
            flaggedItems.push({
                code: charge.key.toUpperCase(),
                description: `${charge.rawLine.split(/\s{2,}/)[0]} — ${ref.legalNote}`,
                billedAmount: charge.amount,
                fairPrice: ref.maxReasonable,
                savings: Math.round((charge.amount - ref.maxReasonable) * 100) / 100,
                confidence: ref.maxReasonable === 0 ? 90 : 75,
            });
        }
    }

    // Flag illegal late fees
    if (lateFee > 0 && baseRent > 0) {
        totalBilled += lateFee;
        const maxLate = Math.round(baseRent * MAX_LATE_FEE_PERCENT * 100) / 100;

        if (lateFee > maxLate) {
            flaggedItems.push({
                code: "LATE_FEE",
                description: `Late fee of $${lateFee} exceeds 5% of rent ($${maxLate}). Most states cap late fees at 4-5% of monthly rent.`,
                billedAmount: lateFee,
                fairPrice: maxLate,
                savings: Math.round((lateFee - maxLate) * 100) / 100,
                confidence: 88,
            });
            totalFair += maxLate;
        } else {
            totalFair += lateFee;
        }

        // Flag no grace period
        if (gracePeriod !== null && gracePeriod < MIN_GRACE_PERIOD_DAYS) {
            flaggedItems.push({
                code: "NO_GRACE",
                description: `No grace period stated. Most states require ${MIN_GRACE_PERIOD_DAYS}-5 day grace period before late fees can be charged.`,
                billedAmount: lateFee,
                fairPrice: 0,
                savings: lateFee,
                confidence: 85,
            });
        }
    }

    const potentialSavings = flaggedItems.reduce((sum, i) => sum + i.savings, 0);

    return {
        category: "rent",
        disputeType: "Hidden Fees & Illegal Charges",
        lineItems: flaggedItems,
        totalBilled: Math.round(totalBilled * 100) / 100,
        totalFairPrice: Math.round(totalFair * 100) / 100,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        providerName: provider,
        analysisNotes: flaggedItems.length > 0
            ? `Found ${flaggedItems.length} potentially illegal or disputable charge(s). These include hidden fees and late charges that may violate tenant rights in your state.`
            : "No hidden fees or illegal charges detected.",
    };
}
