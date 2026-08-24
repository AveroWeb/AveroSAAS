import { z } from "zod";

export const toolSchema = z.object({
  clientId: z.string().trim().min(1, "Le client est requis."),
  siteId: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Le nom de l'outil est requis."),
  category: z.string().trim().min(1, "La catégorie est requise."),
  url: z.string().trim().optional().or(z.literal("")),
  identifier: z.string().trim().optional().or(z.literal("")),
  monthlyCost: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type ToolFormValues = z.infer<typeof toolSchema>;
