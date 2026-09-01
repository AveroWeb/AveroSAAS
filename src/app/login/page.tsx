import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — Avero Saas",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Avero Saas</h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre espace de gestion
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
