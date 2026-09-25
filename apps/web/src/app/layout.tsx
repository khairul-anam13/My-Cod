import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "My COD — Marketplace COD Warga Lokal",
  description: "Jual beli barang bekas COD dengan warga sekitar. Cari berdasarkan jarak terdekat.",
  applicationName: "My COD",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "My COD",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0F12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn(fontSans.variable, fontDisplay.variable, "font-sans")}>
      <body className="min-h-full bg-background selection:bg-primary/30">
        <TooltipProvider delayDuration={200}>
          <div className="relative flex min-h-screen w-full flex-col bg-background">
            <DesktopHeader />
            <MobileHeader />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
            <BottomNav />
          </div>
          <Toaster position="top-center" />
        </TooltipProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
