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
import { saveIncidentAction } from "./actions";

const STATUS_ITEMS = [
  { value: "NEW", label: "Nouveau" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED", label: "Résolu" },
  { value: "CLOSED", label: "Fermé" },
];

const PRIORITY_ITEMS = [
  { value: "LOW", label: "Faible" },
  { value: "NORMAL", label: "Normale" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL", label: "Critique" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function IncidentDialog({
  trigger,
  clientId,
  sites,
  incident,
}: {
  trigger: ReactNode;
  clientId: string;
  sites: { id: string; name: string }[];
  incident?: {
    id: string;
    title: string;
    description: string | null;
    cause: string | null;
    solution: string | null;
    siteId: string | null;
    status: string;
    priority: string;
    startedAt: Date | string;
    resolvedAt: Date | string | null;
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
        await saveIncidentAction(incident?.id ?? null, clientId, formData);
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
          <DialogTitle>{incident ? "Modifier l'incident" : "Nouvel incident"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="incident-title">Titre *</Label>
              <Input id="incident-title" name="title" required defaultValue={incident?.title} />
            </div>
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="incident-site">Site</Label>
                <Select name="siteId" items={siteItems} defaultValue={incident?.siteId ?? ""}>
                  <SelectTrigger id="incident-site" className="w-full">
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
              <Label htmlFor="incident-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={incident?.status ?? "NEW"}>
                <SelectTrigger id="incident-status" className="w-full">
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
              <Label htmlFor="incident-priority">Priorité</Label>
              <Select name="priority" items={PRIORITY_ITEMS} defaultValue={incident?.priority ?? "NORMAL"}>
                <SelectTrigger id="incident-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="incident-startedAt">Début *</Label>
              <Input
                id="incident-startedAt"
                name="startedAt"
                type="date"
                required
                defaultValue={toDateInputValue(incident?.startedAt) || toDateInputValue(new Date())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incident-resolvedAt">Résolu le</Label>
              <Input
                id="incident-resolvedAt"
                name="resolvedAt"
                type="date"
                defaultValue={toDateInputValue(incident?.resolvedAt)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="incident-description">Description</Label>
              <Textarea id="incident-description" name="description" rows={2} defaultValue={incident?.description ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incident-cause">Cause</Label>
              <Textarea id="incident-cause" name="cause" rows={2} defaultValue={incident?.cause ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incident-solution">Solution</Label>
              <Textarea id="incident-solution" name="solution" rows={2} defaultValue={incident?.solution ?? ""} />
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
