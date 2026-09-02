"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveQuoteAction } from "./actions";

const STATUS_ITEMS = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "SENT", label: "Envoyé" },
  { value: "ACCEPTED", label: "Accepté" },
  { value: "REJECTED", label: "Refusé" },
  { value: "EXPIRED", label: "Expiré" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function QuoteDialog({
  trigger,
  clientId,
  quote,
}: {
  trigger: ReactNode;
  clientId: string;
  quote?: {
    id: string;
    title: string;
    description: string | null;
    amount: number;
    status: string;
    issueDate: Date | string;
    validUntil: Date | string | null;
    notes: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await saveQuoteAction(quote?.id ?? null, clientId, formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{quote ? "Modifier le devis" : "Nouveau devis"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="quote-title">Titre *</Label>
              <Input id="quote-title" name="title" required defaultValue={quote?.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-amount">Montant (€) *</Label>
              <Input
                id="quote-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={quote?.amount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={quote?.status ?? "DRAFT"}>
                <SelectTrigger id="quote-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-issueDate">Date d&apos;émission *</Label>
              <Input
                id="quote-issueDate"
                name="issueDate"
                type="date"
                required
                defaultValue={toDateInputValue(quote?.issueDate) || toDateInputValue(new Date())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-validUntil">Valable jusqu&apos;au</Label>
              <Input id="quote-validUntil" name="validUntil" type="date" defaultValue={toDateInputValue(quote?.validUntil)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="quote-description">Description</Label>
              <Textarea id="quote-description" name="description" rows={3} defaultValue={quote?.description ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="quote-notes">Notes</Label>
              <Textarea id="quote-notes" name="notes" rows={2} defaultValue={quote?.notes ?? ""} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
