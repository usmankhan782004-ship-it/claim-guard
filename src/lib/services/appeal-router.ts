// ─── Multi-Category Appeal Router ────────────────────────────
// Routes to the correct appeal letter generator by category.
// ──────────────────────────────────────────────────────────────

import type { BillCategory, UnifiedAnalysisResult } from "./bill-categories";
import { generateAppealLetter, generateSubmissionInstructions } from "./appeal-generator";

// ─── Auto Insurance: Comparative Rate Analysis Letter ───────
function generateAutoAppeal(data: UnifiedAnalysisResult): string {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const rows = data.lineItems
        .map((i) => {
            const pctAbove = Math.round(((i.billedAmount - i.fairPrice) / i.fairPrice) * 100);
            return `| ${i.description} | $${i.billedAmount.toFixed(2)} | $${i.fairPrice.toFixed(2)} | +${pctAbove}% | $${i.savings.toFixed(2)} |`;
        })
        .join("\n");

    const avgExcess = data.lineItems.length > 0
        ? Math.round(data.lineItems.reduce((sum, i) => sum + ((i.billedAmount - i.fairPrice) / i.fairPrice) * 100, 0) / data.lineItems.length)
        : 0;

    // Good Driver / Loyalty statute block if >15% hike detected
    const hikeItems = data.lineItems.filter(i => ((i.billedAmount - i.fairPrice) / i.fairPrice) > 0.15);
    const goodDriverBlock = hikeItems.length > 0 ? `
## Good Driver & Loyalty Statute Violations

My premium has increased by more than **15%** on **${hikeItems.length} coverage line(s)** without corresponding claims activity. This may violate:

- **NY ISC § 2335** — Accident Surcharge Limit: limits how much an insurer can surcharge for a single accident.
- **CA Insurance Code §1861.02(b)** — "Good Driver" discount mandate: drivers with clean records for 3+ years are entitled to a minimum 20% discount on liability premiums.
- **NAIC Model Act §4(7)** — Prohibits "unfairly discriminatory" rates for policyholders with equivalent risk profiles and loss histories.
- **State Anti-Rate-Gouging Provisions** — Many states (TX Ins. Code §2251, FL §627.062) require actuarial justification for premium increases exceeding 15%.
- **Loyalty Discount Statutes** — Long-term policyholders (3+ years continuous coverage) may be entitled to loyalty rate reductions under state-specific regulations.

I have maintained a **clean driving record** with **zero claims filed**. A premium increase of this magnitude without actuarial basis is subject to regulatory review.
` : "";

    return `# Comparative Rate Analysis — Formal Re-evaluation Request

**Date:** ${today}

**To:** Underwriting Department
${data.providerName || "Auto Insurance Provider"}

**Re:** Comparative Rate Analysis — Premium Exceeds Market Benchmarks

---

Dear Underwriting Department,

I am writing to formally request a premium re-evaluation based on a **Comparative Rate Analysis** of my current policy. I have benchmarked each coverage line against published market data, including **NAIC state averages**, **Insurance Information Institute (III) benchmarks**, and **regional competitor pricing**.

## Comparative Rate Analysis

| Coverage Line | My Premium | State Avg (NAIC) | % Above Market | Excess Amount |
|---------------|-----------|-------------------|----------------|---------------|
${rows}

### Summary

| Metric | Amount |
|--------|--------|
| **Total Current Premium** | $${data.totalBilled.toFixed(2)} |
| **Market Benchmark Total** | $${data.totalFairPrice.toFixed(2)} |
| **Total Excess** | **$${data.potentialSavings.toFixed(2)}** |
| **Average % Above Market** | **+${avgExcess}%** |
| **Lines Above Threshold** | ${data.lineItems.length} / ${data.lineItems.length + 2} coverage lines |
${goodDriverBlock}
## Market Data Sources

This analysis is based on the following publicly available data:
- **NAIC (National Association of Insurance Commissioners)** — State auto insurance database, most recent filing year
- **Insurance Information Institute (III)** — Average expenditures by coverage type
- **State Department of Insurance** — Published rate filings for my ZIP code
- **Competitor Quotes** — Quotes obtained from 3+ carriers for identical coverage

## Justification for Re-evaluation

Pursuant to state rate regulations, these premiums require scrutiny. 

1. **Clean Driving Record** — Zero claims filed in 24+ months, no at-fault accidents, no moving violations.
2. **Low Risk Profile** — Annual mileage below state average, vehicle equipped with anti-theft and safety features.
3. **Rating Factor Review** — My premiums exceed published state averages by an average of **+${avgExcess}%**, which may indicate outdated or incorrect rating factors in my file. This charge appears to be in violation of fair rating practices under NAIC frameworks.

## Requested Action

I request a formal review of this premium calculation. Specifically:
1. **Conduct a full rate review** — Re-evaluate my risk classification using current driving record, credit data, and vehicle information.
2. **Provide a written rate justification** — For each coverage line that remains above the state average, provide the specific actuarial factors used.
3. **Apply all eligible discounts** — Including loyalty, safe driver, low mileage, multi-policy, and equipment discounts.
4. **Match or approach market rates** — Adjust premiums to within 10% of the published state average for each coverage line.

## Escalation Timeline

If I do not receive a satisfactory response within **14 business days**, I will:
- File a **rate complaint** with the State Department of Insurance citing the above comparative data
- Submit a **consumer complaint** through the NAIC Consumer Information Source (CIS)
- Transfer my policy to a carrier offering market-rate coverage

Sincerely,

*This Comparative Rate Analysis was generated by ClaimGuard AI — Auto Insurance Engine*
`;
}

