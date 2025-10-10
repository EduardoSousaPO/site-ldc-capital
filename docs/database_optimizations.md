# Otimizações de Banco de Dados (Supabase)

## 📅 Data de Aplicação
**10 de Outubro de 2025**

## 🎯 Objetivo
Simplificar operações de CRUD eliminando a necessidade de passar campos automáticos (ID, timestamps) nas APIs, reduzindo erros 500 e melhorando a experiência do desenvolvedor.

---

## ✅ Migrações Aplicadas

### 1️⃣ `setup_blogpost_auto_fields`
**Tabela: BlogPost**

```sql
-- Habilitar extensão para UUIDs
create extension if not exists pgcrypto;

-- Configurar defaults automáticos
alter table "BlogPost"
  alter column "id" set default gen_random_uuid(),
  alter column "createdAt" set default now(),
  alter column "updatedAt" set default now();

-- Criar função para atualizar updatedAt automaticamente
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end $$;

-- Criar trigger
drop trigger if exists blogpost_set_updated_at on "BlogPost";
create trigger blogpost_set_updated_at
  before update on "BlogPost"
  for each row execute procedure set_updated_at();
```

**Resultado:**
- ✅ ID gerado automaticamente via `gen_random_uuid()`
- ✅ `createdAt` definido automaticamente em INSERT
- ✅ `updatedAt` atualizado automaticamente em UPDATE

---

### 2️⃣ `setup_material_auto_fields`
**Tabela: Material**

```sql
alter table "Material"
  alter column "id" set default gen_random_uuid(),
  alter column "createdAt" set default now(),
  alter column "updatedAt" set default now();

drop trigger if exists material_set_updated_at on "Material";
create trigger material_set_updated_at
  before update on "Material"
  for each row execute procedure set_updated_at();
```

**Resultado:**
- ✅ Mesma estrutura de auto-fields do BlogPost

---

### 3️⃣ `setup_useful_defaults`
**Defaults de Negócio**

```sql
-- BlogPost
alter table "BlogPost"
  alter column "published" set default false,
  alter column "category" set default 'Geral';

-- Material
alter table "Material"
  alter column "published" set default false,
  alter column "featured" set default false,
  alter column "downloadCount" set default 0;
```

**Resultado:**
- ✅ Posts criados como rascunho por padrão
- ✅ Categoria padrão "Geral" se não especificada
- ✅ Materiais não publicados/não destacados por padrão
- ✅ Contador de downloads inicia em 0

---

### 4️⃣ `setup_performance_indexes`
**Índices para Performance**

```sql
create index if not exists blogpost_slug_idx on "BlogPost"(lower("slug"));
create index if not exists material_slug_idx on "Material"(lower("slug"));
```

**Resultado:**
- ✅ Buscas case-insensitive por slug otimizadas
- ✅ Queries do tipo `WHERE lower(slug) = 'exemplo'` usam índice

---

### 5️⃣ `setup_user_category_auto_fields`
**Tabelas: User e Category**

```sql
-- User
alter table "User"
  alter column "id" set default gen_random_uuid(),
  alter column "createdAt" set default now(),
  alter column "updatedAt" set default now();

drop trigger if exists user_set_updated_at on "User";
create trigger user_set_updated_at
  before update on "User"
  for each row execute procedure set_updated_at();

-- Category
alter table "Category"
  alter column "id" set default gen_random_uuid(),
  alter column "createdAt" set default now(),
  alter column "updatedAt" set default now();

drop trigger if exists category_set_updated_at on "Category";
create trigger category_set_updated_at
  before update on "Category"
  for each row execute procedure set_updated_at();
```

**Resultado:**
- ✅ Todas as tabelas principais com auto-fields
- ✅ Consistência em todo o banco de dados

---

## 📊 Verificação das Configurações

### Defaults Aplicados

