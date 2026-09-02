"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox, Star, Trash2, Mail, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EmailFilter, EmailSort } from "@/lib/queries/emails";
import { deleteEmailsAction, setEmailsReadAction } from "./actions";

type EmailRow = {
  id: string;
  fromName: string | null;
  fromAddress: string;
  subject: string;
  bodyText: string | null;
  receivedAt: string | Date;
  isRead: boolean;
  isStarred: boolean;
};

const FILTERS: { value: EmailFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "unread", label: "Non lus" },
  { value: "starred", label: "Favoris" },
];

const SORTS: { value: EmailSort; label: string }[] = [
  { value: "date_desc", label: "Plus récents" },
  { value: "date_asc", label: "Plus anciens" },
  { value: "sender", label: "Expéditeur (A–Z)" },
  { value: "unread", label: "Non lus d'abord" },
];

export function EmailList({
  emails,
  accountId,
  sort,
  filter,
}: {
  emails: EmailRow[];
  accountId?: string;
  sort: EmailSort;
  filter: EmailFilter;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedIds = useMemo(() => [...selected], [selected]);
  const allSelected = emails.length > 0 && selected.size === emails.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  function buildUrl(next: { sort?: EmailSort; filter?: EmailFilter }) {
    const params = new URLSearchParams();
    if (accountId) params.set("account", accountId);
    const f = next.filter ?? filter;
    const s = next.sort ?? sort;
    if (f && f !== "all") params.set("filter", f);
    if (s && s !== "date_desc") params.set("sort", s);
    const qs = params.toString();
    return qs ? `/emails?${qs}` : "/emails";
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === emails.length ? new Set() : new Set(emails.map((e) => e.id))));
  }

  function runBulk(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      setSelected(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <input
          ref={selectAllRef}
          type="checkbox"
          aria-label="Tout sélectionner"
          className="size-4 accent-primary"
          checked={allSelected}
          onChange={toggleAll}
        />

        {selected.size > 0 ? (
          <>
            <span className="text-sm font-medium">
              {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => runBulk(() => setEmailsReadAction(selectedIds, true))}
              >
                <MailOpen className="size-4" />
                Marquer lu
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => runBulk(() => setEmailsReadAction(selectedIds, false))}
              >
                <Mail className="size-4" />
                Marquer non lu
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (window.confirm(`Supprimer ${selected.size} email${selected.size > 1 ? "s" : ""} ?`)) {
                    runBulk(() => deleteEmailsAction(selectedIds));
                  }
                }}
              >
                <Trash2 className="size-4" />
                Supprimer
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={filter === f.value ? "default" : "outline"}
                  render={<Link href={buildUrl({ filter: f.value })} />}
                  nativeButton={false}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <label className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
              Trier
              <select
                className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={sort}
                onChange={(e) => router.push(buildUrl({ sort: e.target.value as EmailSort }))}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {emails.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Inbox className="size-8" />
              <p>Aucun email pour ce filtre.</p>
            </div>
          ) : (
            <div className="divide-y">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 hover:bg-muted/50",
                    !email.isRead && "bg-muted/30",
                    selected.has(email.id) && "bg-primary/5",
                  )}
                >
                  <input
                    type="checkbox"
                    aria-label={`Sélectionner « ${email.subject} »`}
                    className="size-4 shrink-0 accent-primary"
                    checked={selected.has(email.id)}
                    onChange={() => toggle(email.id)}
                  />
                  <Link href={`/emails/${email.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex w-40 shrink-0 items-center gap-1.5 truncate text-sm">
                      {email.isStarred && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                      <span className={cn("truncate", !email.isRead && "font-semibold")}>
                        {email.fromName || email.fromAddress}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 truncate text-sm">
                      <span className={cn(!email.isRead && "font-semibold")}>{email.subject}</span>
                      {email.bodyText && (
                        <span className="ml-2 text-muted-foreground">
                          — {email.bodyText.replace(/\s+/g, " ").slice(0, 80)}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(email.receivedAt)}
                    </div>
                    {!email.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
