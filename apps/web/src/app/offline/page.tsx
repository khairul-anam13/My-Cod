import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { RetryButton } from "./RetryButton";

export const metadata: Metadata = {
  title: "Offline — My COD",
};

/** Precached by the service worker and served when a navigation fails. */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="border-2 border-border bg-surface-muted p-5">
        <WifiOff size={36} className="text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-black uppercase tracking-tight text-foreground">Kamu sedang offline</h1>
      <p className="text-sm text-muted-foreground">
        Koneksi internet terputus. Halaman yang pernah dibuka masih bisa diakses — untuk melihat barang
        terbaru, sambungkan kembali internetmu.
      </p>
      <RetryButton />
    </div>
  );
}
