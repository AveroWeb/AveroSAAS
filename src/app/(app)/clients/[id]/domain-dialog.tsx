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
import { saveDomainAction } from "./actions";

const STATUS_ITEMS = [
  { value: "ACTIVE", label: "Actif" },
  { value: "EXPIRING", label: "Bientôt expiré" },
  { value: "EXPIRED", label: "Expiré" },
  { value: "TRANSFERRED", label: "Transféré" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function DomainDialog({
  trigger,
  clientId,
  sites,
  domain,
}: {
  trigger: ReactNode;
  clientId: string;
  sites: { id: string; name: string }[];
  domain?: {
    id: string;
    name: string;
    siteId: string | null;
    isPrimary: boolean;
    registrar: string | null;
    registrarUrl: string | null;
    expiresAt: Date | string | null;
    autoRenew: boolean;
    annualCost: number | string | null;
    status: string;
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
        await saveDomainAction(domain?.id ?? null, formData);
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
          <DialogTitle>{domain ? "Modifier le domaine" : "Ajouter un domaine"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="domain-name">Nom de domaine *</Label>
              <Input id="domain-name" name="name" required defaultValue={domain?.name} placeholder="exemple.fr" />
            </div>
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="domain-site">Site</Label>
                <Select name="siteId" items={siteItems} defaultValue={domain?.siteId ?? ""}>
                  <SelectTrigger id="domain-site" className="w-full">
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
              <Label htmlFor="domain-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={domain?.status ?? "ACTIVE"}>
                <SelectTrigger id="domain-status" className="w-full">
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
              <Label htmlFor="domain-registrar">Registrar</Label>
              <Input id="domain-registrar" name="registrar" defaultValue={domain?.registrar ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-registrarUrl">URL du registrar</Label>
              <Input id="domain-registrarUrl" name="registrarUrl" defaultValue={domain?.registrarUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-expiresAt">Date d&apos;expiration</Label>
              <Input
                id="domain-expiresAt"
                name="expiresAt"
                type="date"
                defaultValue={toDateInputValue(domain?.expiresAt)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-annualCost">Coût annuel (€)</Label>
              <Input
                id="domain-annualCost"
                name="annualCost"
                type="number"
                step="0.01"
                defaultValue={domain?.annualCost !== null && domain?.annualCost !== undefined ? String(domain.annualCost) : ""}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="domain-autoRenew"
                name="autoRenew"
                type="checkbox"
                value="true"
                defaultChecked={domain?.autoRenew}
                className="size-4"
              />
              <Label htmlFor="domain-autoRenew">Renouvellement automatique</Label>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="domain-isPrimary"
                name="isPrimary"
                type="checkbox"
                value="true"
                defaultChecked={domain?.isPrimary}
                className="size-4"
              />
              <Label htmlFor="domain-isPrimary">Domaine principal</Label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="domain-notes">Notes</Label>
              <Textarea id="domain-notes" name="notes" rows={3} defaultValue={domain?.notes ?? ""} />
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
