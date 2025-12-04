-- Supabase schema for LDC Capital (Wealth Planning + CMS)
-- Run with Supabase CLI (example): supabase db remote commit --file scripts/supabase-schema.sql
-- Uses pgcrypto for UUIDs and moddatetime to keep updatedAt in sync.

create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- Helper roles based on Supabase Auth user_metadata.role
create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('ADMIN', 'EDITOR'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN', false);
$$;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table if not exists public."User" (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  password text,
  emailVerified timestamptz,
  image text,
  role text not null default 'USER',
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);

create trigger handle_user_updated_at
  before update on public."User"
  for each row execute procedure moddatetime(updatedAt);

alter table public."User" enable row level security;

create policy "user_select_self_or_admin"
  on public."User"
  for select
  using (auth.uid() = id or is_admin());

create policy "user_update_self_or_admin"
  on public."User"
  for update
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());

create policy "user_insert_admin"
  on public."User"
  for insert
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public."Category" (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);

create trigger handle_category_updated_at
  before update on public."Category"
  for each row execute procedure moddatetime(updatedAt);

alter table public."Category" enable row level security;

create policy "category_select_public"
  on public."Category"
  for select
  using (true);

create policy "category_write_admin_editor"
  on public."Category"
  for all
  using (is_admin_or_editor())
  with check (is_admin_or_editor());

-- ---------------------------------------------------------------------------
-- Blog posts
-- ---------------------------------------------------------------------------
create table if not exists public."BlogPost" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  summary text,
  category text not null,
  cover text,
  published boolean not null default false,
  readingTime text,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  publishedAt timestamptz,
  authorId uuid references public."User"(id) on delete set null,
  authorDisplayName text,
  categoryId uuid references public."Category"(id) on delete set null
);

create trigger handle_blogpost_updated_at
  before update on public."BlogPost"
  for each row execute procedure moddatetime(updatedAt);

create index if not exists blogpost_published_idx on public."BlogPost"(published, publishedAt);
create index if not exists blogpost_category_idx on public."BlogPost"(category);

alter table public."BlogPost" enable row level security;

create policy "blog_public_read_published"
  on public."BlogPost"
  for select
  using (published = true);

create policy "blog_admin_editor_read"
  on public."BlogPost"
  for select
  using (is_admin_or_editor());

create policy "blog_admin_editor_write"
  on public."BlogPost"
  for insert, update, delete
  using (is_admin_or_editor())
  with check (is_admin_or_editor());

-- ---------------------------------------------------------------------------
-- Materials (downloads)
-- ---------------------------------------------------------------------------
create table if not exists public."Material" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  content text,
  category text not null,
  type text not null,
  cover text,
  fileUrl text,
  fileName text,
  fileSize text,
  pages integer,
  published boolean not null default false,
  featured boolean not null default false,
  downloadCount integer not null default 0,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  publishedAt timestamptz,
  authorId uuid references public."User"(id) on delete set null
);

create trigger handle_material_updated_at
  before update on public."Material"
  for each row execute procedure moddatetime(updatedAt);

create index if not exists material_published_idx on public."Material"(published, featured, publishedAt);
create index if not exists material_category_idx on public."Material"(category);

alter table public."Material" enable row level security;

create policy "material_public_read_published"
  on public."Material"
  for select
  using (published = true);

create policy "material_admin_editor_read"
  on public."Material"
  for select
  using (is_admin_or_editor());

create policy "material_admin_editor_write"
  on public."Material"
  for insert, update, delete
  using (is_admin_or_editor())
  with check (is_admin_or_editor());

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
create table if not exists public."Client" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  phone text,
  notes text,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);

create trigger handle_client_updated_at
  before update on public."Client"
  for each row execute procedure moddatetime(updatedAt);

alter table public."Client" enable row level security;

create policy "client_admin_editor_all"
  on public."Client"
  for all
  using (is_admin_or_editor())
  with check (is_admin_or_editor());

-- ---------------------------------------------------------------------------
-- Leads (Form submissions)
-- ---------------------------------------------------------------------------
create table if not exists public."Lead" (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text,
  patrimonio text,
  origem text,
  origemFormulario text not null default 'Home',
  ip text,
  userAgent text,
  status text not null default 'Novo',
  observacoes text,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);

create trigger handle_lead_updated_at
  before update on public."Lead"
  for each row execute procedure moddatetime(updatedAt);

create index if not exists lead_email_idx on public."Lead"(email);
create index if not exists lead_status_idx on public."Lead"(status);
create index if not exists lead_created_at_idx on public."Lead"(createdAt);

alter table public."Lead" enable row level security;

