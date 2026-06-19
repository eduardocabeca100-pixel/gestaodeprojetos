import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-white p-6 text-center soft-shadow">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Acesso não autorizado</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Seu perfil não possui permissão para acessar esta área ou está
          inativo.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Voltar ao dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
