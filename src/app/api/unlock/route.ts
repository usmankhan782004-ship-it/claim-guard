import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { unlockNegotiation } from "@/lib/services/negotiation-service";
import { isSameOrigin } from "@/lib/request-security";

// ─── POST /api/unlock — Flip is_unlocked and return premium content
// In production, this would be called by a Lemon Squeezy webhook
// after confirming payment. For now, it handles both demo and auth modes.
export async function POST(req: NextRequest) {
    try {
        if (!isSameOrigin(req)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { negotiationId, demoMode, sessionId } = body;

        // ─── Demo Mode: Create a negotiation + unlock it client-side ──
        if (demoMode) {
            if (process.env.NODE_ENV === "production") {
                return NextResponse.json(
                    { error: "Demo unlock is disabled in production." },
                    { status: 403 }
                );
            }

            return NextResponse.json({
                success: true,
                unlocked: true,
                message: "Demo unlock successful — in production this would require payment via Lemon Squeezy",
            });
        }

        // ─── Auth Mode: Verify user and unlock via Supabase ──────────
        const supabase = await createServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        if (!negotiationId || !sessionId) {
            return NextResponse.json({ error: "negotiationId and sessionId are required" }, { status: 400 });
        }

        // ─── Secure Verification: Check payment completion ───────────
        const { data: negotiation, error: negError } = await supabase
            .from("negotiations_v2")
            .select("bill_id")
            .eq("id", negotiationId)
            .eq("user_id", user.id)
            .single();

        if (negError || !negotiation) {
            return NextResponse.json({ error: "Negotiation not found" }, { status: 404 });
        }

        const { data: payment, error: payError } = await supabase
            .from("payments")
            .select("status")
            .eq("session_id", sessionId)
            .eq("user_id", user.id)
            .eq("bill_id", negotiation.bill_id)
            .single();

        if (payError || !payment || payment.status !== "completed") {
            return NextResponse.json({ error: "Valid completed payment not found for this negotiation" }, { status: 403 });
        }

        // Flip the is_unlocked bit
        const result = await unlockNegotiation(negotiationId, user.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Fetch the now-unlocked premium content (RLS will allow it)
        const { data: content, error: contentError } = await supabase
            .from("premium_content")
            .select("*")
            .eq("negotiation_id", negotiationId)
            .single();

        if (contentError && contentError.code !== "PGRST116") {
            console.error("Failed to load premium content after unlock:", contentError);
            return NextResponse.json(
                { error: "Content unlocked, but failed to load the generated appeal letter." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            unlocked: true,
            premiumContent: content || null,
        });
    } catch (err) {
        console.error("Unlock error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
