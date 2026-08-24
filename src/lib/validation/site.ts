import { z } from "zod";

export const siteSchema = z.object({
  clientId: z.string().trim().min(1, "Le client est requis."),
  name: z.string().trim().min(1, "Le nom du site est requis."),
  url: z.string().trim().min(1, "L'URL est requise."),
  type: z.enum(["WORDPRESS", "NEXTJS", "SHOPIFY", "WOOCOMMERCE", "WEBFLOW", "OTHER"]),
  environment: z.enum(["PRODUCTION", "STAGING", "DEVELOPMENT"]),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OFFLINE"]),
  repositoryUrl: z.string().trim().optional().or(z.literal("")),
  stagingUrl: z.string().trim().optional().or(z.literal("")),
  launchedAt: z.string().trim().optional().or(z.literal("")),
  lastBackupAt: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type SiteFormValues = z.infer<typeof siteSchema>;
