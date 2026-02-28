// ─── Process Payment API Route ───────────────────────────────
// POST /api/process-payment
// Accepts a session ID and card details, processes the mock payment.
// ──────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { paymentService } from "@/lib/services/payment-service";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, billId, amount, sessionId, cardNumber, expiry, cvc } = body;

        switch (action) {
            case "create-session": {
                if (!billId || !amount) {
                    return NextResponse.json(
                        { error: "billId and amount are required" },
                        { status: 400 }
                    );
                }

                const { session, error } = await paymentService.createCheckoutSession(
                    user.id,
                    billId,
                    amount
                );

                if (error || !session) {
                    return NextResponse.json({ error }, { status: 500 });
                }

                return NextResponse.json({ success: true, session });
            }

            case "process": {
                if (!sessionId || !cardNumber) {
                    return NextResponse.json(
                        { error: "sessionId and cardNumber are required" },
                        { status: 400 }
                    );
                }

                const result = await paymentService.processPayment(
                    sessionId,
                    cardNumber,
                    expiry,
                    cvc
                );

                return NextResponse.json({
                    success: result.success,
                    payment: result,
                });
            }

            case "status": {
                if (!sessionId) {
                    return NextResponse.json(
                        { error: "sessionId is required" },
                        { status: 400 }
                    );
                }

                const { status, payment, error } =
                    await paymentService.getPaymentStatus(sessionId);

                if (error) {
                    return NextResponse.json({ error }, { status: 404 });
                }

                return NextResponse.json({ status, payment });
            }

            default:
                return NextResponse.json(
                    { error: "Invalid action. Use: create-session, process, or status" },
                    { status: 400 }
                );
        }
    } catch (err) {
        console.error("Payment error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Payment processing failed" },
            { status: 500 }
        );
    }
}
