import { z } from "zod";

export const invoiceSchema = z.object({
  subscriptionId: z.string().trim().optional().or(z.literal("")),
  amount: z.string().trim().min(1, "Le montant est requis."),
  status: z.enum(["PAID", "UNPAID", "OVERDUE", "CANCELLED"]),
  issueDate: z.string().trim().min(1, "La date d'émission est requise."),
  dueDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
