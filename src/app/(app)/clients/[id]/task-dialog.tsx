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
import { saveTaskAction } from "./actions";

const STATUS_ITEMS = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "WAITING", label: "En attente" },
  { value: "DONE", label: "Terminé" },
];

const PRIORITY_ITEMS = [
  { value: "LOW", label: "Faible" },
  { value: "NORMAL", label: "Normale" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TaskDialog({
  trigger,
  clientId,
  sites,
  task,
}: {
  trigger: ReactNode;
  clientId: string;
  sites: { id: string; name: string }[];
  task?: {
    id: string;
    title: string;
    description: string | null;
    siteId: string | null;
    status: string;
    priority: string;
    dueDate: Date | string | null;
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
        await saveTaskAction(task?.id ?? null, clientId, formData);
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
          <DialogTitle>{task ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="task-title">Titre *</Label>
              <Input id="task-title" name="title" required defaultValue={task?.title} />
            </div>
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="task-site">Site</Label>
                <Select name="siteId" items={siteItems} defaultValue={task?.siteId ?? ""}>
                  <SelectTrigger id="task-site" className="w-full">
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
              <Label htmlFor="task-dueDate">Échéance</Label>
              <Input id="task-dueDate" name="dueDate" type="date" defaultValue={toDateInputValue(task?.dueDate)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={task?.status ?? "TODO"}>
                <SelectTrigger id="task-status" className="w-full">
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
              <Label htmlFor="task-priority">Priorité</Label>
              <Select name="priority" items={PRIORITY_ITEMS} defaultValue={task?.priority ?? "NORMAL"}>
                <SelectTrigger id="task-priority" className="w-full">
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea id="task-description" name="description" rows={3} defaultValue={task?.description ?? ""} />
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
