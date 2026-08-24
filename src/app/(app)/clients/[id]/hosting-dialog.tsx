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
import { saveHostingAction } from "./actions";

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function HostingDialog({
  trigger,
  clientId,
  sites,
  hosting,
}: {
  trigger: ReactNode;
  clientId: string;
  sites: { id: string; name: string }[];
  hosting?: {
    id: string;
    provider: string;
    siteId: string | null;
    dashboardUrl: string | null;
    serverType: string | null;
    accountRef: string | null;
    monthlyCost: number | string | null;
    annualCost: number | string | null;
    renewsAt: Date | string | null;
    notes: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const siteItems = sites.map((s) => ({ value: s.id, label: s.name }));

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await saveHostingAction(hosting?.id ?? null, formData);
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
          <DialogTitle>{hosting ? "Modifier l'hébergement" : "Ajouter un hébergement"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hosting-provider">Fournisseur *</Label>
              <Input id="hosting-provider" name="provider" required defaultValue={hosting?.provider} />
            </div>
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="hosting-site">Site</Label>
                <Select name="siteId" items={siteItems} defaultValue={hosting?.siteId ?? ""}>
                  <SelectTrigger id="hosting-site" className="w-full">
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    {siteItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="hosting-serverType">Type de serveur</Label>
              <Input id="hosting-serverType" name="serverType" defaultValue={hosting?.serverType ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosting-dashboardUrl">URL du dashboard</Label>
              <Input id="hosting-dashboardUrl" name="dashboardUrl" defaultValue={hosting?.dashboardUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosting-accountRef">Identifiant du compte</Label>
              <Input id="hosting-accountRef" name="accountRef" defaultValue={hosting?.accountRef ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosting-monthlyCost">Coût mensuel (€)</Label>
              <Input
                id="hosting-monthlyCost"
                name="monthlyCost"
                type="number"
                step="0.01"
                defaultValue={hosting?.monthlyCost !== null && hosting?.monthlyCost !== undefined ? String(hosting.monthlyCost) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosting-annualCost">Coût annuel (€)</Label>
              <Input
                id="hosting-annualCost"
                name="annualCost"
                type="number"
                step="0.01"
                defaultValue={hosting?.annualCost !== null && hosting?.annualCost !== undefined ? String(hosting.annualCost) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosting-renewsAt">Date de renouvellement</Label>
              <Input
                id="hosting-renewsAt"
                name="renewsAt"
                type="date"
                defaultValue={toDateInputValue(hosting?.renewsAt)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hosting-notes">Notes</Label>
              <Textarea id="hosting-notes" name="notes" rows={3} defaultValue={hosting?.notes ?? ""} />
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
