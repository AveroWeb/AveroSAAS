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
import { saveMaintenanceAction } from "./actions";

const FREQUENCY_ITEMS = [
  { value: "ONCE", label: "Unique" },
  { value: "DAILY", label: "Quotidienne" },
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "MONTHLY", label: "Mensuelle" },
  { value: "QUARTERLY", label: "Trimestrielle" },
  { value: "YEARLY", label: "Annuelle" },
];

const STATUS_ITEMS = [
  { value: "PENDING", label: "À faire" },
  { value: "DONE", label: "Effectuée" },
  { value: "CANCELLED", label: "Annulée" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function MaintenanceDialog({
  trigger,
  clientId,
  sites,
  maintenance,
}: {
  trigger: ReactNode;
  clientId: string;
  sites: { id: string; name: string }[];
  maintenance?: {
    id: string;
    title: string;
    description: string | null;
    siteId: string | null;
    frequency: string;
    status: string;
    nextRunAt: Date | string;
    lastRunAt: Date | string | null;
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
        await saveMaintenanceAction(maintenance?.id ?? null, clientId, formData);
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
          <DialogTitle>{maintenance ? "Modifier la maintenance" : "Nouvelle maintenance"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="maintenance-title">Titre *</Label>
              <Input id="maintenance-title" name="title" required defaultValue={maintenance?.title} />
            </div>
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="maintenance-site">Site</Label>
                <Select name="siteId" items={siteItems} defaultValue={maintenance?.siteId ?? ""}>
                  <SelectTrigger id="maintenance-site" className="w-full">
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
              <Label htmlFor="maintenance-frequency">Fréquence</Label>
              <Select name="frequency" items={FREQUENCY_ITEMS} defaultValue={maintenance?.frequency ?? "ONCE"}>
                <SelectTrigger id="maintenance-frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={maintenance?.status ?? "PENDING"}>
                <SelectTrigger id="maintenance-status" className="w-full">
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
              <Label htmlFor="maintenance-nextRunAt">Prochaine exécution *</Label>
              <Input
                id="maintenance-nextRunAt"
                name="nextRunAt"
                type="date"
                required
                defaultValue={toDateInputValue(maintenance?.nextRunAt)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-lastRunAt">Dernière exécution</Label>
              <Input
                id="maintenance-lastRunAt"
                name="lastRunAt"
                type="date"
                defaultValue={toDateInputValue(maintenance?.lastRunAt)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="maintenance-description">Description</Label>
              <Textarea id="maintenance-description" name="description" rows={3} defaultValue={maintenance?.description ?? ""} />
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
