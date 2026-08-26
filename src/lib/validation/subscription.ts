import { z } from "zod";

export const subscriptionSchema = z.object({
  planId: z.string().trim().optional().or(z.literal("")),
  monthlyPrice: z.string().trim().min(1, "Le prix mensuel est requis."),
  startDate: z.string().trim().min(1, "La date de début est requise."),
  renewalDate: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]),
  description: z.string().trim().optional().or(z.literal("")),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;
