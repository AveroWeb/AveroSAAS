import { z } from "zod";

export const hostingSchema = z.object({
  clientId: z.string().trim().min(1, "Le client est requis."),
  siteId: z.string().trim().optional().or(z.literal("")),
  provider: z.string().trim().min(1, "Le fournisseur est requis."),
  dashboardUrl: z.string().trim().optional().or(z.literal("")),
  serverType: z.string().trim().optional().or(z.literal("")),
  accountRef: z.string().trim().optional().or(z.literal("")),
  monthlyCost: z.string().trim().optional().or(z.literal("")),
  annualCost: z.string().trim().optional().or(z.literal("")),
  renewsAt: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type HostingFormValues = z.infer<typeof hostingSchema>;
