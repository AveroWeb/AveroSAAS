import { z } from "zod";

export const maintenanceSchema = z.object({
  siteId: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Le titre est requis."),
  description: z.string().trim().optional().or(z.literal("")),
  frequency: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  status: z.enum(["PENDING", "DONE", "CANCELLED"]),
  nextRunAt: z.string().trim().min(1, "La date est requise."),
  lastRunAt: z.string().trim().optional().or(z.literal("")),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;
