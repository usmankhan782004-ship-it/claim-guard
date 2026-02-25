// ─── Multi-Category Analysis Router ─────────────────────────
// Routes bill text to the correct category-specific analyzer.
// ──────────────────────────────────────────────────────────────

import type { BillCategory, UnifiedAnalysisResult } from "./bill-categories";
import { analyzeBillText } from "./analysis-engine";
import { analyzeAutoInsurance } from "./auto-insurance-analyzer";
import { analyzeRentBill } from "./rent-analyzer";
import { analyzeUtilityBill } from "./utility-analyzer";

export function analyzeByCategory(
    billText: string,
    category: BillCategory
): UnifiedAnalysisResult {
    switch (category) {
        case "medical": {
            const result = analyzeBillText(billText);
            return {
                category: "medical",
                disputeType: "Medical Bill Overcharge",
                lineItems: result.lineItems,
                totalBilled: result.totalBilled,
                totalFairPrice: result.totalFairPrice,
                potentialSavings: result.potentialSavings,
                providerName: result.providerName,
                analysisNotes: result.analysisNotes,
            };
        }
        case "auto":
            return analyzeAutoInsurance(billText);
        case "rent":
            return analyzeRentBill(billText);
        case "utility":
            return analyzeUtilityBill(billText);
        default:
            throw new Error(`Unknown category: ${category}`);
    }
}