| Tabela    | Campo          | Default              | Nullable |
|-----------|----------------|----------------------|----------|
| BlogPost  | id             | gen_random_uuid()    | NO       |
| BlogPost  | createdAt      | now()                | NO       |
| BlogPost  | updatedAt      | now()                | NO       |
| BlogPost  | published      | false                | NO       |
| BlogPost  | category       | 'Geral'              | NO       |
| Material  | id             | gen_random_uuid()    | NO       |
| Material  | createdAt      | now()                | NO       |
| Material  | updatedAt      | now()                | NO       |
| Material  | published      | false                | NO       |
| Material  | featured       | false                | NO       |
| Material  | downloadCount  | 0                    | NO       |
| User      | id             | gen_random_uuid()    | NO       |
| User      | createdAt      | now()                | NO       |
| User      | updatedAt      | now()                | NO       |
| Category  | id             | gen_random_uuid()    | NO       |
| Category  | createdAt      | now()                | NO       |
| Category  | updatedAt      | now()                | NO       |

### Triggers Ativos

| Trigger                    | Tabela   | Timing | Event  |
|----------------------------|----------|--------|--------|
| blogpost_set_updated_at    | BlogPost | BEFORE | UPDATE |
| material_set_updated_at    | Material | BEFORE | UPDATE |
| user_set_updated_at        | User     | BEFORE | UPDATE |
| category_set_updated_at    | Category | BEFORE | UPDATE |

### Índices Criados

| Índice              | Tabela   | Definição                      |
|---------------------|----------|--------------------------------|
| blogpost_slug_idx   | BlogPost | lower(slug)                    |
| material_slug_idx   | Material | lower(slug)                    |

---

## 🚀 Impacto nas APIs

### ✨ Antes (APIs enviavam tudo)
```typescript
await prisma.blogPost.create({
  data: {
    id: cuid(),                    // ❌ Não é mais necessário
    title: "Título",
    slug: "titulo",
    content: "...",
    createdAt: new Date(),         // ❌ Não é mais necessário
    updatedAt: new Date(),         // ❌ Não é mais necessário
    published: false,              // ❌ Não é mais necessário (default)
    category: "Geral",             // ❌ Não é mais necessário (default)
    authorId: userId
  }
});
```

### ✨ Depois (Apenas o essencial)
```typescript
await prisma.blogPost.create({
  data: {
    title: "Título",               // ✅ Obrigatório
    slug: "titulo",                // ✅ Obrigatório
    content: "...",                // ✅ Obrigatório
    authorId: userId               // ✅ Obrigatório
    // Tudo mais é automático! 🎉
  }
});
```

---

## 🎯 Benefícios

1. **Menos Erros 500**
   - Campos obrigatórios têm defaults
   - Eliminado erro `null value in column "updatedAt"`

2. **Código Mais Limpo**
   - APIs enviam apenas dados de negócio
   - Banco gerencia infraestrutura (IDs, timestamps)

3. **Performance**
   - Índices em slugs aceleram buscas
   - Triggers nativos (mais rápidos que código)

4. **Manutenibilidade**
   - Lógica centralizada no banco
   - Menos duplicação de código

5. **Consistência**
   - Mesma estrutura em todas as tabelas
   - Padrão único de auto-fields

---

## 🔄 Próximos Passos Recomendados

1. **Atualizar APIs** para remover campos redundantes
2. **Testar criação/edição** de posts e materiais
3. **Monitorar logs** para confirmar ausência de erros
4. **Documentar** para novos desenvolvedores

---

## 📝 Notas Técnicas

- **Extensão pgcrypto**: Necessária para `gen_random_uuid()`
- **Função set_updated_at()**: Reutilizada por todas as tabelas
- **Triggers BEFORE UPDATE**: Executam antes de salvar, garantindo `updatedAt` atualizado
- **Índices case-insensitive**: Usando `lower()` para buscas sem distinção de maiúsculas

---

## ✅ Status
**Todas as migrações foram aplicadas com sucesso em 10/10/2025**

🎉 Banco de dados otimizado e pronto para produção!

