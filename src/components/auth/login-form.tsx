"use client";

import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/client";
import { login } from "@/modules/users/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const demoMode = !hasSupabaseBrowserEnv();

  return (
    <form action={action} className="space-y-4">
      {demoMode ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Modo demonstração ativo até configurar as variáveis do Supabase.
        </div>
      ) : null}
      {state?.message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">E-mail</span>
        <span className="relative mt-1 block">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:ring-3 focus:ring-primary/15"
            name="email"
            type="email"
            defaultValue="admin@viva.local"
            autoComplete="email"
          />
        </span>
        {state?.errors?.email ? (
          <span className="mt-1 block text-xs text-red-600">
            {state.errors.email[0]}
          </span>
        ) : null}
      </label>
      <label className="block">
        <span className="text-sm font-medium">Senha</span>
        <span className="relative mt-1 block">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:ring-3 focus:ring-primary/15"
            name="password"
            type="password"
            defaultValue="viva-demo"
            autoComplete="current-password"
          />
        </span>
        {state?.errors?.password ? (
          <span className="mt-1 block text-xs text-red-600">
            {state.errors.password[0]}
          </span>
        ) : null}
      </label>
      <Button className="h-10 w-full" type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar no sistema"}
      </Button>
    </form>
  );
}
