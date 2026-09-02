"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUp, Loader2, MessageCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendChatMessage } from "@/app/(app)/chat/actions";

type Msg = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 24;

const SUGGESTIONS = [
  "Quelles tâches sont en retard ?",
  "Quel est mon revenu mensuel récurrent ?",
  "Quels domaines expirent bientôt ?",
  "Mes factures impayées ?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");

    startTransition(async () => {
      try {
        const { reply } = await sendChatMessage(next.slice(-MAX_HISTORY));
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 print:hidden">
      {open ? (
        <div className="flex h-[560px] max-h-[calc(100dvh-2rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">Assistant</p>
                <p className="text-xs text-muted-foreground">Propulsé par Claude</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pose-moi une question — générale, ou sur tes clients, tâches, factures, sites…
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Réflexion…
                </div>
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="border-t p-3">
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-1.5">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Écris ton message…"
                rows={1}
                className="max-h-32 min-h-0 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                size="icon-sm"
                className="rounded-full"
                disabled={!input.trim() || isPending}
                onClick={() => send(input)}
                aria-label="Envoyer"
              >
                <ArrowUp className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          size="icon-lg"
          className="size-12 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant"
        >
          <MessageCircle className="size-5" />
        </Button>
      )}
    </div>
  );
}
