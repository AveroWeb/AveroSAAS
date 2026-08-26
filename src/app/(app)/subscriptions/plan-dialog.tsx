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
import { savePlanAction } from "./actions";

export function PlanDialog({
  trigger,
  plan,
}: {
  trigger: ReactNode;
  plan?: {
    id: string;
    name: string;
    monthlyPrice: number;
    description: string | null;
    isActive: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    formData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");
    startTransition(async () => {
      try {
        await savePlanAction(plan?.id ?? null, formData);
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
          <DialogTitle>{plan ? "Modifier le forfait" : "Nouveau forfait"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Nom *</Label>
            <Input id="plan-name" name="name" required defaultValue={plan?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-price">Prix mensuel (€) *</Label>
            <Input
              id="plan-price"
              name="monthlyPrice"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={plan?.monthlyPrice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea id="plan-description" name="description" rows={2} defaultValue={plan?.description ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={plan?.isActive ?? true} className="size-4" />
            Forfait actif (proposable aux clients)
          </label>
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
