import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { unlockNegotiation, createNegotiation } from "@/lib/services/negotiation-service";
import { analyzeBillText } from "@/lib/services/analysis-engine";

// ─── POST /api/unlock — Flip is_unlocked and return premium content
// In production, this would be called by a Lemon Squeezy webhook
// after confirming payment. For now, it handles both demo and auth modes.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { negotiationId, demoMode } = body;

        // ─── Demo Mode: Create a negotiation + unlock it client-side ──
        if (demoMode) {
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

        if (!negotiationId) {
            return NextResponse.json({ error: "negotiationId is required" }, { status: 400 });
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