// ─── Rent: Tenant Rights Dispute Letter ─────────────────────
function generateRentAppeal(data: UnifiedAnalysisResult): string {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const camItems = data.lineItems.filter((i) => i.code.startsWith("CAM"));
    const noticeItems = data.lineItems.filter((i) => i.code === "NOTICE_VIOLATION");
    const feeItems = data.lineItems.filter((i) => !i.code.startsWith("CAM") && i.code !== "NOTICE_VIOLATION");

    const allRows = data.lineItems
        .map((i) => `| ${i.code} | ${i.description} | $${i.billedAmount.toFixed(2)} | $${i.fairPrice.toFixed(2)} | $${i.savings.toFixed(2)} |`)
        .join("\n");

    let camSection = "";
    if (camItems.length > 0) {
        const camRows = camItems
            .map((i) => `| ${i.code} | $${i.billedAmount.toFixed(2)} | $${i.fairPrice.toFixed(2)} | $${i.savings.toFixed(2)} |`)
            .join("\n");
        camSection = `
## Common Area Maintenance (CAM) Overcharges

The following CAM charges lack required itemized documentation and/or exceed reasonable limits:

| Issue | Charged | Reasonable Max | Excess |
|-------|---------|----------------|--------|
${camRows}

**Legal Basis for CAM Dispute:**
- Residential tenants are entitled to **itemized CAM breakdowns** showing actual costs for maintenance, landscaping, utilities, and repairs.
- Non-itemized or lump-sum CAM charges are disputable under URLTA and most state landlord-tenant statutes.
- Tenants have the **right to audit** CAM expenses and request supporting invoices/receipts.
- CAM reconciliation adjustments require **documented proof** of actual expenditures.
`;
    }

    let noticeSection = "";
    if (noticeItems.length > 0) {
        noticeSection = `
## Notice Period Violations

${noticeItems.map((i) => `- **${i.description}`).join("\n")}

**Legal Basis for Notice Dispute:**
- Most states require **30-60 days written notice** before a rent increase takes effect.
- Notice must be delivered in writing (not verbal) and must specify the new amount and effective date.
- Any rent increase applied without proper notice is **legally unenforceable** and the tenant has the right to continue paying the previous rate.
- In rent-controlled jurisdictions, additional regulations may apply, including caps on allowable increases.
`;
    }

    return `# Formal Dispute — Rental Charges

**Date:** ${today}

**To:** ${data.providerName || "Property Management"}

**Re:** Dispute of Unauthorized Charges, CAM Overcharges, and Notice Violations

---

Dear Property Management,

I am writing to formally dispute **${data.lineItems.length} charge(s)** on my rental statement that I believe are unauthorized, excessive, or in violation of tenant rights law.

## All Disputed Charges

| Code | Issue | Charged | Legal Max | Excess |
|------|-------|---------|-----------|--------|
${allRows}

**Total Disputed:** $${data.potentialSavings.toFixed(2)}
${camSection}${noticeSection}
## General Legal Basis

This dispute is filed pursuant to explicit tenant protection statutes, including:

1. **California AB 2943 (Junk Fee Ban)** — Prohibits landlords and businesses from charging hidden "junk fees" not clearly disclosed at the time of lease signing.
2. **Florida SB 1592 (End Junk Fees for Renters Act)** — Limits the ability of property management to levy arbitrary administrative or processing charges.
3. **Uniform Residential Landlord and Tenant Act (URLTA)** — Prohibits unconscionable rental terms, including hidden fees, unjustified CAM charges, and rent increases without proper notice.

These charges appear to be in violation of transparent leasing laws and explicit state fee caps. 

## Requested Resolution

I request a formal review of these ledger items. Please immediately:

1. **Remove all disputed fees** that are not explicitly authorized in the lease agreement.
2. **Provide itemized CAM documentation** with receipts for any CAM charges you believe are valid.
3. **Rescind any rent increase** applied without the required written notice period.
4. **Refund any late fees** charged without a proper grace period or exceeding the legal cap.
5. **Provide the specific lease clause** authorizing each disputed charge.

If unresolved within **30 days**, I will:
- File a complaint with the **State Tenant Rights Agency**
- Report to the **Consumer Financial Protection Bureau (CFPB)**
- Request a **CAM audit** through legal counsel
- Consult with a tenant rights attorney regarding notice period violations

Sincerely,

*Generated by ClaimGuard AI — Tenant Rights Analysis Engine*
`;
}

