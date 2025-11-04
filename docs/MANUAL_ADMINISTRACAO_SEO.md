# 📚 Manual de Administração SEO - LDC Capital

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Objetivo:** Guia completo para administrar e aproveitar todas as melhorias de SEO implementadas no site

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configurações Iniciais](#configurações-iniciais)
3. [Google Analytics 4](#google-analytics-4)
4. [Google Search Console](#google-search-console)
5. [Structured Data (Schema.org)](#structured-data-schemaorg)
6. [Metadata e Open Graph](#metadata-e-open-graph)
7. [Sitemap Dinâmico](#sitemap-dinâmico)
8. [Robots.txt](#robotstxt)
9. [Breadcrumbs](#breadcrumbs)
10. [Monitoramento e Métricas](#monitoramento-e-métricas)
11. [Troubleshooting](#troubleshooting)
12. [Checklist de Manutenção](#checklist-de-manutenção)

---

## 🎯 Visão Geral

Este manual explica como administrar todas as melhorias de SEO implementadas no site LDC Capital. As melhorias incluem:

✅ **Structured Data (Schema.org)** - Rich snippets para Google  
✅ **Google Analytics 4** - Tracking de visitantes e conversões  
✅ **Google Tag Manager** - Gerenciamento de tags  
✅ **Metadata Completo** - Open Graph, Twitter Cards, Canonical URLs  
✅ **Sitemap Dinâmico** - Atualização automática  
✅ **Robots.txt Dinâmico** - Controle de indexação  
✅ **Breadcrumbs** - Navegação e SEO  

---

## ⚙️ Configurações Iniciais

### 1. Variáveis de Ambiente

As configurações de SEO estão centralizadas em `src/lib/seo-config.ts`. Para personalizar:

**Arquivo:** `site-ldc/src/lib/seo-config.ts`

```typescript
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br",
  // ... outras configurações
};
```

**Variáveis de Ambiente Necessárias:**

Crie ou atualize o arquivo `.env.local` (ou `.env.production` para produção):

```env
# URL do site (sem barra no final)
NEXT_PUBLIC_SITE_URL=https://ldccapital.com.br

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Google Tag Manager (opcional)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### 2. Verificar Configurações da Empresa

Edite `src/lib/seo-config.ts` para atualizar informações da empresa:

```typescript
company: {
  name: "LDC Capital Consultoria de Investimentos",
  cnpj: "58.321.323/0001-67",
  contact: {
    email: "contato@ldccapital.com.br",
    phone: "+55-51-98930-1511",
  },
  // ... endereço, redes sociais, etc.
}
```

---

## 📊 Google Analytics 4

### Configuração Inicial

1. **Criar Conta no Google Analytics**
   - Acesse: https://analytics.google.com
   - Crie uma propriedade GA4
   - Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

2. **Adicionar ao Site**
   - Adicione no `.env.local`:
     ```env
     NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
     ```
   - O Analytics será carregado automaticamente em todas as páginas

### Eventos de Conversão

Os seguintes eventos são rastreados automaticamente:

- **Formulário de Lead** - Quando alguém preenche o formulário na home
- **Formulário de Contato** - Quando alguém envia mensagem na página de contato
- **Download de Material** - Quando alguém baixa um material

### Verificar Funcionamento

1. Acesse o site em modo de desenvolvimento
2. Abra o DevTools (F12)
3. Vá para a aba **Network**
4. Filtre por "analytics" ou "gtag"
5. Você deve ver requisições sendo enviadas para o Google Analytics

### Dashboard Recomendado

No Google Analytics, monitore:

- **Público:** Usuários, sessões, taxa de rejeição
- **Aquisição:** Origem do tráfego (orgânico, direto, social)
- **Comportamento:** Páginas mais visitadas, tempo no site
- **Conversões:** Eventos configurados

---

## 🔍 Google Search Console

### Configuração Inicial

1. **Acessar Google Search Console**
   - URL: https://search.google.com/search-console
   - Faça login com sua conta Google

2. **Adicionar Propriedade**
   - Clique em "Adicionar propriedade"
   - Escolha "Prefixo de URL"
   - Digite: `https://ldccapital.com.br`

3. **Verificar Propriedade**
   
   **Opção 1: Tag HTML (Recomendado)**
   - O Google fornecerá uma tag HTML
   - Adicione no arquivo `src/app/layout.tsx` em `metadata.verification.google`:
     ```typescript
     verification: {
       google: "codigo-de-verificacao-aqui",
     },
     ```

   **Opção 2: Arquivo HTML**
   - Baixe o arquivo de verificação
   - Coloque em `public/google-verification.html`

4. **Enviar Sitemap**
   - Após verificação, vá em **Sitemaps**
   - Adicione: `https://ldccapital.com.br/sitemap.xml`
   - Clique em "Enviar"

### Monitoramento

Após alguns dias, você verá dados em:

- **Performance:** Queries, impressões, cliques, CTR, posição média
- **Cobertura:** Páginas indexadas, erros de indexação
- **Core Web Vitals:** LCP, FID, CLS
- **Melhorias:** Sugestões de otimização

### Ações Recomendadas

1. **Verificar Indexação**
   - Vá em **Cobertura**
   - Verifique se todas as páginas importantes estão indexadas
   - Corrija erros se houver

2. **Monitorar Performance**
   - Semanalmente, verifique queries e posições
   - Identifique palavras-chave que estão gerando tráfego
   - Otimize páginas com baixo CTR

3. **Core Web Vitals**
   - Monitore LCP, FID, CLS
   - Corrija problemas de performance identificados

---

## 🏗️ Structured Data (Schema.org)

### O Que Foi Implementado

O site possui os seguintes schemas:

1. **Organization Schema** - Home page (informações da empresa)
2. **Service Schema** - Página de consultoria
3. **Article Schema** - Posts do blog
4. **FAQPage Schema** - Home page (FAQ)
5. **BreadcrumbList Schema** - Todas as páginas (quando usar breadcrumbs)

### Localização dos Schemas

**Arquivo:** `src/components/StructuredData.tsx`

Cada página inclui seus schemas automaticamente:

- **Home:** `OrganizationSchema` + `FAQSchema`
- **Consultoria:** `ServiceSchema`
- **Blog Posts:** `ArticleSchema`
- **Outras:** Apenas `OrganizationSchema` (herdado do layout)

### Validar Structured Data

**Ferramenta:** Google Rich Results Test
- URL: https://search.google.com/test/rich-results
- Cole a URL da página
- Verifique se não há erros

**Alternativa:** Schema.org Validator
- URL: https://validator.schema.org/
- Cole a URL ou o código HTML

### Adicionar Novos Schemas

Para adicionar um novo tipo de schema:

1. Edite `src/components/StructuredData.tsx`
2. Crie uma nova função componente (ex: `ReviewSchema`)
3. Use na página desejada:

```tsx
import { ReviewSchema } from "@/components/StructuredData";

export default function MinhaPagina() {
  return (
    <>
      <ReviewSchema rating={5} reviewCount={10} />
      {/* resto do conteúdo */}
    </>
  );
}
```

---

## 🎨 Metadata e Open Graph

### Estrutura de Metadata

Cada página possui metadata completa:

```typescript
export const metadata: Metadata = {
  title: "Título da Página",
  description: "Descrição única (150-160 caracteres)",
  keywords: ["palavra-chave 1", "palavra-chave 2"],
  openGraph: {
    title: "Título para redes sociais",
    description: "Descrição para compartilhamento",
    url: "https://ldccapital.com.br/pagina",
    images: [{ url: "...", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Título para Twitter",
    images: ["..."],
  },
  alternates: {
    canonical: "https://ldccapital.com.br/pagina",
  },
};
```

### Como Atualizar Metadata de uma Página

**Exemplo:** Atualizar página de consultoria

1. Abra `src/app/consultoria/page.tsx`
2. Localize `export const metadata`
3. Atualize título, descrição, keywords:

```typescript
export const metadata: Metadata = {
  title: "Novo Título",
  description: "Nova descrição otimizada para SEO",
  keywords: ["nova", "palavra-chave"],
  // ... resto permanece igual
};
```

### Imagens Open Graph

**Tamanho Recomendado:** 1200x630px

**Localização:** `public/images/og-default.jpg`

**Para Criar Imagens OG:**

1. Use ferramentas como Canva, Figma ou Photoshop
2. Configure canvas com 1200x630px
3. Inclua:
   - Logo da LDC Capital
   - Título da página
   - Subtítulo ou descrição curta
   - Cores da marca (#98ab44, #262d3d)

**Imagens Específicas por Página:**

Para cada página importante, crie uma imagem OG:

- `og-home.jpg` - Home
- `og-consultoria.jpg` - Consultoria
- `og-blog.jpg` - Blog
- `og-contato.jpg` - Contato

E atualize no metadata:

```typescript
images: [{
  url: getOgImageUrl("/images/og-consultoria.jpg"),
  width: 1200,
  height: 630,
  alt: "LDC Capital - Consultoria",
}],
```

### Twitter Cards

O site usa `summary_large_image` por padrão. As imagens são as mesmas do Open Graph.

---

## 🗺️ Sitemap Dinâmico

### Como Funciona

O sitemap é gerado automaticamente em `src/app/sitemap.ts`:

- **Páginas Estáticas:** Incluídas manualmente
- **Posts do Blog:** Buscados do banco de dados automaticamente
- **Materiais:** Buscados do banco de dados automaticamente
- **Last Modified:** Atualizado automaticamente baseado na data de atualização

### Acessar Sitemap

URL: `https://ldccapital.com.br/sitemap.xml`

### Adicionar Nova Página Estática

Edite `src/app/sitemap.ts`:

```typescript
{
  url: `${baseUrl}/nova-pagina`,
  lastModified: new Date(),
  changeFrequency: "monthly", // "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority: 0.8, // 0.0 a 1.0
},
```

### Prioridades Recomendadas

- **Home:** 1.0
- **Consultoria:** 0.9
- **Blog/Materiais (listagem):** 0.8
- **Páginas importantes:** 0.7-0.8
- **Blog posts individuais:** 0.6
- **Páginas legais:** 0.5

### Change Frequency

- **Home, Blog:** `weekly`
- **Consultoria, Materiais:** `monthly`
- **Blog posts:** `yearly`
- **Páginas legais:** `yearly`

---

## 🤖 Robots.txt

### Como Funciona

O robots.txt é gerado dinamicamente em `src/app/robots.ts`.

### Configuração Atual

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /.data/
Disallow: /admin/
Disallow: /diagnostico-gratuito
```

### Modificar Robots.txt

Edite `src/app/robots.ts`:

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          // Adicione novas rotas que não devem ser indexadas
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### Testar Robots.txt

**Ferramenta:** Google Search Console → Robots.txt Tester
- URL: https://search.google.com/search-console/robots-testing-tool

---

## 🍞 Breadcrumbs

### Componente de Breadcrumbs

**Arquivo:** `src/components/Breadcrumbs.tsx`

### Como Usar

```tsx
import Breadcrumbs from "@/components/Breadcrumbs";

export default function MinhaPagina() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Consultoria", url: "/consultoria" },
          { name: "Metodologia", url: "/consultoria/metodologia" },
        ]}
      />
      {/* resto do conteúdo */}
    </>
  );
}
```

### Breadcrumbs com Schema

O componente automaticamente inclui o `BreadcrumbList` schema, melhorando SEO.

### Exemplo Visual

```
Home > Consultoria > Metodologia
```

---

## 📈 Monitoramento e Métricas

### KPIs Principais

1. **Tráfego Orgânico**
   - Google Analytics → Aquisição → Orgânico
   - Meta: Aumento de 20-30% mensal nos primeiros 3 meses

2. **Impressões e Cliques**
   - Google Search Console → Performance
   - Meta: CTR acima de 3% para palavras-chave principais

3. **Posições no Google**
   - Google Search Console → Performance
   - Meta: Top 10 para palavras-chave principais em 6 meses

4. **Conversões**
   - Google Analytics → Eventos
   - Meta: Aumento de leads orgânicos em 150-200% em 6 meses

5. **Core Web Vitals**
   - Google Search Console → Core Web Vitals
   - Meta: "Bom" em todas as métricas (LCP < 2.5s, FID < 100ms, CLS < 0.1)

### Relatórios Recomendados

**Semanal:**
- Tráfego orgânico
- Queries principais no Search Console
- Erros de indexação

**Mensal:**
- Posições de palavras-chave
- Conversões por fonte
- Core Web Vitals
- Backlinks novos

---

## 🔧 Troubleshooting

### Problema: Google Analytics não está funcionando

**Solução:**
1. Verifique se `NEXT_PUBLIC_GA_ID` está configurado no `.env`
2. Verifique se o ID está correto (formato: `G-XXXXXXXXXX`)
3. Limpe o cache do navegador
4. Verifique no DevTools → Network se há requisições para `analytics.google.com`

### Problema: Sitemap não está sendo atualizado

**Solução:**
1. Verifique se o banco de dados está acessível
2. Verifique se `getBlogPosts()` e `getMaterials()` estão funcionando
3. Acesse `https://ldccapital.com.br/sitemap.xml` diretamente
4. Verifique logs do servidor para erros

### Problema: Structured Data com erros

**Solução:**
1. Use Google Rich Results Test para validar
2. Verifique se todos os campos obrigatórios estão preenchidos
3. Verifique se as URLs das imagens estão corretas
4. Verifique se as datas estão no formato ISO 8601 (YYYY-MM-DD)

### Problema: Metadata não aparece nas redes sociais

**Solução:**
1. Use o Facebook Debugger: https://developers.facebook.com/tools/debug/
2. Use o Twitter Card Validator: https://cards-dev.twitter.com/validator
3. Cole a URL da página e clique em "Scrape Again"
4. Verifique se as imagens OG estão acessíveis (não retornam 404)

### Problema: Páginas não estão sendo indexadas

**Solução:**
1. Verifique Google Search Console → Cobertura
2. Verifique se o robots.txt permite a indexação
3. Verifique se a página está no sitemap
4. Solicite indexação manual no Search Console

---

## ✅ Checklist de Manutenção

### Diário (Automático)
- ✅ Sitemap atualizado automaticamente
- ✅ Robots.txt funcionando
- ✅ Analytics coletando dados

### Semanal
- [ ] Verificar Google Search Console por erros
- [ ] Verificar performance de queries principais
- [ ] Verificar se novos posts aparecem no sitemap
- [ ] Verificar Core Web Vitals

### Mensal
- [ ] Analisar relatório de tráfego orgânico
- [ ] Revisar posições de palavras-chave
- [ ] Atualizar metadata de páginas se necessário
- [ ] Verificar e corrigir erros de indexação
- [ ] Analisar conversões e otimizar páginas com baixa conversão

### Trimestral
- [ ] Revisar estratégia de keywords
- [ ] Atualizar structured data se necessário
- [ ] Criar novas imagens OG se necessário
- [ ] Revisar e atualizar conteúdo antigo do blog
- [ ] Analisar backlinks e oportunidades de link building

---

## 📞 Suporte e Recursos

### Ferramentas Úteis

1. **Google Search Console**
   - https://search.google.com/search-console

2. **Google Analytics**
   - https://analytics.google.com

3. **Google Rich Results Test**
   - https://search.google.com/test/rich-results

4. **PageSpeed Insights**
   - https://pagespeed.web.dev/

5. **Schema.org Validator**
   - https://validator.schema.org/

6. **Facebook Debugger**
   - https://developers.facebook.com/tools/debug/

7. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator

### Documentação

- **Next.js Metadata API:** https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- **Schema.org:** https://schema.org/
- **Google Search Central:** https://developers.google.com/search

---

## 🎓 Próximos Passos

### Melhorias Futuras Recomendadas

1. **Rich Snippets Adicionais**
   - Review Schema (se tiver avaliações)
   - Rating Schema (se tiver notas)

2. **RSS Feed**
   - Criar `/feed.xml` para blog
   - Permite syndication

3. **AMP (Accelerated Mobile Pages)**
   - Para posts do blog
   - Melhora performance mobile

4. **PWA (Progressive Web App)**
   - Service Worker para cache
   - Melhora experiência mobile

5. **Facebook Pixel**
   - Tracking de conversões no Facebook
   - Retargeting

6. **LinkedIn Insight Tag**
   - B2B tracking
   - Professional network

---

## 📝 Notas Finais

- Todas as melhorias de SEO foram implementadas sem alterar o design ou layout do site
- O sistema é totalmente dinâmico e se adapta automaticamente a novos posts e materiais
- As configurações estão centralizadas em `src/lib/seo-config.ts` para fácil manutenção
- O sistema está pronto para produção e seguindo as melhores práticas de 2024-2025

**Última Atualização:** Janeiro 2025  
**Versão do Manual:** 1.0

