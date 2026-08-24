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
import { saveToolAction } from "./actions";

export function ToolDialog({
  trigger,
  clientId,
  sites,
  tool,
}: {
  trigger: ReactNode;
  clientId: string;
  sites: { id: string; name: string }[];
  tool?: {
    id: string;
    name: string;
    category: string;
    siteId: string | null;
    url: string | null;
    identifier: string | null;
    monthlyCost: number | string | null;
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
        await saveToolAction(tool?.id ?? null, formData);
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
          <DialogTitle>{tool ? "Modifier l'outil" : "Ajouter un outil"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tool-name">Nom *</Label>
              <Input id="tool-name" name="name" required defaultValue={tool?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-category">Catégorie *</Label>
              <Input
                id="tool-category"
                name="category"
                required
                defaultValue={tool?.category}
                placeholder="Repository, Analytics, Design…"
              />
            </div>
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="tool-site">Site</Label>
                <Select name="siteId" items={siteItems} defaultValue={tool?.siteId ?? ""}>
                  <SelectTrigger id="tool-site" className="w-full">
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
              <Label htmlFor="tool-url">URL</Label>
              <Input id="tool-url" name="url" defaultValue={tool?.url ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-identifier">Identifiant</Label>
              <Input id="tool-identifier" name="identifier" defaultValue={tool?.identifier ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-monthlyCost">Coût mensuel (€)</Label>
              <Input
                id="tool-monthlyCost"
                name="monthlyCost"
                type="number"
                step="0.01"
                defaultValue={tool?.monthlyCost !== null && tool?.monthlyCost !== undefined ? String(tool.monthlyCost) : ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tool-notes">Notes</Label>
              <Textarea id="tool-notes" name="notes" rows={3} defaultValue={tool?.notes ?? ""} />
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
