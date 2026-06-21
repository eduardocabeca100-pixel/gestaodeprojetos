import { LoginForm } from "@/components/auth/login-form";

const silhouettes = [92, 122, 104, 138, 110, 128];

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#060814] text-white">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(129,92,255,0.20),transparent_32%),radial-gradient(circle_at_70%_50%,rgba(68,46,150,0.18),transparent_34%),linear-gradient(115deg,#05070f_0%,#0b1020_45%,#05060c_100%)]" />

        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-[5%] top-0 h-[42%] w-[11%] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),transparent_68%)] blur-sm" />
          <div className="absolute left-[18%] top-0 h-[46%] w-[10%] bg-[radial-gradient(ellipse_at_top,rgba(180,198,255,0.28),transparent_70%)] blur-sm" />
          <div className="absolute left-[32%] top-0 h-[44%] w-[10%] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.23),transparent_70%)] blur-sm" />
          <div className="absolute left-[47%] top-0 h-[40%] w-[11%] bg-[radial-gradient(ellipse_at_top,rgba(170,170,255,0.18),transparent_70%)] blur-sm" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[radial-gradient(ellipse_at_32%_100%,rgba(255,255,255,0.20),transparent_42%),linear-gradient(to_top,#03040a_12%,transparent)]" />

        <div className="absolute bottom-[12%] left-[8%] hidden items-end gap-7 opacity-80 md:flex">
          {silhouettes.map((height, index) => (
            <div key={index} className="relative w-9">
              <div className="mx-auto size-7 rounded-full bg-black/90 shadow-[0_0_35px_rgba(255,255,255,0.22)]" />
              <div
                className="mx-auto mt-1 w-6 rounded-t-full bg-black/90 shadow-[0_20px_70px_rgba(0,0,0,0.9)]"
                style={{ height }}
              />
              <div className="absolute -bottom-5 left-1/2 h-8 w-px -translate-x-1/2 bg-black/90" />
            </div>
          ))}
        </div>

        <section className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-[42vh] flex-col items-center justify-center px-6 py-8 text-center sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                Sistema de Gestão de Projetos
              </h1>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.42em] text-violet-300 sm:text-sm">
                Cia de Artes Viva
              </p>

              <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-slate-300">
                Painel administrativo para organizar projetos, equipe, documentos,
                financeiro, produção e acompanhamento cultural da companhia.
              </p>
            </div>

            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              WWW.CIAVIVA.COM
            </p>
          </div>

          <div className="flex items-center justify-center px-6 pb-10 pt-0 sm:px-10 lg:min-h-screen lg:py-12">
            <div className="w-full max-w-[460px] rounded-[1.8rem] border border-white/10 bg-[#08101f]/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-8">
              <div className="mb-7">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">
                  Bem-vindo de volta!
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                  Faça login para acessar sua conta
                </h2>
              </div>

              <div className="login-form-sem-boas-vindas">
                <LoginForm />
              </div>

              <div className="mt-7 text-center text-xs text-slate-500">
                Acesso restrito aos responsáveis autorizados.
              </div>

              <style jsx global>{`
                .login-form-sem-boas-vindas form > div:first-child {
                  display: none !important;
                }
              `}</style>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
