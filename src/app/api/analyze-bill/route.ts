// ─── Analyze Bill API Route ──────────────────────────────────
// POST /api/analyze-bill
// Fetches a bill record, runs it through the analysis engine,
// inserts negotiation rows, calculates success fee, and
// updates the bill status.
// ──────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { analyzeBillText, getMonologueSteps } from "@/lib/services/analysis-engine";
import { calculateSuccessFee, updateUserLedger } from "@/lib/services/fee-calculator";

// ─── Simulated OCR text for demo mode ────────────────────────
// In production, this calls Gemini Vision to extract text from images/PDFs.
const DEMO_BILL_TEXT = `
MEMORIAL GENERAL HOSPITAL
Statement of Services
Patient: John Doe
Date of Service: 01/15/2024
Account #: MGH-2024-00847

Code     Description                              Amount
------   ---------------------------------------- ----------
99285    Emergency dept visit (life-threatening)   $2,450.00
36415    Venipuncture (blood draw)                 $85.00
85025    Complete blood count with differential    $147.00
80053    Comprehensive metabolic panel             $235.00
71046    Chest X-ray, 2 views                      $380.00
93000    Electrocardiogram (ECG/EKG) complete      $275.00
96372    Therapeutic injection (IM/SubQ)            $185.00
74177    CT abdomen and pelvis with contrast        $3,200.00
88305    Surgical pathology, gross and micro        $450.00

Subtotal:                                          $7,407.00
Facility Fee:                                      $1,850.00
Total Charges:                                     $9,257.00
`;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Verify authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        // Parse request
        const body = await request.json();
        const { billId, demoMode } = body as { billId?: string; demoMode?: boolean };

        let billText: string;
        let billRecord: { id: string; user_id: string } | null = null;

        if (demoMode || !billId) {
            // ─── Demo Mode: use simulated bill text ─────────────
            billText = DEMO_BILL_TEXT;

            // Create a demo bill record if none exists
            const { data: demoBill, error: demoError } = await supabase
                .from("bills")
                .insert({
                    user_id: user.id,
                    file_name: "demo_hospital_bill.pdf",
                    file_path: `${user.id}/demo_bill`,
                    file_type: "application/pdf",
                    status: "analyzing",
                    raw_text: billText,
                })
                .select("id, user_id")
                .single();

            if (demoError) {
                return NextResponse.json(
                    { error: `Failed to create demo bill: ${demoError.message}` },
                    { status: 500 }
                );
            }

            billRecord = demoBill;
        } else {
            // ─── Production Mode: fetch bill from DB ────────────
            const { data: bill, error: fetchError } = await supabase
                .from("bills")
                .select("*")
                .eq("id", billId)
                .eq("user_id", user.id)
                .single();

            if (fetchError || !bill) {
                return NextResponse.json(
                    { error: "Bill not found or access denied." },
                    { status: 404 }
                );
            }

            billRecord = { id: bill.id, user_id: bill.user_id };

            // Update status to analyzing
            await supabase
                .from("bills")
                .update({ status: "analyzing" })
                .eq("id", billId);

            // Use existing raw text or simulate OCR
            // In production: call Gemini Vision API here
            billText = bill.raw_text || DEMO_BILL_TEXT;
        }

        // ─── Run Analysis Engine ───────────────────────────────
        const analysis = analyzeBillText(billText);
        const feeCalc = calculateSuccessFee(analysis.potentialSavings);

        // ─── Insert Negotiation Rows ───────────────────────────
        if (analysis.lineItems.length > 0) {
            const negotiations = analysis.lineItems.map((item) => ({
                bill_id: billRecord!.id,
                user_id: user.id,
                cpt_code: item.code,
                description: item.description,
                billed_amount: item.billedAmount,
                fair_price: item.fairPrice,
                confidence: item.confidence,
                status: "identified" as const,
            }));

            const { error: negError } = await supabase
                .from("negotiations")
                .insert(negotiations);

            if (negError) {
                console.error("Failed to insert negotiations:", negError);
            }
        }

        // ─── Update Bill Record ────────────────────────────────
        await supabase
            .from("bills")
            .update({
                status: "analyzed",
                raw_text: billText,
                provider_name: analysis.providerName,
                total_billed: analysis.totalBilled,
                total_fair: analysis.totalFairPrice,
                potential_savings: analysis.potentialSavings,
                notes: analysis.analysisNotes,
            })
            .eq("id", billRecord!.id);

        // ─── Update User Ledger ────────────────────────────────
        if (analysis.potentialSavings > 0) {
            await updateUserLedger(user.id, analysis.potentialSavings, feeCalc.fee);
        }

        // ─── Build Monologue Steps ─────────────────────────────
        const monologueSteps = getMonologueSteps(
            analysis.lineItems.length + 5, // total charges scanned
            analysis.lineItems.length
        );

        return NextResponse.json({
            success: true,
            billId: billRecord!.id,
            analysis: {
                providerName: analysis.providerName,
                totalBilled: analysis.totalBilled,
                totalFairPrice: analysis.totalFairPrice,
                potentialSavings: analysis.potentialSavings,
                notes: analysis.analysisNotes,
                lineItems: analysis.lineItems,
            },
            fee: feeCalc,
            monologueSteps,
        });
    } catch (err) {
        console.error("Analyze bill error:", err);
        return NextResponse.json(
            {
                error:
                    err instanceof Error ? err.message : "An unexpected error occurred.",
            },
            { status: 500 }
        );
    }
}
