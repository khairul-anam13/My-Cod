const SUGGESTIONS = ["Masih ada?", "Bisa nego?", "Kapan & di mana ketemu?", "Oke, saya ambil"];

/** Static canned replies — no NLP, just common phrases for a COD negotiation. Tapping sends immediately. */
export function QuickReplies({ onPick, disabled }: { onPick: (text: string) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-t border-border px-3 pt-2.5 pb-1">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          type="button"
          disabled={disabled}
          onClick={() => onPick(text)}
          className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
