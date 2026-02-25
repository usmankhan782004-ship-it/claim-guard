// ─── ClaimGuard Mock Payment Service ─────────────────────────
// Simulates a Stripe/Lemon Squeezy checkout flow.
// Uses an in-memory state machine + Supabase persistence.
// Any test card number will succeed in simulated mode.
// ──────────────────────────────────────────────────────────────

import { createServerClient, type PaymentStatus } from "@/lib/supabase";
import { markFeePaid } from "./fee-calculator";

// ─── Types ───────────────────────────────────────────────────
export interface CheckoutSession {
    sessionId: string;
    userId: string;
    billId: string;
    amount: number;
    status: PaymentStatus;
    checkoutUrl: string;
    createdAt: string;
}

export interface PaymentResult {
    success: boolean;
    sessionId: string;
    status: PaymentStatus;
    cardBrand?: string;
    cardLastFour?: string;
    error?: string;
}

// ─── Card Brand Detection ────────────────────────────────────
function detectCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s|-/g, "");
    if (cleaned.startsWith("4")) return "Visa";
    if (cleaned.startsWith("5") || cleaned.startsWith("2")) return "Mastercard";
    if (cleaned.startsWith("3")) return "Amex";
    if (cleaned.startsWith("6")) return "Discover";
    return "Unknown";
}

// ─── Session ID Generator ────────────────────────────────────
function generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `cs_sim_${timestamp}_${random}`;
}

// ─── PaymentService Class ────────────────────────────────────
export class PaymentService {
    private mode: "simulated" | "live" = "simulated";

    constructor(mode: "simulated" | "live" = "simulated") {
        this.mode = mode;
    }

    // ─── Create Checkout Session ─────────────────────────────
    // Creates a payment record in Supabase and returns a session
    // object similar to Stripe's checkout session.
    async createCheckoutSession(
        userId: string,
        billId: string,
        amount: number
    ): Promise<{ session: CheckoutSession | null; error?: string }> {
        try {
            const supabase = await createServerClient();
            const sessionId = generateSessionId();

            const { error: insertError } = await supabase.from("payments").insert({
                user_id: userId,
                bill_id: billId,
                session_id: sessionId,
                amount,
                fee_percentage: 20.0,
                status: "pending" as PaymentStatus,
                processor: this.mode,
            });

            if (insertError) {
                return { session: null, error: insertError.message };
            }

            const session: CheckoutSession = {
                sessionId,
                userId,
                billId,
                amount,
                status: "pending",
                checkoutUrl: `/checkout/${sessionId}`,
                createdAt: new Date().toISOString(),
            };

            return { session };
        } catch (err) {
            return {
                session: null,
                error: err instanceof Error ? err.message : "Failed to create checkout session",
            };
        }
    }

    // ─── Process Payment ─────────────────────────────────────
    // Simulates the payment processing flow:
    // pending → processing → completed (or failed)
    // In simulated mode, any card number with 16 digits succeeds.
    async processPayment(
        sessionId: string,
        cardNumber: string,
        _expiry?: string,
        _cvc?: string
    ): Promise<PaymentResult> {
        try {
            const supabase = await createServerClient();

            // Verify session exists and is pending
            const { data: payment, error: fetchError } = await supabase
                .from("payments")
                .select("*")
                .eq("session_id", sessionId)
                .single();

            if (fetchError || !payment) {
                return {
                    success: false,
                    sessionId,
                    status: "failed",
                    error: "Payment session not found",
                };
            }

            if (payment.status !== "pending") {
                return {
                    success: false,
                    sessionId,
                    status: payment.status,
                    error: `Payment already ${payment.status}`,
                };
            }

            // Transition to processing
            await supabase
                .from("payments")
                .update({ status: "processing" as PaymentStatus })
                .eq("session_id", sessionId);

            // ─── Simulated Processing Logic ────────────────────
            const cleaned = cardNumber.replace(/\s|-/g, "");
            const cardBrand = detectCardBrand(cleaned);
            const cardLastFour = cleaned.slice(-4);

            let finalStatus: PaymentStatus = "completed";
            let errorMessage: string | undefined;

            if (this.mode === "simulated") {
                // In simulated mode:
                // - Card ending in 0000 = decline (for testing)
                // - Any other card = success
                if (cleaned.endsWith("0000")) {
                    finalStatus = "failed";
                    errorMessage = "Card declined (test decline card)";
                } else {
                    finalStatus = "completed";
                }
            }

            // Update payment record with final status
            const updateData: Record<string, unknown> = {
                status: finalStatus,
                card_last_four: cardLastFour,
                card_brand: cardBrand,
                error_message: errorMessage || null,
            };

            if (finalStatus === "completed") {
                updateData.paid_at = new Date().toISOString();
            }

            await supabase
                .from("payments")
                .update(updateData)
                .eq("session_id", sessionId);

            // If payment succeeded, update the user's ledger
            if (finalStatus === "completed") {
                await markFeePaid(payment.user_id, payment.amount);
            }

            return {
                success: finalStatus === "completed",
                sessionId,
                status: finalStatus,
                cardBrand,
                cardLastFour,
                error: errorMessage,
            };
        } catch (err) {
            return {
                success: false,
                sessionId,
                status: "failed",
                error: err instanceof Error ? err.message : "Payment processing failed",
            };
        }
    }

    // ─── Get Payment Status ──────────────────────────────────
    async getPaymentStatus(
        sessionId: string
    ): Promise<{ status: PaymentStatus; payment: Record<string, unknown> | null; error?: string }> {
        try {
            const supabase = await createServerClient();

            const { data: payment, error } = await supabase
                .from("payments")
                .select("*")
                .eq("session_id", sessionId)
                .single();

            if (error || !payment) {
                return { status: "failed", payment: null, error: "Payment not found" };
            }

            return { status: payment.status, payment };
        } catch (err) {
            return {
                status: "failed",
                payment: null,
                error: err instanceof Error ? err.message : "Failed to get payment status",
            };
        }
    }
}

// ─── Singleton Export ────────────────────────────────────────
export const paymentService = new PaymentService("simulated");
