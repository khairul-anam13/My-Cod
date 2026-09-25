"use client";

import { BadgeCheck, LogOut, Package, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/ReportDialog";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";

// On your own profile: edit/logout. On anyone else's: report — you can't
// report yourself, so the two actions are mutually exclusive by design.
export function ProfileActions({ profileId }: { profileId: string }) {
  const router = useRouter();
  const { user, loading } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (loading) return null;

  if (user?.id !== profileId) {
    return (
      <ReportDialog
        target={{ reported_user_id: profileId }}
        triggerLabel="Laporkan pengguna"
        backHref={`/profile/${profileId}`}
      />
    );
  }

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href="/profile/edit">
          <Pencil size={13} />
          Edit Profil
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href="/profile/listings">
          <Package size={13} />
          Listing Saya
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href="/profile/verification">
          <BadgeCheck size={13} />
          Verifikasi Identitas
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={signingOut}
        onClick={signOut}
        className="gap-1.5 text-danger hover:text-danger"
      >
        <LogOut size={13} />
        Keluar
      </Button>
    </div>
  );
}
