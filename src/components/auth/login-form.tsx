"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/client";
import { login } from "@/modules/users/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const demoMode = !hasSupabaseBrowserEnv();

  return (
    <form action={action} className="space-y-6">
      <div className="mb-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-md">
            GC
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200/80">Companhia de Artes Viva</p>
            <h3 className="text-xl font-extrabold leading-tight">Bem-vindo de volta</h3>
          </div>
        </div>
      </div>

      {demoMode ? (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/8 px-4 py-3 text-sm text-sky-100">
          Modo demonstração ativo até configurar as variáveis do Supabase.
        </div>
      ) : null}

      {state?.message ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-100">E-mail</span>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-300" />
          <Input
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className="pl-12"
          />
        </div>
        {state?.errors?.email ? (
          <span className="mt-1 block text-xs text-red-300">{state.errors.email[0]}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-100">Senha</span>
        <div className="relative mt-2">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-300" />
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            autoComplete="current-password"
            className="pl-12 pr-12"
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state?.errors?.password ? (
          <span className="mt-1 block text-xs text-red-300">{state.errors.password[0]}</span>
        ) : null}
      </label>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <Checkbox />
          <span>Manter-me conectado</span>
        </label>
        <Link className="font-medium text-violet-300 transition hover:text-white text-sm" href="/redefinir-senha">
          Esqueci minha senha
        </Link>
      </div>

      <p className="text-sm leading-6 text-slate-400">
        Ao solicitar recuperação, o usuário receberá por e-mail uma senha temporária para acessar o sistema e redefinir sua senha.
      </p>

      <Button className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-500 via-blue-500 to-sky-500 text-base font-semibold shadow-lg shadow-blue-500/25" type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <div className="flex items-center gap-3 pt-3 text-sm text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        <span>Acesso restrito a usuários autorizados.</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </form>
  );
}
