import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?strava=error`);
  }

  try {
    const sb = createServerSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.redirect(`${appUrl}/login`);

    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) return NextResponse.redirect(`${appUrl}/settings?strava=error`);

    const token = await tokenRes.json();
    await sb.from("user_settings").upsert(
      {
        user_id: user.id,
        strava_connected: true,
        strava_athlete_id: token.athlete?.id,
        strava_access_token: token.access_token,
        strava_refresh_token: token.refresh_token,
        strava_token_expires_at: new Date(token.expires_at * 1000).toISOString(),
      },
      { onConflict: "user_id" }
    );

    return NextResponse.redirect(`${appUrl}/settings?strava=connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?strava=error`);
  }
}
