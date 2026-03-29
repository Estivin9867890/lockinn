import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/contexts/SettingsContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "LockIn — Second Cerveau",
  description: "Votre espace personnel — sport, nutrition, budget, médias.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LockIn",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#5B9CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LockIn" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Service Worker */}
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});`
        }} />
      </head>
      <body className="antialiased">
        <SettingsProvider>
          {children}
        </SettingsProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "13px",
              color: "#1D1D1F",
            },
          }}
          expand={false}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
