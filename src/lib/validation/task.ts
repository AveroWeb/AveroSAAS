import { z } from "zod";

export const taskSchema = z.object({
  clientId: z.string().trim().optional().or(z.literal("")),
  siteId: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Le titre est requis."),
  description: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["TODO", "IN_PROGRESS", "WAITING", "DONE"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
