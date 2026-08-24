"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SiteFormAction = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

const TYPE_ITEMS = [
  { value: "WORDPRESS", label: "WordPress" },
  { value: "NEXTJS", label: "Next.js" },
  { value: "SHOPIFY", label: "Shopify" },
  { value: "WOOCOMMERCE", label: "WooCommerce" },
  { value: "WEBFLOW", label: "Webflow" },
  { value: "OTHER", label: "Autre" },
];

const ENVIRONMENT_ITEMS = [
  { value: "PRODUCTION", label: "Production" },
  { value: "STAGING", label: "Staging" },
  { value: "DEVELOPMENT", label: "Développement" },
];

const STATUS_ITEMS = [
  { value: "ACTIVE", label: "Actif" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OFFLINE", label: "Hors ligne" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function SiteForm({
  action,
  submitLabel,
  clients,
  defaultValues,
}: {
  action: SiteFormAction;
  submitLabel: string;
  clients: { id: string; companyName: string }[];
  defaultValues?: {
    clientId?: string;
    name?: string;
    url?: string;
    type?: string;
    environment?: string;
    status?: string;
    repositoryUrl?: string | null;
    stagingUrl?: string | null;
    launchedAt?: Date | string | null;
    lastBackupAt?: Date | string | null;
    notes?: string | null;
  };
}) {
  const [error, formAction, isPending] = useActionState(action, undefined);
  const clientItems = clients.map((c) => ({ value: c.id, label: c.companyName }));

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nom du site *</Label>
          <Input id="name" name="name" required defaultValue={defaultValues?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client">Client *</Label>
          <Select name="clientId" items={clientItems} defaultValue={defaultValues?.clientId}>
            <SelectTrigger id="client" className="w-full">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {clientItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">URL *</Label>
          <Input id="url" name="url" required defaultValue={defaultValues?.url} placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" items={TYPE_ITEMS} defaultValue={defaultValues?.type ?? "OTHER"}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="environment">Environnement</Label>
          <Select
            name="environment"
            items={ENVIRONMENT_ITEMS}
            defaultValue={defaultValues?.environment ?? "PRODUCTION"}
          >
            <SelectTrigger id="environment" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select name="status" items={STATUS_ITEMS} defaultValue={defaultValues?.status ?? "ACTIVE"}>
            <SelectTrigger id="status" className="w-full">
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
          <Label htmlFor="repositoryUrl">Dépôt Git</Label>
          <Input id="repositoryUrl" name="repositoryUrl" defaultValue={defaultValues?.repositoryUrl ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stagingUrl">URL de staging</Label>
          <Input id="stagingUrl" name="stagingUrl" defaultValue={defaultValues?.stagingUrl ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="launchedAt">Date de mise en ligne</Label>
          <Input
            id="launchedAt"
            name="launchedAt"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.launchedAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastBackupAt">Dernière sauvegarde</Label>
          <Input
            id="lastBackupAt"
            name="lastBackupAt"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.lastBackupAt)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={4} defaultValue={defaultValues?.notes ?? ""} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
