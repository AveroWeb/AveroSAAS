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
import { saveSubscriptionAction } from "./actions";

const STATUS_ITEMS = [
  { value: "ACTIVE", label: "Actif" },
  { value: "PAUSED", label: "En pause" },
  { value: "CANCELLED", label: "Résilié" },
];

const NO_PLAN_VALUE = "__none__";

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function SubscriptionDialog({
  trigger,
  clientId,
  plans,
  subscription,
}: {
  trigger: ReactNode;
  clientId: string;
  plans: { id: string; name: string; monthlyPrice: number }[];
  subscription?: {
    id: string;
    planId: string | null;
    monthlyPrice: number;
    startDate: Date | string;
    renewalDate: Date | string | null;
    status: string;
    description: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [planId, setPlanId] = useState(subscription?.planId ?? NO_PLAN_VALUE);
  const [monthlyPrice, setMonthlyPrice] = useState(String(subscription?.monthlyPrice ?? ""));
  const planItems = [{ value: NO_PLAN_VALUE, label: "Aucun (prix personnalisé)" }, ...plans.map((p) => ({ value: p.id, label: p.name }))];

  function handlePlanChange(value: string) {
    setPlanId(value);
    const plan = plans.find((p) => p.id === value);
    if (plan) setMonthlyPrice(String(plan.monthlyPrice));
  }

  function handleSubmit(formData: FormData) {
    setError(undefined);
    if (planId !== NO_PLAN_VALUE) formData.set("planId", planId);
    startTransition(async () => {
      try {
        await saveSubscriptionAction(subscription?.id ?? null, clientId, formData);
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
          <DialogTitle>{subscription ? "Modifier l'abonnement" : "Nouvel abonnement"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subscription-plan">Forfait</Label>
              <Select items={planItems} value={planId} onValueChange={(v) => handlePlanChange(v as string)}>
                <SelectTrigger id="subscription-plan" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-monthlyPrice">Prix mensuel (€) *</Label>
              <Input
                id="subscription-monthlyPrice"
                name="monthlyPrice"
                type="number"
                step="0.01"
                min="0"
                required
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={subscription?.status ?? "ACTIVE"}>
                <SelectTrigger id="subscription-status" className="w-full">
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
              <Label htmlFor="subscription-startDate">Date de début *</Label>
              <Input
                id="subscription-startDate"
                name="startDate"
                type="date"
                required
                defaultValue={toDateInputValue(subscription?.startDate) || toDateInputValue(new Date())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-renewalDate">Prochain renouvellement</Label>
              <Input
                id="subscription-renewalDate"
                name="renewalDate"
                type="date"
                defaultValue={toDateInputValue(subscription?.renewalDate)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subscription-description">Description</Label>
              <Textarea id="subscription-description" name="description" rows={2} defaultValue={subscription?.description ?? ""} />
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
