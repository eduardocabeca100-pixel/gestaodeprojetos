import { redirect } from "next/navigation";

import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { getCurrentProfile } from "@/lib/auth/require-role";

export default async function ResetPasswordPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-white p-6 soft-shadow">
        <p className="text-sm font-medium text-primary">Segurança de acesso</p>
        <h1 className="mt-2 text-2xl font-semibold">Redefinir senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {profile.must_change_password
            ? "Esta conta precisa trocar a senha no primeiro acesso."
            : "Você pode atualizar sua senha de acesso agora."}
        </p>
        <div className="mt-6">
          <PasswordResetForm />
        </div>
      </section>
    </main>
  );
}
