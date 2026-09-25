import { ShieldCheck } from "lucide-react";

/** Static COD safety notice — always shown at the top of a thread, no dismiss state to track. */
export function SafetyReminder() {
  return (
    <div className="mx-4 mt-3 flex gap-2.5 border-2 border-border bg-surface-muted p-3">
      <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-bold text-foreground">Pengingat Keamanan COD</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Selalu ketemu di tempat umum yang terang. Jangan bagikan info rekening/kartu di chat ini.
        </p>
      </div>
    </div>
  );
}
