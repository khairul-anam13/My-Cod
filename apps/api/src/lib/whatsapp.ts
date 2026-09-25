import type { Boom } from "@hapi/boom";
import makeWASocket, { DisconnectReason, useMultiFileAuthState, type WASocket } from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";

// WhatsApp-based OTP delivery (Baileys — unofficial WhatsApp Web protocol,
// not Supabase Auth's phone provider; see DESIGN notes in the Fase 4 plan
// for why). Requires a persistent process (this API server already is one)
// and a one-time manual pairing: scan the QR code printed to the console
// with the SENDER'S WhatsApp account. Disabled unless WHATSAPP_OTP_ENABLED=true
// so environments that haven't paired yet aren't forced to depend on it.
const AUTH_DIR = ".baileys-auth";
const ENABLED = process.env.WHATSAPP_OTP_ENABLED === "true";

let sock: WASocket | null = null;
let connectStarted = false;

async function connect(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const socket = makeWASocket({ auth: state });
  sock = socket;

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("[whatsapp] Scan QR ini sekali pakai HP nomor pengirim OTP:");
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("[whatsapp] Terhubung — siap kirim OTP via WhatsApp.");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.warn(`[whatsapp] Koneksi terputus (loggedOut=${loggedOut}).`);
      if (!loggedOut) {
        connect().catch((err) => console.error("[whatsapp] Gagal menyambung ulang:", err));
      } else {
        console.error(
          `[whatsapp] Sesi logged out — hapus folder "${AUTH_DIR}" dan restart server untuk pairing ulang.`,
        );
        sock = null;
      }
    }
  });
}

/** Call once at server boot. No-op (and no persistent connection attempted) unless WHATSAPP_OTP_ENABLED=true. */
export function startWhatsApp(): void {
  if (!ENABLED) {
    console.log('[whatsapp] WHATSAPP_OTP_ENABLED bukan "true" — layanan OTP WhatsApp tidak dijalankan.');
    return;
  }
  if (connectStarted) return;
  connectStarted = true;
  connect().catch((err) => console.error("[whatsapp] Gagal memulai koneksi:", err));
}

/** "08123..." / "+62812..." / "62812..." → "62812..." (WhatsApp JIDs need country code, no leading 0 or "+"). */
export function normalizeIndonesianPhoneForWhatsApp(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

/** phoneNumber: country code + digits only, no "+"/spaces (e.g. "6281234567890"). */
export async function sendOtpMessage(phoneNumber: string, code: string): Promise<void> {
  if (!ENABLED) {
    throw new Error("Layanan OTP WhatsApp belum diaktifkan di server ini.");
  }
  if (!sock) {
    throw new Error("Sesi WhatsApp belum siap. Coba lagi sebentar.");
  }

  const jid = `${phoneNumber}@s.whatsapp.net`;
  await sock.sendMessage(jid, {
    text: `Kode verifikasi My COD kamu: ${code}\n\nBerlaku 5 menit. Jangan bagikan kode ini ke siapa pun.`,
  });
}
