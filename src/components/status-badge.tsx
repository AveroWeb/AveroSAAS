import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type BadgeMeta = { label: string; className: string };

export function StatusBadge({ meta }: { meta: BadgeMeta }) {
  return (
    <Badge className={cn("border-transparent font-medium", meta.className)}>
      {meta.label}
    </Badge>
  );
}

const emerald = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
const blue = "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400";
const amber = "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
const red = "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
const zinc = "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400";
const violet = "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400";

export const clientStatusMeta: Record<string, BadgeMeta> = {
  ACTIVE: { label: "Actif", className: emerald },
  PROSPECT: { label: "Prospect", className: blue },
  INACTIVE: { label: "Inactif", className: zinc },
};

export const siteStatusMeta: Record<string, BadgeMeta> = {
  ACTIVE: { label: "Actif", className: emerald },
  MAINTENANCE: { label: "Maintenance", className: amber },
  OFFLINE: { label: "Hors ligne", className: red },
};

export const siteTypeMeta: Record<string, BadgeMeta> = {
  WORDPRESS: { label: "WordPress", className: blue },
  NEXTJS: { label: "Next.js", className: zinc },
  SHOPIFY: { label: "Shopify", className: emerald },
  WOOCOMMERCE: { label: "WooCommerce", className: violet },
  WEBFLOW: { label: "Webflow", className: blue },
  OTHER: { label: "Autre", className: zinc },
};

export const siteEnvironmentMeta: Record<string, BadgeMeta> = {
  PRODUCTION: { label: "Production", className: emerald },
  STAGING: { label: "Staging", className: amber },
  DEVELOPMENT: { label: "Développement", className: zinc },
};

export const domainStatusMeta: Record<string, BadgeMeta> = {
  ACTIVE: { label: "Actif", className: emerald },
  EXPIRING: { label: "Bientôt expiré", className: amber },
  EXPIRED: { label: "Expiré", className: red },
  TRANSFERRED: { label: "Transféré", className: zinc },
};

export const incidentStatusMeta: Record<string, BadgeMeta> = {
  NEW: { label: "Nouveau", className: red },
  IN_PROGRESS: { label: "En cours", className: amber },
  RESOLVED: { label: "Résolu", className: emerald },
  CLOSED: { label: "Fermé", className: zinc },
};

export const incidentPriorityMeta: Record<string, BadgeMeta> = {
  LOW: { label: "Faible", className: zinc },
  NORMAL: { label: "Normale", className: blue },
  HIGH: { label: "Haute", className: amber },
  CRITICAL: { label: "Critique", className: red },
};

export const taskStatusMeta: Record<string, BadgeMeta> = {
  TODO: { label: "À faire", className: zinc },
  IN_PROGRESS: { label: "En cours", className: blue },
  WAITING: { label: "En attente", className: amber },
  DONE: { label: "Terminé", className: emerald },
};

export const taskPriorityMeta: Record<string, BadgeMeta> = {
  LOW: { label: "Faible", className: zinc },
  NORMAL: { label: "Normale", className: blue },
  HIGH: { label: "Haute", className: amber },
  URGENT: { label: "Urgente", className: red },
};

export const maintenanceStatusMeta: Record<string, BadgeMeta> = {
  PENDING: { label: "À faire", className: amber },
  DONE: { label: "Effectuée", className: emerald },
  CANCELLED: { label: "Annulée", className: zinc },
};

export const subscriptionStatusMeta: Record<string, BadgeMeta> = {
  ACTIVE: { label: "Actif", className: emerald },
  PAUSED: { label: "En pause", className: amber },
  CANCELLED: { label: "Résilié", className: zinc },
};

export const quoteStatusMeta: Record<string, BadgeMeta> = {
  DRAFT: { label: "Brouillon", className: zinc },
  SENT: { label: "Envoyé", className: blue },
  ACCEPTED: { label: "Accepté", className: emerald },
  REJECTED: { label: "Refusé", className: red },
  EXPIRED: { label: "Expiré", className: amber },
};

export const invoiceStatusMeta: Record<string, BadgeMeta> = {
  PAID: { label: "Payée", className: emerald },
  UNPAID: { label: "Impayée", className: amber },
  OVERDUE: { label: "En retard", className: red },
  CANCELLED: { label: "Annulée", className: zinc },
};

export const ticketStatusMeta: Record<string, BadgeMeta> = {
  TO_PROCESS: { label: "À traiter", className: red },
  IN_PROGRESS: { label: "En cours", className: amber },
  WAITING_CLIENT: { label: "Attente client", className: blue },
  DONE: { label: "Terminé", className: emerald },
};

export const roleMeta: Record<string, BadgeMeta> = {
  ADMIN: { label: "Administrateur", className: violet },
  MEMBER: { label: "Membre", className: blue },
  CLIENT: { label: "Client", className: zinc },
};
