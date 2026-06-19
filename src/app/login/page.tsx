import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_460px]">
      <section className="hidden min-h-screen bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
            VG
          </div>
          <div>
            <p className="font-semibold">VIVA Gestão Cultural</p>
            <p className="text-sm text-sidebar-foreground/65">
              Cia de Artes Viva
            </p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.2em] text-sidebar-foreground/55">
            Sistema privado
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal">
            Gestão documental, financeira e cultural em um só painel.
          </h1>
          <p className="mt-5 text-base leading-7 text-sidebar-foreground/72">
            Projetos, editais, aulas, participantes, comprovantes e dossiês
            prontos para prestação de contas.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/55">
          Circuito Catarinense de Cultura PNAB SC 2026
        </p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 soft-shadow">
          <div className="mb-6">
            <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary lg:hidden">
              VG
            </div>
            <p className="text-sm font-medium text-primary">Área restrita</p>
            <h2 className="mt-2 text-2xl font-semibold">Entrar</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use seu e-mail e senha cadastrados no Supabase Auth.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
