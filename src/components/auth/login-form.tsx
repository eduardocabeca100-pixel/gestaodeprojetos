"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/client";
import { login } from "@/modules/users/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const demoMode = !hasSupabaseBrowserEnv();

  return (
    <form action={action} className="space-y-5">
      {demoMode ? (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Modo demonstração ativo até configurar as variáveis do Supabase.
        </div>
      ) : null}
      {state?.message ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-slate-100">E-mail</span>
        <span className="relative mt-2 block">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-300" />
          <input
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-base text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition focus:border-blue-400/60 focus:bg-white/8 focus:ring-4 focus:ring-blue-500/15"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
          />
        </span>
        {state?.errors?.email ? (
          <span className="mt-1 block text-xs text-red-300">
            {state.errors.email[0]}
          </span>
        ) : null}
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-100">Senha</span>
        <span className="relative mt-2 block">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-300" />
          <input
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-12 text-base text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition focus:border-blue-400/60 focus:bg-white/8 focus:ring-4 focus:ring-blue-500/15"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            autoComplete="current-password"
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </span>
        {state?.errors?.password ? (
          <span className="mt-1 block text-xs text-red-300">
            {state.errors.password[0]}
          </span>
        ) : null}
      </label>
      <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-0" />
          Manter-me conectado
        </label>
        <Link className="font-medium text-violet-300 transition hover:text-white" href="/redefinir-senha">
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
