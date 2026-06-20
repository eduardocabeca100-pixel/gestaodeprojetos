"use client";

import { useActionState } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updatePassword } from "@/modules/users/actions";

export function PasswordResetForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.message ? (
        <div aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">Nova senha</span>
        <span className="relative mt-1 block">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-11 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Digite a nova senha"
            minLength={8}
            required
          />
        </span>
        {state?.errors?.password ? (
          <span className="mt-1 block text-xs text-red-600">
            {state.errors.password[0]}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium">Confirmar senha</span>
        <span className="relative mt-1 block">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-11 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            placeholder="Confirme a nova senha"
            minLength={8}
            required
          />
        </span>
        {state?.errors?.confirmation ? (
          <span className="mt-1 block text-xs text-red-600">
            {state.errors.confirmation[0]}
          </span>
        ) : null}
      </label>

      <Button className="h-11 w-full" type="submit" disabled={pending}>
        {pending ? "Atualizando..." : "Atualizar senha"}
      </Button>
    </form>
  );
}