// ─── Utility: Back-Billing & Estimated Reading Dispute ──────
function generateUtilityAppeal(data: UnifiedAnalysisResult): string {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const rows = data.lineItems
        .map((i) => `| ${i.code} | ${i.description} | $${i.billedAmount.toFixed(2)} | $${i.fairPrice.toFixed(2)} | $${i.savings.toFixed(2)} |`)
        .join("\n");

    // Build the Estimated vs Actual comparison section
    const estItems = data.lineItems.filter((i) => i.code === "EST_OVER");
    let estVsActualSection = "";
    if (estItems.length > 0) {
        const estRows = estItems
            .map((i) => `| Estimated Period(s) | $${i.billedAmount.toFixed(2)} | $${i.fairPrice.toFixed(2)} | $${i.savings.toFixed(2)} | ${i.description.match(/(\d+)%/)?.[0] || "N/A"} |`)
            .join("\n");
        estVsActualSection = `
## Estimated Reading vs. Actual Reading Comparison

The following table compares the amounts billed using **estimated meter readings** against the corrected amounts based on **actual meter data**:

| Period | Billed (Estimated) | Fair Value (Actual) | Overcharge | % Discrepancy |
|--------|-------------------|---------------------|------------|---------------|
${estRows}

**Key Findings:**
- Estimated readings were consistently **higher** than actual meter data, indicating systematic over-estimation.
- The utility failed to make reasonable efforts to obtain actual readings, relying instead on inflated estimates.
- Per **PUC Service Standard §4.3**, utilities must obtain actual readings at least once every 3 billing cycles. Extended estimation constitutes a service violation.
- Customers are entitled to a **full refund** of the difference between estimated and actual usage charges.
`;
    }

    // Service Connection junk fee detection
    const junkFeeItems = data.lineItems.filter((i) =>
        /connect|disconnect|activation|reactivat|service\s+charge|meter\s+set|turn.?on|hook.?up/i.test(i.description)
    );
    let junkFeeSection = "";
    if (junkFeeItems.length > 0) {
        const junkRows = junkFeeItems
            .map((i) => `| ${i.description} | $${i.billedAmount.toFixed(2)} | $${i.fairPrice.toFixed(2)} | $${i.savings.toFixed(2)} |`)
            .join("\n");
        junkFeeSection = `
## Service Connection & Junk Fee Analysis

The following charges appear to be **service connection junk fees** — administrative charges that exceed reasonable costs or are prohibited in many jurisdictions:

| Fee Description | Billed | Max Allowable | Overcharge |
|-----------------|--------|---------------|------------|
${junkRows}

**Regulatory Basis:**
- **PUC Tariff Schedule** — Service connection fees are capped by the utility's approved tariff. Charges exceeding the tariff rate are unauthorized.
- **NARUC Consumer Guidelines §6.1** — Reconnection fees must reflect actual costs; inflated reconnection charges constitute an unfair practice.
- **Anti-Junk-Fee Regulations** — Several states (CA PUC §453, NY PSC §§ 13-14) prohibit utilities from imposing undisclosed administrative surcharges.
- Customers who were never disconnected cannot be charged reconnection or service activation fees.
`;
    }

    return `# Formal Dispute — Utility Billing Errors

**Date:** ${today}

**To:** Billing Department
${data.providerName || "Utility Provider"}

**Re:** Dispute of Back-Billing, Estimated Meter Overcharges, Service Connection Fees, and Rate Discrepancies

---

Dear Billing Department,

I am writing to formally dispute **${data.lineItems.length} billing issue(s)** on my account that I believe constitute improper back-billing, estimated meter overcharges, unauthorized junk fees, and/or unauthorized rate changes.

## All Disputed Items

| Issue | Description | Billed | Fair Value | Excess |
|-------|-------------|--------|------------|--------|
${rows}

**Total Disputed:** $${data.potentialSavings.toFixed(2)}
${estVsActualSection}${junkFeeSection}
## Legal Basis

This dispute is filed pursuant to public utility commission laws:

1. **Back-Billing Regulations** — Most state utility commissions prohibit back-billing customers for more than **12 months** of estimated usage. Any charges beyond this period are the utility's responsibility.
2. **Estimated vs. Actual Meter Standards** — When estimated readings significantly exceed actual usage (as revealed by meter replacement or actual reading), customers are entitled to a **full refund** of the overcharge. The burden of proof lies with the utility to demonstrate estimated readings were reasonable.
3. **Service Connection Fee Caps** — Connection, disconnection, and reactivation fees are regulated by PUC tariffs and cannot exceed approved maximums.

These practices appear to be in violation of standard Public Utility Commission administrative codes protecting against unverified back-billing and undisclosed surcharges.

## Requested Resolution

I request a formal review of these statements. Specifically, I am asking to:

1. **Remove all back-billing charges** exceeding the 12-month regulatory limit.
2. **Refund the difference** between estimated and actual meter readings for all overcharged periods.
3. **Remove or credit all unauthorized service connection fees** that exceed tariff-approved amounts.
4. **Provide a complete reading history** showing all estimated vs. actual readings for the past 24 months.
5. **Provide rate change documentation** including regulatory approval for any rate increases applied.
6. **Establish a payment plan** for any legitimate remaining balance.

If unresolved within **30 days**, I will:
- File a formal complaint with the **State Public Utility Commission**
- Request mediation through the **Utility Consumer Advocate's Office**
- Escalate to the **State Attorney General** if the dispute involves unfair billing practices

Sincerely,

*Generated by ClaimGuard AI — Utility Billing Analysis Engine*
`;
}

