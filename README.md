# Agendamento — Plataforma Whitelabel de Agendamento de Serviços

MVP de agendamento multi-segmento (saúde, beleza, qualquer serviço). Cada estabelecimento opera via slug único com engine de disponibilidade própria.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Banco**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: NextAuth.js (credential provider)
- **Deploy**: Vercel
- **Estilo**: Tailwind CSS

## Setup local

### 1. Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente (ou conta Supabase)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### 4. Rodar migrations
```bash
npx prisma migrate dev --name init
```

### 5. Popular banco com dados de exemplo
```bash
npm run db:seed
```

### 6. Iniciar servidor de desenvolvimento
```bash
npm run dev
```

Acesse `http://localhost:3000`

## Credenciais do seed

| Campo | Valor |
|---|---|
| URL pública | `http://localhost:3000/dra-ana-paula` |
| Admin email | `admin@draanapaula.com` |
| Admin senha | `admin123` |

## Estrutura do projeto

```
app/
  [slug]/           → Fluxo público do paciente
    page.tsx        → Lista de serviços
    agendar/        → Seleção de data e horário
    confirmar/      → Dados do paciente
    sucesso/        → Confirmação + código de cancelamento
    cancelar/       → Cancelamento por código
  admin/            → Painel protegido
    login/          → Autenticação
    agenda/         → Agenda do dia
    servicos/       → CRUD de serviços
    horarios/       → Configuração de funcionamento
  api/
    auth/           → NextAuth
    [slug]/         → API pública (availability, bookings)
    admin/          → API protegida (agenda, services, availability-rules)
lib/
  prisma.ts         → Client singleton
  availability.ts   → Engine de slots
  auth.ts           → Config NextAuth
  utils.ts          → Helpers
prisma/
  schema.prisma     → Schema do banco
  seed.ts           → Dados de exemplo
```

## Deploy (Vercel + Supabase)

1. Criar projeto no [Supabase](https://supabase.com) e copiar `DATABASE_URL`
2. Criar projeto no [Vercel](https://vercel.com) conectando ao repositório GitHub
3. Adicionar variáveis de ambiente no Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (gerar com `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (URL do projeto no Vercel)
4. Rodar `npx prisma migrate deploy` após o primeiro deploy

## Como criar um novo estabelecimento

Por enquanto via script ou Prisma Studio:

```bash
npm run db:studio
```

Criar registro em `Establishment` + `User` + `Service` + `Availability`.

> Super Admin (interface de cadastro de clientes) é a Fase 3 do produto.
test
