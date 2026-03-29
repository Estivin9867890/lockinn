import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { StravaActivity } from "@/lib/types";
import { STRAVA_TYPE_MAP } from "@/lib/types";

async function refreshTokenIfNeeded(sb: ReturnType<typeof createServerSupabase>, settings: any, userId: string) {
  const expiresAt = settings.strava_token_expires_at
    ? new Date(settings.strava_token_expires_at).getTime() : 0;

  if (Date.now() < expiresAt - 5 * 60 * 1000) return settings.strava_access_token as string;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: settings.strava_refresh_token,
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  const token = await res.json();

  await sb.from("user_settings").update({
    strava_access_token: token.access_token,
    strava_refresh_token: token.refresh_token,
    strava_token_expires_at: new Date(token.expires_at * 1000).toISOString(),
  }).eq("user_id", userId);

  return token.access_token as string;
}

export async function GET() {
  const sb = createServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: settings } = await sb.from("user_settings").select("*").eq("user_id", user.id).single();
  if (!settings?.strava_connected || !settings?.strava_refresh_token) {
    return NextResponse.json({ error: "Strava non connecté" }, { status: 400 });
  }

  try {
    const accessToken = await refreshTokenIfNeeded(sb, settings, user.id);
    const activitiesRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=30",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!activitiesRes.ok) return NextResponse.json({ error: "Erreur Strava API" }, { status: 500 });

    const activities: StravaActivity[] = await activitiesRes.json();
    let synced = 0;

    for (const act of activities) {
      const { error } = await sb.from("sport_sessions").upsert(
        {
          user_id: user.id,
          date: act.start_date.split("T")[0],
          type: STRAVA_TYPE_MAP[act.sport_type] || "gym",
          duration_min: Math.max(1, Math.round(act.moving_time / 60)),
          calories: act.calories ?? null,
          notes: act.name,
          strava_activity_id: act.id,
          distance_km: act.distance > 0 ? Math.round(act.distance / 10) / 100 : null,
          start_lat: act.start_latlng?.[0] ?? null,
          start_lng: act.start_latlng?.[1] ?? null,
        },
        { onConflict: "strava_activity_id", ignoreDuplicates: false }
      );
      if (!error) synced++;
    }

    return NextResponse.json({ synced, total: activities.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
