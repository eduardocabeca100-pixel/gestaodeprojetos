"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import type { CurrentProfile } from "@/lib/auth/require-role";

export function PasswordResetGate({
  profile,
  children,
}: {
  profile: CurrentProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (profile.must_change_password && pathname !== "/redefinir-senha") {
      router.replace("/redefinir-senha");
    }
  }, [pathname, profile.must_change_password, router]);

  if (profile.must_change_password && pathname !== "/redefinir-senha") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md rounded-lg border border-border bg-white p-6 text-center soft-shadow">
          <p className="text-sm font-medium text-primary">Acesso protegido</p>
          <h1 className="mt-2 text-2xl font-semibold">Troca de senha obrigatória</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Estamos te levando para a tela de redefinição antes de liberar o painel.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
