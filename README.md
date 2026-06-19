# VIVA Gestão Cultural

Plataforma privada para gestão de projetos culturais, editais, documentação, cronograma, financeiro, equipe, participantes, mídia externa e geração de relatórios/dossiês em PDF.

O MVP está preparado para a Cia de Artes Viva e inclui o projeto inicial **Formação de Artistas de Rua e Montagem do Espetáculo Reféns**, vinculado ao **Circuito Catarinense de Cultura PNAB SC 2026**, inscrição **000937**, valor aprovado **R$ 50.000,00**.

## Tecnologias

- Next.js 16 com App Router
- React 19 e TypeScript
- Tailwind CSS 4 e shadcn/ui
- Supabase Auth, Database, Storage e RLS
- React Hook Form + Zod
- TanStack Table
- Recharts
- date-fns
- jsPDF + jspdf-autotable
- XLSX/CSV utilities
- Lucide React

## Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

Sem variáveis do Supabase, o app roda em modo demonstração com perfil administrativo genérico. Ao configurar Supabase, as rotas protegidas passam a exigir sessão real.

## Variáveis de ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Não versionar `.env` nem `.env.local`. O `.gitignore` mantém esses arquivos fora do Git e permite apenas `.env.example`.

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Execute `supabase/storage.sql` para criar buckets e policies.
4. Execute `supabase/seed.sql` para inserir o projeto Reféns.
5. Crie usuários no Supabase Auth.
6. Cadastre os usuários na tabela `profiles` com `role` igual a `admin` ou `diretor_executivo`.

Roles preparadas:

- `admin`
- `super_admin`
- `diretor_executivo`
- `financeiro`
- `editor_projeto`
- `equipe_tecnica`
- `visualizador`

No MVP, `admin`, `super_admin` e `diretor_executivo` acessam o sistema.

## Preparação para Firebase

O repositório já inclui a base para publicação no Firebase App Hosting com o projeto `gestaodeprojetosviva`:

- `.firebaserc` com o alias padrão do projeto;
- `apphosting.yaml` com configurações iniciais de runtime;
- `NEXT_PUBLIC_APP_URL` preparado para a URL pública de produção.

Depois de conectar o projeto real no Firebase, ajuste as variáveis do Supabase no painel do serviço.

## Configuração na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente listadas acima.
3. Use o comando de build padrão:

```bash
npm run build
```

4. Garanta que `NEXT_PUBLIC_APP_URL` aponte para a URL de produção.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Estrutura

```txt
src/app
  login
  acesso-negado
  (protected)
    dashboard
    projetos
    documentos
    cronograma
    financeiro
    equipe
    participantes
    midia
    relatorios
    configuracoes

src/components
  auth
  dashboard
  documents
  finance
  layout
  media
  participants
  projects
  reports
  schedule
  settings
  shared
  team

src/lib
  auth
  supabase
  utils

src/modules
  projects
  documents
  media
  finance
  schedule
  team
  participants
  reports
  settings
  users
```

Cada módulo mantém `types`, `schemas`, `queries` e `actions` separados para facilitar evolução para CRUD real no Supabase.

## Módulos disponíveis

- Dashboard com KPIs, projeto em destaque, documentos, cronograma, financeiro, mídia e relatórios.
- Projetos com tabela, cadastro, detalhe, timeline e abas internas.
- Documentos com upload validado, bloqueio de vídeo, categorias, validade e preview.
- Documentos Oficiais com editor, modelos, logo própria, PDF/TXT, autorizações, termos e recibos.
- Cronograma com aulas iniciais do Reféns, calendário, presença e plano de aula.
- Financeiro com rubricas, despesas, comprovantes e resumo.
- Equipe com funções, contratos e pagamentos.
- Participantes com autorizações e presença.
- Mídia com fotos/imagens e links externos de vídeos/pastas.
- Relatórios com gerador de PDF e opções de dossiê.
- Configurações completas por módulo, com bloqueios para configurações sensíveis.

## Relatórios

O módulo `Relatórios` gera PDF no navegador com jsPDF. O fluxo está pronto para evoluir para:

- salvar no bucket `reports`;
- incluir fotos/documentos reais;
- exportar ZIP;
- exportar CSV/XLSX;
- gerar DOCX se necessário.

## Segurança

- Next.js 16 usa `src/proxy.ts` para o controle inicial de sessão.
- A autorização real também deve ser validada em cada Server Action antes de gravar dados.
- O SQL em `supabase/schema.sql` habilita RLS nas tabelas.
- Storage bloqueia upload direto de vídeos por policy e a UI valida extensões.

## Próximas melhorias

- Trocar queries seed por queries reais no Supabase.
- Implementar mutations completas com auditoria.
- Adicionar upload real para Storage.
- Salvar PDFs gerados no bucket `reports`.
- Persistir documentos oficiais no bucket `official-documents`.
- Implementar logs de atividade na UI.
- Adicionar testes end-to-end para fluxos críticos.
