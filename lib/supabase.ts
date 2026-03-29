import { createBrowserClient } from "@supabase/ssr";

// Singleton client pour les composants client (stocke la session en cookies pour le middleware)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
