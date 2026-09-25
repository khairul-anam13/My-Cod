"use client";

import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  FlaskConical,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/api";
import type { Profile } from "@my-cod/shared-types";

// Seeded via supabase/seed.sql (local dev only) — lets you try every feature
// without waiting on the OTP round-trip. Password is the same for all four.
const DUMMY_USERS = [
  { email: "budi@test.com", name: "Budi Santoso", note: "Terverifikasi · punya listing" },
  { email: "siti@test.com", name: "Siti Rahma", note: "Terverifikasi · ada chat aktif" },
  { email: "andi@test.com", name: "Andi Pratama", note: "Terverifikasi · punya ulasan" },
  { email: "joko@test.com", name: "Joko Susilo", note: "Belum terverifikasi" },
] as const;
const DUMMY_PASSWORD = "cod12345";

// Gate the demo accounts on the *backend* being a local Supabase rather than on
// NODE_ENV, so they still work in a local production build (needed to test the
// installable PWA) but can never appear against a real deployment.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const IS_LOCAL_BACKEND = SUPABASE_URL.includes("127.0.0.1") || SUPABASE_URL.includes("localhost");

const VALUE_PROPS = [
  { icon: MapPin, title: "Cari yang terdekat", body: "Barang diurutkan dari jarak paling dekat denganmu." },
  { icon: ShieldCheck, title: "Profil lengkap wajib", body: "Isi profil & lokasi dulu sebelum bisa jualan." },
  { icon: MessagesSquare, title: "Nego & atur COD", body: "Chat, sepakati titik temu, lalu beri rating." },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r-2 border-border bg-surface p-10 lg:flex xl:w-[55%]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/5 blur-3xl"
        />

        <Link href="/" className="relative flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl border-2 border-border bg-white">
            <Image src="/logo-cod.png" alt="" fill sizes="44px" className="object-contain p-1" />
          </div>
          <span className="text-2xl font-black italic tracking-tight text-foreground">
            My<span className="text-primary">COD</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground">
            Jual beli COD
            <br />
            <span className="text-primary">sama warga</span>
            <br />
            sekitarmu.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Bukan marketplace nasional. Cuma warga satu kota, ketemu langsung, bayar di tempat.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-surface-muted text-primary">
                  <Icon size={18} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          <BadgeCheck size={13} className="mr-1 inline text-accent" />
          Rating & laporan menjaga komunitas tetap aman.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex w-full flex-col lg:w-1/2 xl:w-[45%]">
        <div className="flex items-center gap-2 px-4 pt-4 lg:px-10">
          <Button asChild variant="ghost" size="icon-lg" className="rounded-full" aria-label="Kembali">
            <Link href="/">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border-2 border-border bg-white">
              <Image src="/logo-cod.png" alt="" fill sizes="32px" className="object-contain p-0.5" />
            </div>
            <span className="text-lg font-black italic tracking-tight text-foreground">
              My<span className="text-primary">COD</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 lg:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [dummyLoading, setDummyLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function afterSignIn(accessToken: string) {
    const profile = await apiFetch<Profile | null>("/profiles/me/profile", {
      token: accessToken,
    }).catch(() => null);
    router.replace(profile ? next : `/profile/edit?next=${encodeURIComponent(next)}`);
  }

  async function loginAsDummy(dummyEmail: string) {
    setDummyLoading(dummyEmail);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: DUMMY_PASSWORD,
    });
    if (error || !data.session) {
      setDummyLoading(null);
      setError(error?.message ?? "Gagal masuk dengan akun demo.");
      return;
    }
    await afterSignIn(data.session.access_token);
    setDummyLoading(null);
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data.session) {
      setLoading(false);
      setError(error?.message ?? "Kode OTP salah atau kedaluwarsa.");
      return;
    }

    await afterSignIn(data.session.access_token);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <span className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-primary-soft text-primary">
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-2xl font-black uppercase tracking-tight text-foreground">
          {step === "email" ? "Masuk / Daftar" : "Cek Email Kamu"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {step === "email"
            ? "Masukkan email — kami kirim kode sekali pakai, tanpa password."
            : `Kode 6 digit dikirim ke ${email}.`}
        </p>
      </div>

      {step === "email" && (
        <>
          <form onSubmit={sendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide">
                Email
              </Label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-none border-2 bg-surface pl-10 text-base focus-visible:border-primary"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-none border-2 border-danger">
                <CircleAlert size={15} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" variant="brutalist" disabled={loading} className="h-12 text-sm">
              {loading && <Loader2 size={17} className="animate-spin" />}
              {loading ? "Mengirim…" : "Kirim Kode OTP"}
            </Button>
          </form>

          {IS_LOCAL_BACKEND && (
            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
              Dev mode: kode OTP muncul di{" "}
              <a
                href="http://127.0.0.1:54324"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary underline underline-offset-2"
              >
                Mailpit
              </a>
            </p>
          )}

          {IS_LOCAL_BACKEND && (
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <FlaskConical size={12} />
                  Akun Demo
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DUMMY_USERS.map((u) => (
                  <Button
                    key={u.email}
                    type="button"
                    variant="outline"
                    disabled={dummyLoading !== null}
                    onClick={() => loginAsDummy(u.email)}
                    className="h-auto flex-col items-start gap-1 rounded-none border-2 bg-surface p-3 text-left"
                  >
                    <span className="flex w-full items-center justify-between gap-1 text-sm font-bold text-foreground">
                      {u.name}
                      {dummyLoading === u.email && <Loader2 size={13} className="animate-spin" />}
                    </span>
                    <Badge
                      variant={u.note.startsWith("Belum") ? "outline" : "secondary"}
                      className="whitespace-normal rounded-none text-left text-[10px] font-normal leading-snug"
                    >
                      {u.note}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wide">
              Kode OTP
            </Label>
            <div className="relative">
              <KeyRound
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 rounded-none border-2 bg-surface pl-10 text-lg tracking-[0.4em] focus-visible:border-primary"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-none border-2 border-danger">
              <CircleAlert size={15} />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" variant="brutalist" disabled={loading} className="h-12 text-sm">
            {loading && <Loader2 size={17} className="animate-spin" />}
            {loading ? "Memverifikasi…" : "Verifikasi & Masuk"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="h-auto py-2 text-sm text-muted-foreground"
          >
            Ganti email
          </Button>

          {IS_LOCAL_BACKEND && (
            <p className="text-center text-[11px] text-muted-foreground">
              Belum masuk?{" "}
              <a
                href="http://127.0.0.1:54324"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary underline underline-offset-2"
              >
                Buka Mailpit
              </a>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
