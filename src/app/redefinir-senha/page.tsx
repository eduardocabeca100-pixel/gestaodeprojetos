import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/require-role";
import { logout } from "@/modules/users/actions";

export default async function ResetPasswordPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_34%),linear-gradient(180deg,theme(colors.background)_0%,theme(colors.background)_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Segurança de acesso</p>
              <h1 className="mt-2 text-[1.5rem] font-semibold tracking-tight sm:text-[1.8rem]">
                Redefinir senha
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {profile.must_change_password
                  ? "Esta conta precisa trocar a senha no primeiro acesso."
                  : "Você pode atualizar sua senha de acesso agora."}
              </p>
            </div>
            <form action={logout}>
              <Button className="w-full sm:w-auto" type="submit" variant="outline">
                <ArrowLeft className="size-4" />
                Voltar ao login
              </Button>
            </form>
          </div>
          <div className="mt-6">
            <PasswordResetForm />
          </div>
        </div>
      </section>
    </main>
  );
}