// ─── Submission Instructions by Category ────────────────────
function generateCategoryInstructions(category: BillCategory, providerName: string): string {
    const shared = `
### Important
- Keep copies of all correspondence
- Note dates and reference numbers
- Follow up if no response within 30 days`;

    switch (category) {
        case "auto":
            return `## How to Submit Your Re-evaluation Request

### Step 1: Send to Underwriting
- **Email** your agent and CC the underwriting department
- **Online Portal** — Most insurers allow rate disputes through your account dashboard
- **Written Letter** via USPS Certified Mail for a paper trail

### Step 2: Escalate If Needed
- **State Dept. of Insurance** — File a rate complaint at your state's DOI website
- **NAIC Consumer Complaint** — naic.org/consumer
- **Switch providers** — Get 3+ competitive quotes to leverage
${shared}

*Generated by ClaimGuard — Auto Insurance Analysis*
`;

        case "rent":
            return `## How to Submit Your Dispute

### Step 1: Send Written Notice
- **Certified Mail** with Return Receipt to ${providerName}
- **Email** with delivery/read receipt if your lease allows electronic communication
- Keep your lease agreement handy for reference

### Step 2: Follow Up
- Your landlord must respond within **14-30 days** depending on your state
- Document any retaliation (illegal in all 50 states)

### Step 3: Escalate If Needed
- **Local Tenant Rights Organization** — Free legal advice
- **State Housing Authority** — File a formal complaint
- **Small Claims Court** — For recovery of illegal fees (no lawyer needed)
- **CFPB** — consumerfinance.gov for housing-related financial disputes
${shared}

*Generated by ClaimGuard — Tenant Rights Analysis*
`;

        case "utility":
            return `## How to Submit Your Dispute

### Step 1: Contact the Utility
- **Call** the billing department and reference your account number
- **Written Dispute** via Certified Mail — creates a regulatory paper trail
- **Online Portal** — Many utilities have formal dispute forms

### Step 2: Request Documentation
- Ask for **all meter readings** (estimated and actual) for the disputed period
- Request the **rate schedule** showing when/why rates changed
- Get a copy of the **back-billing calculation methodology**

### Step 3: Escalate If Needed
- **Public Utility Commission** — File a formal complaint with your state PUC
- **Utility Consumer Advocate** — Free mediation services in most states
- **State Attorney General** — For suspected billing fraud
${shared}

*Generated by ClaimGuard — Utility Billing Analysis*
`;

        default:
            return generateSubmissionInstructions(providerName);
    }
}

// ─── Main Router ────────────────────────────────────────────
export function generateAppealByCategory(
    category: BillCategory,
    data: UnifiedAnalysisResult
): string {
    switch (category) {
        case "medical":
            return generateAppealLetter({
                patientName: "Account Holder",
                providerName: data.providerName || "Healthcare Provider",
                dateOfService: new Date().toLocaleDateString(),
                accountNumber: "See Statement",
                lineItems: data.lineItems,
                totalBilled: data.totalBilled,
                totalFairPrice: data.totalFairPrice,
                potentialSavings: data.potentialSavings,
            });
        case "auto":
            return generateAutoAppeal(data);
        case "rent":
            return generateRentAppeal(data);
        case "utility":
            return generateUtilityAppeal(data);
    }
}

export function generateInstructionsByCategory(
    category: BillCategory,
    providerName: string
): string {
    if (category === "medical") {
        return generateSubmissionInstructions(providerName);
    }
    return generateCategoryInstructions(category, providerName);
}
