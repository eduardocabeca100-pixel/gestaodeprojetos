"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, Plus, RefreshCw, ShieldCheck } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
};

export function CerebroAccessSettings() {
  const [auth, setAuth] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("Carregando configurações do Cérebro IA...");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [form, setForm] = useState({ name: "", email: "", role: "editor", password: "" });
  const [loading, setLoading] = useState(false);

  async function loadAuth() {
    const response = await fetch("/api/cerebro/auth", {
      credentials: "same-origin",
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    setAuth(data);
    return data;
  }

  async function loadUsers() {
    setLoading(true);

    try {
      const data = await loadAuth();

      if (!data?.authenticated) {
        setMessage("Entre como administrador do Cérebro para gerenciar acessos.");
        setUsers([]);
        return;
      }

      const response = await fetch("/api/cerebro/users", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json().catch(() => ({}));

      if (!result.ok) {
        setMessage(result.message || "Não consegui listar usuários.");
        setUsers([]);
        return;
      }

      setUsers(result.users || []);
      setMessage("Usuários autorizados carregados.");
    } finally {
      setLoading(false);
    }
  }

  async function doLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/cerebro/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });

      const result = await response.json().catch(() => ({}));
      setMessage(result.message || "Login processado.");

      if (result.ok) {
        setLogin({ email: "", password: "" });
        await loadUsers();
      }
    } finally {
      setLoading(false);
    }
  }

  async function addUser(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/cerebro/users", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json().catch(() => ({}));
      setMessage(result.message || "Usuário processado.");

      if (result.ok) {
        setForm({ name: "", email: "", role: "editor", password: "" });
        await loadUsers();
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleUser(user: User) {
    setLoading(true);

    try {
      const response = await fetch("/api/cerebro/users", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          is_active: !user.is_active,
        }),
      });

      const result = await response.json().catch(() => ({}));
      setMessage(result.message || "Usuário atualizado.");
      await loadUsers();
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(user: User) {
    const password = window.prompt(`Nova senha do Cérebro para ${user.email}:`);

    if (!password) return;

    setLoading(true);

    try {
      const response = await fetch("/api/cerebro/users", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));
      setMessage(result.message || "Senha atualizada.");
      await loadUsers();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const authenticated = Boolean(auth?.authenticated);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              Cérebro IA
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-slate-950">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              Acesso ao Cérebro IA
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              Controle quais usuários podem abrir a área privada do Cérebro IA. O login do VIVA não libera esta aba.
            </p>
          </div>

          <button type="button" onClick={() => void loadUsers()} className="btn-secondary" disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Atualizar
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      </section>

      {!authenticated ? (
        <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <LockKeyhole className="size-5 text-primary" />
            Entrar como administrador do Cérebro
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Use o e-mail e a senha configurados na Vercel como admin inicial.
          </p>

          <form onSubmit={doLogin} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <input
              className="form-input"
              type="email"
              placeholder="E-mail admin do Cérebro"
              value={login.email}
              onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))}
              required
            />
            <input
              className="form-input"
              type="password"
              placeholder="Senha do Cérebro"
              value={login.password}
              onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              Entrar
            </button>
          </form>
        </section>
      ) : null}

      {authenticated ? (
        <>
          <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Plus className="size-5 text-primary" />
              Liberar novo usuário
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre e-mail e senha exclusivos do Cérebro IA.
            </p>

            <form onSubmit={addUser} className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_180px_1fr_auto]">
              <input
                className="form-input"
                placeholder="Nome"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                className="form-input"
                type="email"
                placeholder="E-mail autorizado"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <select
                className="form-input"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
                <option value="viewer">Visualizador</option>
              </select>
              <input
                className="form-input"
                type="password"
                placeholder="Senha do Cérebro"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                Cadastrar
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Usuários autorizados</h2>

            <div className="mt-5 grid gap-3">
              {users.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Nenhum usuário cadastrado no banco ainda.
                </div>
              ) : null}

              {users.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{user.name || user.email}</p>
                    <p className="mt-1 text-sm text-slate-500">{user.email} • {user.role}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={user.is_active ? "rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700" : "rounded-full bg-rose-100 px-3 py-2 text-xs font-black text-rose-700"}>
                      {user.is_active ? "ativo" : "bloqueado"}
                    </span>
                    <button type="button" className="btn-secondary" onClick={() => void resetPassword(user)}>
                      Nova senha
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => void toggleUser(user)}>
                      {user.is_active ? "Bloquear" : "Liberar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
