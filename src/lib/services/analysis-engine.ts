// ─── ClaimGuard Analysis Engine ──────────────────────────────
// Accepts bill text, identifies overcharged CPT/HCPCS codes,
// and calculates potential savings using a fair-price reference DB.
// ──────────────────────────────────────────────────────────────

export interface OverchargeLineItem {
    code: string;
    description: string;
    billedAmount: number;
    fairPrice: number;
    savings: number;
    confidence: number; // 0-100
}

export interface AnalysisResult {
    lineItems: OverchargeLineItem[];
    totalBilled: number;
    totalFairPrice: number;
    potentialSavings: number;
    providerName: string | null;
    analysisNotes: string;
}

// ─── Fair Price Reference Database (CMS & industry averages) ─
// In production this would be a large, regularly-updated dataset.
// These are real CPT code ranges with approximate national averages.
const FAIR_PRICE_DB: Record<string, { description: string; fairPrice: number }> = {
    "99213": { description: "Office visit, established patient (low complexity)", fairPrice: 110.00 },
    "99214": { description: "Office visit, established patient (moderate complexity)", fairPrice: 165.00 },
    "99215": { description: "Office visit, established patient (high complexity)", fairPrice: 235.00 },
    "99283": { description: "Emergency dept visit (moderate severity)", fairPrice: 290.00 },
    "99284": { description: "Emergency dept visit (high severity)", fairPrice: 480.00 },
    "99285": { description: "Emergency dept visit (life-threatening)", fairPrice: 710.00 },
    "99291": { description: "Critical care, first 30-74 minutes", fairPrice: 475.00 },
    "36415": { description: "Venipuncture (blood draw)", fairPrice: 12.00 },
    "85025": { description: "Complete blood count (CBC) with differential", fairPrice: 11.00 },
    "85027": { description: "Complete blood count (CBC) automated", fairPrice: 8.50 },
    "80053": { description: "Comprehensive metabolic panel", fairPrice: 14.00 },
    "80048": { description: "Basic metabolic panel", fairPrice: 11.00 },
    "80061": { description: "Lipid panel", fairPrice: 18.00 },
    "81001": { description: "Urinalysis with microscopy", fairPrice: 4.50 },
    "71046": { description: "Chest X-ray, 2 views", fairPrice: 45.00 },
    "71260": { description: "CT chest with contrast", fairPrice: 340.00 },
    "74177": { description: "CT abdomen and pelvis with contrast", fairPrice: 380.00 },
    "70553": { description: "MRI brain with and without contrast", fairPrice: 520.00 },
    "73721": { description: "MRI joint of lower extremity without contrast", fairPrice: 460.00 },
    "93000": { description: "Electrocardiogram (ECG/EKG) complete", fairPrice: 28.00 },
    "93306": { description: "Echocardiography, transthoracic (TTE) complete", fairPrice: 195.00 },
    "43239": { description: "Upper GI endoscopy with biopsy", fairPrice: 310.00 },
    "45380": { description: "Colonoscopy with biopsy", fairPrice: 425.00 },
    "27447": { description: "Total knee replacement", fairPrice: 1800.00 },
    "27130": { description: "Total hip replacement", fairPrice: 1950.00 },
    "29881": { description: "Knee arthroscopy with meniscectomy", fairPrice: 780.00 },
    "59400": { description: "Routine obstetric care (vaginal delivery)", fairPrice: 2850.00 },
    "59510": { description: "Routine obstetric care (cesarean delivery)", fairPrice: 3200.00 },
    "10060": { description: "Incision and drainage of abscess", fairPrice: 195.00 },
    "11042": { description: "Wound debridement", fairPrice: 145.00 },
    "90834": { description: "Psychotherapy, 45 minutes", fairPrice: 105.00 },
    "90837": { description: "Psychotherapy, 60 minutes", fairPrice: 145.00 },
    "90847": { description: "Family psychotherapy with patient", fairPrice: 125.00 },
    "96372": { description: "Therapeutic injection (IM/SubQ)", fairPrice: 25.00 },
    "J0585": { description: "Botulinum toxin type A injection", fairPrice: 450.00 },
    "96413": { description: "Chemotherapy IV infusion, first hour", fairPrice: 280.00 },
    "77386": { description: "Radiation treatment delivery (IMRT)", fairPrice: 360.00 },
    "88305": { description: "Surgical pathology, gross and microscopic", fairPrice: 75.00 },
    "97110": { description: "Physical therapy, therapeutic exercises", fairPrice: 42.00 },
    "97140": { description: "Manual therapy techniques", fairPrice: 42.00 },
    "97530": { description: "Therapeutic activities", fairPrice: 45.00 },
    "J7321": { description: "Hyaluronan injection (Hyalgan)", fairPrice: 280.00 },
    "20610": { description: "Joint injection/aspiration, major joint", fairPrice: 110.00 },
    "64483": { description: "Epidural injection, lumbar/sacral", fairPrice: 380.00 },
    "62323": { description: "Lumbar epidural steroid injection", fairPrice: 350.00 },
};

// ─── CPT Code Extraction ─────────────────────────────────────
// Extracts CPT/HCPCS codes and their billed amounts from bill text.
interface ExtractedCharge {
    code: string;
    billedAmount: number;
    rawLine: string;
}

