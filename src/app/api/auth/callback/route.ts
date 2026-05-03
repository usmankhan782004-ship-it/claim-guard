import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const requestedRedirect = searchParams.get("redirect") ?? "/app";
    const next =
        requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
            ? requestedRedirect
            : "/app";

    if (code) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Ensure auth_success parameter is included for auto-opening modal
            const redirectUrl = new URL(next, origin);
            redirectUrl.searchParams.set("auth_success", "true");
            return NextResponse.redirect(redirectUrl.toString());
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-failure`);
}
