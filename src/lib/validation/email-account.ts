import { z } from "zod";

export const emailAccountSchema = z.object({
  label: z.string().trim().min(1, "Le nom est requis."),
  emailAddress: z.string().trim().email("Adresse email invalide."),
  imapHost: z.string().trim().min(1, "Le serveur IMAP est requis."),
  imapPort: z.coerce.number().int().min(1).max(65535),
  imapSecure: z.string().optional(), // checkbox: "on" or undefined
  username: z.string().trim().min(1, "L'identifiant est requis."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type EmailAccountFormValues = z.infer<typeof emailAccountSchema>;