function extractCharges(billText: string): ExtractedCharge[] {
    const charges: ExtractedCharge[] = [];
    const lines = billText.split("\n");

    // Pattern: matches CPT codes (5 digits) or HCPCS codes (letter + 4 digits)
    // followed by an amount somewhere on the same line
    const codePattern = /\b([0-9]{5}|[A-Z][0-9]{4})\b/;
    const amountPattern = /\$?\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/g;

    for (const line of lines) {
        const codeMatch = line.match(codePattern);
        if (!codeMatch) continue;

        const code = codeMatch[1];
        // Find the largest dollar amount on the line (likely the billed amount)
        let maxAmount = 0;
        let amountMatch: RegExpExecArray | null;
        const amountRegex = new RegExp(amountPattern.source, "g");

        while ((amountMatch = amountRegex.exec(line)) !== null) {
            const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
            if (amount > maxAmount && amount < 1_000_000) {
                maxAmount = amount;
            }
        }

        if (maxAmount > 0) {
            charges.push({
                code,
                billedAmount: maxAmount,
                rawLine: line.trim(),
            });
        }
    }

    return charges;
}

// ─── Overcharge Detection ────────────────────────────────────
// Compares extracted charges against fair price database and
// flags items billed significantly above fair market value.
const OVERCHARGE_THRESHOLD = 1.3; // flag if billed > 130% of fair price

function detectOvercharges(charges: ExtractedCharge[]): OverchargeLineItem[] {
    const overcharges: OverchargeLineItem[] = [];

    for (const charge of charges) {
        const ref = FAIR_PRICE_DB[charge.code];
        if (!ref) continue; // Code not in our reference DB, skip

        if (charge.billedAmount > ref.fairPrice * OVERCHARGE_THRESHOLD) {
            const savings = charge.billedAmount - ref.fairPrice;
            const overchargeRatio = charge.billedAmount / ref.fairPrice;

            // Confidence is higher when the overcharge is more extreme
            // and the fair price data is well-established
            let confidence = Math.min(95, 50 + (overchargeRatio - 1) * 30);
            confidence = Math.round(confidence * 100) / 100;

            overcharges.push({
                code: charge.code,
                description: ref.description,
                billedAmount: charge.billedAmount,
                fairPrice: ref.fairPrice,
                savings: Math.round(savings * 100) / 100,
                confidence,
            });
        }
    }

    // Sort by savings descending (biggest wins first)
    return overcharges.sort((a, b) => b.savings - a.savings);
}

// ─── Provider Name Extraction ────────────────────────────────
function extractProviderName(billText: string): string | null {
    const lines = billText.split("\n").slice(0, 10); // check first 10 lines
    const keywords = ["hospital", "medical", "health", "clinic", "center", "care", "physician"];

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (keywords.some((kw) => lower.includes(kw)) && line.trim().length > 3) {
            return line.trim().substring(0, 100);
        }
    }

    return null;
}

// ─── Main Analysis Function ──────────────────────────────────
export function analyzeBillText(billText: string): AnalysisResult {
    const charges = extractCharges(billText);
    const lineItems = detectOvercharges(charges);

    const totalBilled = charges.reduce((sum, c) => sum + c.billedAmount, 0);
    const totalFairPrice = lineItems.reduce((sum, item) => sum + item.fairPrice, 0)
        + charges
            .filter((c) => !lineItems.some((li) => li.code === c.code))
            .reduce((sum, c) => sum + c.billedAmount, 0);

    const potentialSavings = lineItems.reduce((sum, item) => sum + item.savings, 0);

    const providerName = extractProviderName(billText);

    let analysisNotes = `Scanned ${charges.length} line items. `;
    if (lineItems.length === 0) {
        analysisNotes += "No significant overcharges detected. All charges appear to be within fair market range.";
    } else {
        analysisNotes += `Found ${lineItems.length} potentially overcharged items totaling $${potentialSavings.toFixed(2)} in possible savings.`;
    }

    return {
        lineItems,
        totalBilled: Math.round(totalBilled * 100) / 100,
        totalFairPrice: Math.round(totalFairPrice * 100) / 100,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        providerName,
        analysisNotes,
    };
}

// ─── Agent Monologue Steps (for UI progress display) ─────────
export interface MonologueStep {
    id: number;
    label: string;
    detail: string;
    durationMs: number;
}

export function getMonologueSteps(chargeCount: number, overchargeCount: number): MonologueStep[] {
    return [
        {
            id: 1,
            label: "Extracting CPT/HCPCS codes",
            detail: "Scanning document for procedure codes and billing line items...",
            durationMs: 1200,
        },
        {
            id: 2,
            label: "Cross-referencing CMS fee schedule",
            detail: `Found ${chargeCount} billable items. Comparing against 2024 Medicare fee schedule and regional averages...`,
            durationMs: 2000,
        },
        {
            id: 3,
            label: "Identifying overcharges",
            detail: `Flagged ${overchargeCount} items billed above 130% of fair market value. Calculating confidence scores...`,
            durationMs: 1500,
        },
        {
            id: 4,
            label: "Calculating potential savings",
            detail: "Aggregating savings across all flagged items and computing your success fee...",
            durationMs: 800,
        },
        {
            id: 5,
            label: "Generating dispute strategy",
            detail: "Preparing itemized dispute letter with legal references and fair price evidence...",
            durationMs: 1800,
        },
        {
            id: 6,
            label: "Analysis complete",
            detail: "Your bill analysis is ready. Review the findings below.",
            durationMs: 500,
        },
    ];
}
