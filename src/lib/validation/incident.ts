import { z } from "zod";

export const incidentSchema = z.object({
  siteId: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Le titre est requis."),
  description: z.string().trim().optional().or(z.literal("")),
  cause: z.string().trim().optional().or(z.literal("")),
  solution: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
  startedAt: z.string().trim().min(1, "La date de début est requise."),
  resolvedAt: z.string().trim().optional().or(z.literal("")),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;
