"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/client";
import { login } from "@/modules/users/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const demoMode = !hasSupabaseBrowserEnv();

  return (
    <form action={action} className="space-y-5">
      {demoMode ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Modo demonstração ativo até configurar as variáveis do Supabase.
        </div>
      ) : null}

      {state?.message ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-200"
        >
          E-mail
        </label>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-300" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className="h-11 rounded-xl border-white/10 bg-white text-slate-950 pl-11 placeholder:text-slate-400"
          />
        </div>

        {state?.errors?.email ? (
          <p className="text-xs font-medium text-red-200">
            {state.errors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-200"
        >
          Senha
        </label>

        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-300" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            autoComplete="current-password"
            className="h-11 rounded-xl border-white/10 bg-white pl-11 pr-11 text-slate-950 placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {state?.errors?.password ? (
          <p className="text-xs font-medium text-red-200">
            {state.errors.password[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-slate-300">
          <Checkbox name="remember" />
          Manter-me conectado
        </label>

        <Link
          href="/login"
          className="font-semibold text-violet-300 transition hover:text-violet-100"
        >
          Esqueci minha senha
        </Link>
      </div>

      <p className="text-sm leading-6 text-slate-400">
        Ao solicitar recuperação, o usuário receberá por e-mail uma senha temporária para acessar o sistema e redefinir sua senha.
      </p>

      <Button
        type="submit"
        disabled={pending}
        className="h-13 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-sky-500 text-base font-black text-white shadow-[0_18px_40px_rgba(56,189,248,0.20)] hover:from-violet-400 hover:to-sky-400"
      >
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
