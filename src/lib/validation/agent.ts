import { z } from "zod";

export const agentConfirmSchema = z.object({
  clientId: z.string().trim().optional().or(z.literal("")),
  newClientName: z.string().trim().optional().or(z.literal("")),
  taskTitle: z.string().trim().min(1, "Le titre est requis."),
  taskDescription: z.string().trim().optional().or(z.literal("")),
  amount: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
});

export type AgentConfirmValues = z.infer<typeof agentConfirmSchema>;
