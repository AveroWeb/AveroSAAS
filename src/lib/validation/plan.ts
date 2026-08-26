import { z } from "zod";

export const planSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  monthlyPrice: z.string().trim().min(1, "Le prix est requis."),
  description: z.string().trim().optional().or(z.literal("")),
  isActive: z.string().optional(),
});

export type PlanFormValues = z.infer<typeof planSchema>;