-- Permite inserção pública (para formulários)
create policy "lead_public_insert"
  on public."Lead"
  for insert
  with check (true);

-- Apenas admins/editores podem ler e atualizar
create policy "lead_admin_editor_all"
  on public."Lead"
  for all
  using (is_admin_or_editor())
  with check (is_admin_or_editor());

-- ---------------------------------------------------------------------------
-- Wealth planning scenarios
-- ---------------------------------------------------------------------------
create table if not exists public."WealthPlanningScenario" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  clientId uuid not null references public."Client"(id) on delete cascade,
  consultantId uuid not null references public."User"(id),
  status text not null default 'draft',
  personalData jsonb not null,
  financialData jsonb not null,
  portfolio jsonb not null,
  assets jsonb not null,
  projects jsonb not null,
  debts jsonb not null,
  otherRevenues jsonb not null,
  assumptions jsonb not null,
  calculatedResults jsonb,
  pdfUrl text,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);

create trigger handle_wpscenario_updated_at
  before update on public."WealthPlanningScenario"
  for each row execute procedure moddatetime(updatedAt);

create index if not exists wpscenario_client_idx on public."WealthPlanningScenario"(clientId);
create index if not exists wpscenario_consultant_idx on public."WealthPlanningScenario"(consultantId);
create index if not exists wpscenario_status_idx on public."WealthPlanningScenario"(status);

alter table public."WealthPlanningScenario" enable row level security;

create policy "wp_admin_all"
  on public."WealthPlanningScenario"
  for all
  using (is_admin())
  with check (is_admin());

create policy "wp_consultant_read_write_own"
  on public."WealthPlanningScenario"
  for select, update, delete
  using (is_admin_or_editor() and auth.uid() = consultantId)
  with check (is_admin_or_editor() and auth.uid() = consultantId);

create policy "wp_consultant_insert_own"
  on public."WealthPlanningScenario"
  for insert
  with check (is_admin() or (is_admin_or_editor() and auth.uid() = consultantId));

-- ---------------------------------------------------------------------------
-- Scenario comparisons (optional helper)
-- ---------------------------------------------------------------------------
create table if not exists public."ScenarioComparison" (
  id uuid primary key default gen_random_uuid(),
  scenarioIds uuid[] not null,
  comparisonData jsonb not null,
  createdAt timestamptz not null default now()
);

alter table public."ScenarioComparison" enable row level security;

create policy "scenario_comparison_admin_editor_all"
  on public."ScenarioComparison"
  for all
  using (is_admin_or_editor())
  with check (is_admin_or_editor());

-- ---------------------------------------------------------------------------
-- Example queries (replace values accordingly)
-- ---------------------------------------------------------------------------
-- Insert client
-- insert into public."Client" (name, email, phone, notes) values ('Cliente Demo', 'cliente@exemplo.com', '11999999999', 'Observacoes do cliente');

-- Update client
-- update public."Client" set notes = 'Atualizado via script', updatedAt = now() where id = '<client_uuid>';

-- Delete client
-- delete from public."Client" where id = '<client_uuid>';

-- Insert scenario (jsonb payloads keep structure used by the app)
-- insert into public."WealthPlanningScenario" (
--   title, clientId, consultantId, status,
--   personalData, financialData, portfolio, assets, projects, debts, otherRevenues, assumptions
-- ) values (
--   'Cenario Demo',
--   '<client_uuid>',
--   '<consultant_uuid>',
--   'draft',
--   '{"name":"Cliente Demo","age":30,"retirementAge":60,"lifeExpectancy":85,"maritalStatus":"Solteiro","suitability":"Moderado","dependents":[]}'::jsonb,
--   '{"monthlyFamilyExpense":10000,"desiredMonthlyRetirementIncome":40000,"monthlySavings":5000,"expectedMonthlyRetirementRevenues":0,"investmentObjective":"Acumular Recursos"}'::jsonb,
--   '{"total":1000000,"taxConsideration":"Sem considerar I.R","immediateLiquidityNeeds":0.1,"assets":[{"asset":"Carteira","value":1000000,"percentage":100,"cdiReturn":0.097}]}'::jsonb,
--   '[]'::jsonb,
--   '[]'::jsonb,
--   '[]'::jsonb,
--   '[]'::jsonb,
--   '{"annualInflation":0.035,"annualCDI":0.097,"retirementReturnNominal":0.097,"realRetirementReturn":0.0599}'::jsonb
-- );

-- Update scenario status
-- update public."WealthPlanningScenario" set status = 'published', updatedAt = now() where id = '<scenario_uuid>';

-- Delete scenario
-- delete from public."WealthPlanningScenario" where id = '<scenario_uuid>';

