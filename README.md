# 💼 Portfolio Hub

**Live:** [pedrosecio.dev](https://pedrosecio.dev)

**[🇬🇧 English](#-english)** · **[🇧🇷 Português](#-português)**

---

## 🇬🇧 English

> Personal portfolio & CMS — built to ship fast, edit live, and look good doing it.

A full-stack developer portfolio with a built-in admin panel, multi-language content (🇬🇧 EN · 🇧🇷 PT · 🇪🇸 ES), live GitHub activity, and project data synced straight from GitHub repositories.

### ✨ Features

- 🧩 **Editable pages & sections** — a sidebar/accordion admin dashboard lets you manage every page of the site (Home, About, Projects, Blog, Contact), add brand-new pages, and add or edit sections inside any of them; fixed sections can be shown/hidden, custom ones can be added or removed freely
- 🌐 **Multi-language** — every piece of content (sections, projects, timeline, testimonials, blog) is stored per-language with automatic fallback
- 🐙 **GitHub-powered** — pinned/featured repositories and contribution activity are pulled straight from your GitHub account (personal and/or organization)
- 📊 **Career timeline** — work experience and education, filterable and orderable
- 📝 **Blog & case studies** — Markdown-based writing with image/video embeds, case studies live inside the Projects page where they're shown
- 💬 **Testimonials, certifications & tech stack** — all editable, all optional
- 🤖 **AI project summaries** — one-sentence "what this does" blurbs (EN/PT/ES) auto-generated per project with Cloudflare Workers AI (Llama 3.1), free, no API key
- ✉️ **Contact form & inbox** — spam-protected (honeypot) public form, messages land in an admin inbox panel
- 🔐 **Account security** — password change flow gated by a second factor (one-time code emailed to the account)
- 🖥️ **Interactive terminal** — a playful `whoami`-style terminal widget on the homepage, fully localized
- 🌓 **Light/dark theme** — system-aware with manual toggle
- 🎞️ **Smooth page transitions** — quick, non-blocking fade/slide between routes
- 📈 **First-party analytics** — no third-party trackers
- ⚡ **Edge-deployed** — ships to Cloudflare via Nitro, with Workers AI

### 🛠️ Tech stack

| Layer          | Tech                                             |
| -------------- | ------------------------------------------------ |
| Framework      | [TanStack Start](https://tanstack.com/start) + React 19 |
| Language       | TypeScript                                        |
| Styling        | Tailwind CSS                                      |
| Data & Auth    | [Supabase](https://supabase.com) (Postgres, Auth, Storage) |
| State/data     | TanStack Query                                    |
| Deployment     | Cloudflare Workers (via Nitro)                    |
| Package manager| Bun / npm                                         |

### 🚀 Getting started

#### Prerequisites

- [Node.js](https://nodejs.org) 20+
- A [Supabase](https://supabase.com) project (free tier works fine)

#### 1. Clone & install

```sh
git clone <this-repository-url>
cd portfolio-hub
npm install
```

#### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```sh
cp .env.example .env
```

| Variable                         | Description                                   |
| --------------------------------- | ---------------------------------------------- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL`               | Your Supabase project URL           |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY`      | Service role key (server-side only, **never expose client-side**) |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | Project reference ID                |
| `GITHUB_TOKEN`                     | GitHub personal access token, used server-side to sync repos & contribution activity (see below) |
| `VITE_ADMIN_PATH`                  | The URL segment where the admin panel lives — pick your own secret value, never commit it |

#### 3. Run the database migrations

```sh
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

#### 4. Start the dev server

```sh
npm run dev
```

Visit `http://localhost:3000` 🎉

### 📜 Available scripts

| Command             | What it does                          |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Start the local dev server             |
| `npm run build`      | Production build                       |
| `npm run preview`    | Preview the production build locally   |
| `npm run lint`       | Run ESLint                             |
| `npm run format`     | Format the codebase with Prettier      |

### 📁 Project structure

```
src/
├── components/
│   ├── admin/     # Admin panel (pages, sections, projects, settings, media, analytics)
│   ├── site/      # Public-facing site components
│   └── ui/        # Shared UI primitives
├── lib/           # i18n, data fetching, helpers
├── routes/        # File-based routes (TanStack Router)
└── integrations/  # Supabase client & generated types
supabase/
└── migrations/    # Database schema & seed data
```

### 🔒 Admin access

The admin panel is protected by Supabase Auth — only accounts flagged as admins in the database can sign in and edit content. Its URL is not hardcoded or published: it's whatever single path segment you set as `VITE_ADMIN_PATH` in your environment (e.g. `VITE_ADMIN_PATH=my-secret-path` → the panel lives at `/my-secret-path`); any other path just renders the normal 404 page, so the admin URL isn't discoverable from the source or a page scan. It's organized as a sidebar with an accordion per site page (Home, About, Projects, Blog, Contact, plus any custom pages you create); each page node expands into its own sections and content types, and a "Pages" panel lets you add whole new pages that are automatically added to site navigation.

### 🐙 Connecting GitHub (step by step)

The homepage's featured projects and contribution graph are pulled live from GitHub. This works for your **personal account** and, optionally, for repositories owned by an **organization** you belong to.

1. **Generate a personal access token**
   - Go to [github.com/settings/tokens](https://github.com/settings/tokens) → *Generate new token (classic)*.
   - Scopes needed: `public_repo` and `read:user`. If you want it to also pull **private organization repos**, use a **fine-grained token** with read access to that org's repositories instead, or grant the classic token the `repo` scope and make sure it's authorized for the org (GitHub asks you to explicitly approve classic tokens for each SSO-protected org under *Configure SSO*).
   - Copy the token — you won't be able to see it again.
2. **Add the token to the server environment**
   - Locally: put it in `.env` as `GITHUB_TOKEN=ghp_xxx` and restart `npm run dev`.
   - In production (Cloudflare/your deploy target): add `GITHUB_TOKEN` as a secret/environment variable there too — it is **never** sent to the browser, it's read server-side only.
3. **Set your GitHub username (and organization, optional)**
   - Sign in to your admin panel (the path set in `VITE_ADMIN_PATH`) → **Configurações** (Settings).
   - Fill in **Usuário do GitHub** with your personal username.
   - If you also want repos from an organization you belong to, fill in **Organização do GitHub** with the org's login name.
   - Click **Salvar**.
4. **Run the sync**
   - Still in Settings, click **Sincronizar GitHub**.
   - This pulls your public repos (and the org's public repos, if set) into the Projects data, and — if `GITHUB_TOKEN` is present — your contribution calendar into the homepage activity graph.
   - The Settings panel will show a warning banner if the server has no token configured, or if you haven't set a username yet.
5. **Keep it fresh**
   - Sync is manual (click the button) — trigger it again any time you push new repos or want updated contribution data. There's no cron job by default.

Without a token, sync still fetches public repositories (rate-limited to ~60 requests/hour per IP), but skips the contribution calendar, since that requires GitHub's authenticated GraphQL API.

---

## 🇧🇷 Português

> Portfólio pessoal & CMS — feito para publicar rápido, editar ao vivo e ficar bonito fazendo isso.

Um portfólio full-stack com painel administrativo embutido, conteúdo multi-idioma (🇬🇧 EN · 🇧🇷 PT · 🇪🇸 ES), atividade do GitHub ao vivo e dados de projetos sincronizados diretamente de repositórios do GitHub.

### ✨ Funcionalidades

- 🧩 **Páginas e seções editáveis** — um painel admin com menu lateral em acordeão permite gerenciar todas as páginas do site (Home, Sobre, Projetos, Blog, Contato), adicionar páginas novas do zero e criar ou editar seções dentro de qualquer uma delas; seções fixas podem ser mostradas/ocultadas, seções customizadas podem ser adicionadas ou removidas livremente
- 🌐 **Multi-idioma** — todo o conteúdo (seções, projetos, linha do tempo, depoimentos, blog) é armazenado por idioma com fallback automático
- 🐙 **Integrado ao GitHub** — repositórios em destaque e atividade de contribuição são puxados direto da sua conta do GitHub (pessoal e/ou de organização)
- 📊 **Linha do tempo de carreira** — experiência profissional e formação acadêmica, filtráveis e ordenáveis
- 📝 **Blog e estudos de caso** — escrita em Markdown com imagens/vídeos incorporados; estudos de caso ficam dentro da página de Projetos, onde são exibidos
- 💬 **Depoimentos, certificações e stack técnica** — tudo editável, tudo opcional
- 🤖 **Resumos de projeto com IA** — uma frase "o que isso faz" (EN/PT/ES) gerada automaticamente por projeto com Cloudflare Workers AI (Llama 3.1), grátis, sem API key
- ✉️ **Formulário de contato & caixa de entrada** — formulário público protegido contra spam (honeypot), mensagens caem num painel de inbox no admin
- 🔐 **Segurança da conta** — troca de senha protegida por segundo fator (código enviado por e-mail para a própria conta)
- 🖥️ **Terminal interativo** — um widget de terminal estilo `whoami` na home, totalmente traduzido
- 🌓 **Tema claro/escuro** — segue o sistema, com alternância manual
- 🎞️ **Transições suaves entre páginas** — rápidas, sem travar a navegação
- 📈 **Analytics próprio** — sem rastreadores de terceiros
- ⚡ **Deploy na borda (edge)** — publicado no Cloudflare via Nitro, com Workers AI

### 🛠️ Stack técnica

| Camada           | Tecnologia                                        |
| ----------------- | -------------------------------------------------- |
| Framework        | [TanStack Start](https://tanstack.com/start) + React 19 |
| Linguagem        | TypeScript                                          |
| Estilização      | Tailwind CSS                                        |
| Dados & Auth     | [Supabase](https://supabase.com) (Postgres, Auth, Storage) |
| Estado/dados     | TanStack Query                                      |
| Deploy           | Cloudflare Workers (via Nitro)                      |
| Gerenciador de pacotes | Bun / npm                                     |

### 🚀 Como começar

#### Pré-requisitos

- [Node.js](https://nodejs.org) 20+
- Um projeto [Supabase](https://supabase.com) (o plano gratuito é suficiente)

#### 1. Clonar e instalar

```sh
git clone <url-deste-repositorio>
cd portfolio-hub
npm install
```

#### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha com as credenciais do seu projeto Supabase:

```sh
cp .env.example .env
```

| Variável                          | Descrição                                      |
| ---------------------------------- | ------------------------------------------------ |
| `SUPABASE_URL` / `VITE_SUPABASE_URL`               | URL do seu projeto Supabase          |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública anon/publishable |
| `SUPABASE_SERVICE_ROLE_KEY`      | Chave service role (somente servidor, **nunca exponha no client**) |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | ID de referência do projeto           |
| `GITHUB_TOKEN`                     | Token de acesso pessoal do GitHub, usado no servidor para sincronizar repositórios e atividade de contribuição (veja abaixo) |
| `VITE_ADMIN_PATH`                  | O segmento de URL onde o painel admin fica — escolha seu próprio valor secreto, nunca faça commit dele |

#### 3. Rodar as migrações do banco

```sh
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

#### 4. Iniciar o servidor de desenvolvimento

```sh
npm run dev
```

Acesse `http://localhost:3000` 🎉

### 📜 Scripts disponíveis

| Comando               | O que faz                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`          | Inicia o servidor de desenvolvimento local |
| `npm run build`        | Build de produção                        |
| `npm run preview`      | Preview do build de produção localmente  |
| `npm run lint`         | Roda o ESLint                            |
| `npm run format`       | Formata o código com Prettier            |

### 📁 Estrutura do projeto

```
src/
├── components/
│   ├── admin/     # Painel admin (páginas, seções, projetos, configurações, mídia, analytics)
│   ├── site/      # Componentes públicos do site
│   └── ui/        # Primitivas de UI compartilhadas
├── lib/           # i18n, busca de dados, utilitários
├── routes/        # Rotas baseadas em arquivo (TanStack Router)
└── integrations/  # Cliente Supabase e tipos gerados
supabase/
└── migrations/    # Schema do banco de dados e dados iniciais (seed)
```

### 🔒 Acesso ao admin

O painel administrativo é protegido pelo Supabase Auth — só contas marcadas como admin no banco conseguem entrar e editar conteúdo. A URL não é fixa no código nem divulgada: é o segmento que você definir em `VITE_ADMIN_PATH` no ambiente (ex.: `VITE_ADMIN_PATH=meu-caminho-secreto` → o painel fica em `/meu-caminho-secreto`); qualquer outro caminho simplesmente mostra a página 404 normal, então a URL do admin não é descobrível pelo código-fonte nem por uma varredura de páginas. Ele é organizado como um menu lateral com um acordeão por página do site (Home, Sobre, Projetos, Blog, Contato, além de qualquer página customizada que você criar); cada página se expande nas suas próprias seções e tipos de conteúdo, e um painel de "Páginas" permite adicionar páginas inteiramente novas, que já entram automaticamente na navegação do site.

### 🐙 Conectando o GitHub (passo a passo)

Os projetos em destaque e o gráfico de contribuições da home são puxados ao vivo do GitHub. Isso funciona tanto para a sua **conta pessoal** quanto, opcionalmente, para repositórios de uma **organização** da qual você faça parte.

1. **Gere um personal access token**
   - Acesse [github.com/settings/tokens](https://github.com/settings/tokens) → *Generate new token (classic)*.
   - Escopos necessários: `public_repo` e `read:user`. Se você também quiser puxar **repositórios privados de uma organização**, use um **fine-grained token** com acesso de leitura aos repositórios dessa org, ou dê ao token clássico o escopo `repo` e autorize-o explicitamente para a org (o GitHub pede aprovação manual de tokens clássicos para orgs protegidas por SSO, em *Configure SSO*).
   - Copie o token — ele não pode ser visualizado novamente depois.
2. **Adicione o token nas variáveis de ambiente do servidor**
   - Localmente: coloque em `.env` como `GITHUB_TOKEN=ghp_xxx` e reinicie o `npm run dev`.
   - Em produção (Cloudflare ou onde você fizer o deploy): adicione `GITHUB_TOKEN` também como secret/variável de ambiente lá — ele **nunca** é enviado ao navegador, é lido somente no servidor.
3. **Configure seu usuário do GitHub (e organização, opcional)**
   - Entre no seu painel admin (o caminho definido em `VITE_ADMIN_PATH`) → **Configurações**.
   - Preencha **Usuário do GitHub** com seu usuário pessoal.
   - Se também quiser repositórios de uma organização da qual você participa, preencha **Organização do GitHub** com o login da org.
   - Clique em **Salvar**.
4. **Rode a sincronização**
   - Ainda em Configurações, clique em **Sincronizar GitHub**.
   - Isso puxa seus repositórios públicos (e os públicos da org, se configurada) para os dados de Projetos e, se o `GITHUB_TOKEN` estiver presente, seu calendário de contribuições para o gráfico de atividade da home.
   - O painel de Configurações mostra um aviso se o servidor não tiver token configurado, ou se você ainda não tiver definido um usuário.
5. **Mantenha atualizado**
   - A sincronização é manual (clique no botão) — dispare novamente sempre que publicar novos repositórios ou quiser atualizar os dados de contribuição. Não há job automático (cron) por padrão.

Sem o token, a sincronização ainda busca repositórios públicos (com limite de ~60 requisições/hora por IP), mas pula o calendário de contribuições, já que ele exige a API GraphQL autenticada do GitHub.

---

<p align="center">Built with TypeScript, React and a lot of ☕ · Feito com TypeScript, React e muito café</p>
