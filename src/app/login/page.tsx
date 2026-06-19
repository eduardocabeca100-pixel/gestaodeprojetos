import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#050814] text-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-white/10 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,30,0.96)_0%,rgba(5,8,20,0.98)_58%,rgba(2,4,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(52,116,255,0.16),transparent_36%),radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[repeating-linear-gradient(160deg,transparent_0_24px,rgba(126,34,206,0.08)_24px_25px,transparent_25px_62px)] opacity-45" />
        <div className="relative z-10 flex items-center justify-start">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_0_80px_rgba(76,88,255,0.12)] backdrop-blur-sm">
            <p className="text-5xl font-black leading-none tracking-tight text-white">Gestão Cultural</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              Companhia de Artes Viva
            </p>
          </div>
        </div>
        <div className="relative z-10 max-w-xl pl-2">
          <p className="text-[0.95rem] leading-8 text-slate-300">
            Plataforma privada para administração, acompanhamento e organização de projetos culturais.
          </p>
        </div>
        <p className="relative z-10 text-sm text-sky-200/80">www.ciaviva.com</p>
      </section>
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[640px] rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-black text-white">
              GC
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200/70">
              Companhia de Artes Viva
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Faça seu login</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Acesse a plataforma para gerir projetos, documentos, financeiro e prestação de contas.
            </p>
          </div>
          <div className="hidden lg:mb-8 lg:block">
            <h2 className="text-4xl font-black tracking-tight">
              Faça seu <span className="bg-gradient-to-r from-violet-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">login</span>
            </h2>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
