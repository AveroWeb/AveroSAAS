import { z } from "zod";

export const domainSchema = z.object({
  clientId: z.string().trim().min(1, "Le client est requis."),
  siteId: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Le nom de domaine est requis."),
  isPrimary: z.enum(["true", "false"]).optional(),
  registrar: z.string().trim().optional().or(z.literal("")),
  registrarUrl: z.string().trim().optional().or(z.literal("")),
  expiresAt: z.string().trim().optional().or(z.literal("")),
  autoRenew: z.enum(["true", "false"]).optional(),
  annualCost: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "EXPIRING", "EXPIRED", "TRANSFERRED"]),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type DomainFormValues = z.infer<typeof domainSchema>;
