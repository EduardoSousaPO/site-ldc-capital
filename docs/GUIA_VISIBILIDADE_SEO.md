# 📊 Guia Completo de Visibilidade e SEO - LDC Capital

Este documento contém todas as instruções para configurar e otimizar a visibilidade do site nos mecanismos de busca, rastreamento de visitantes e conformidade com LGPD.

---

## 📋 Índice

1. [Configurações Implementadas](#configurações-implementadas)
2. [Google Analytics 4 (GA4)](#google-analytics-4-ga4)
3. [Meta Pixel (Facebook Pixel)](#meta-pixel-facebook-pixel)
4. [Banner de Cookies LGPD](#banner-de-cookies-lgpd)
5. [Google Search Console](#google-search-console)
6. [Schema.org Structured Data](#schemaorg-structured-data)
7. [Sitemap e Robots.txt](#sitemap-e-robotstxt)
8. [Google My Business / Maps](#google-my-business--maps)
9. [Próximos Passos](#próximos-passos)

---

## ✅ Configurações Implementadas

### O que já está funcionando:

- ✅ **Banner de Cookies LGPD/GDPR** - Componente completo com gerenciamento de preferências
- ✅ **Google Analytics 4** - Integrado com consentimento de cookies
- ✅ **Meta Pixel** - Preparado para integração (requer ID)
- ✅ **Schema.org** - Dados estruturados para Organization e LocalBusiness
- ✅ **Sitemap Dinâmico** - Geração automática de sitemap.xml
- ✅ **Robots.txt** - Configurado corretamente
- ✅ **Metadata Completo** - Open Graph, Twitter Cards, Canonical URLs
- ✅ **Funções de Tracking** - Biblioteca de funções para eventos customizados

---

## 🔵 Google Analytics 4 (GA4)

### Status Atual
✅ **Já configurado** - ID: `G-BQHTBDHGP9`

### Como Funciona

O Google Analytics está integrado e respeita o consentimento de cookies. Ele só começa a rastrear quando o usuário aceita cookies de análise.

### Configuração Adicional (Opcional)

1. **Acesse o Google Analytics**: https://analytics.google.com/
2. **Configure Eventos Personalizados**:
   - Acesse: Admin → Eventos → Criar evento
   - Eventos sugeridos:
     - `lead_form_submitted` - Quando formulário é enviado
     - `material_downloaded` - Quando material é baixado
     - `blog_post_viewed` - Quando post é visualizado
     - `contact_button_clicked` - Quando botão de contato é clicado

3. **Configure Conversões**:
   - Acesse: Admin → Eventos → Marcar como conversão
   - Marque `lead_form_submitted` como conversão

### Usando as Funções de Tracking

```typescript
import { trackEvent, trackLead, trackDownload } from "@/lib/analytics";

// Rastrear envio de formulário
trackLead("formulario-contato", 100);

// Rastrear download de material
trackDownload("Guia de Investimentos", "ebook");

// Rastrear evento customizado
trackEvent("button_click", "engagement", "cta-hero");
```

---

## 📘 Meta Pixel (Facebook Pixel)

### Status Atual
⚠️ **Requer Configuração** - Precisa adicionar o Pixel ID

### Como Configurar

1. **Acesse o Meta Events Manager**:
   - https://business.facebook.com/events_manager
   - Faça login com sua conta do Facebook Business

2. **Crie um Pixel** (se ainda não tiver):
   - Clique em "Conectar dados" → "Web" → "Meta Pixel"
   - Siga as instruções para criar o pixel

3. **Copie o Pixel ID**:
   - O ID será algo como: `123456789012345`

4. **Adicione ao arquivo `.env`**:
   ```env
   NEXT_PUBLIC_META_PIXEL_ID="seu-pixel-id-aqui"
   ```

5. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

### Eventos Automáticos

O pixel já rastreia automaticamente:
- `PageView` - Visualizações de página
- `Lead` - Quando um lead é gerado (via função `trackLead`)
- `ViewContent` - Visualizações de conteúdo (blog, materiais)

### Eventos Customizados

```typescript
import { trackMetaEvent } from "@/lib/analytics";

// Rastrear evento customizado
trackMetaEvent("CompleteRegistration", {
  content_name: "Formulário de Contato",
  value: 100,
  currency: "BRL"
});
```

---

## 🍪 Banner de Cookies LGPD

### Status Atual
✅ **Totalmente Implementado**

### Como Funciona

O banner aparece automaticamente na primeira visita e permite:
- **Aceitar Todos** - Ativa todos os cookies
- **Rejeitar Todos** - Apenas cookies necessários
- **Personalizar** - Escolher quais tipos de cookies aceitar

### Tipos de Cookies

1. **Necessários** (sempre ativos):
   - Essenciais para o funcionamento do site
   - Não podem ser desativados

2. **Análise** (opcional):
   - Google Analytics
   - Rastreamento de comportamento

3. **Marketing** (opcional):
   - Meta Pixel
   - Anúncios personalizados

### Personalização

O banner está em: `src/components/CookieBanner.tsx`

Você pode personalizar:
- Textos e mensagens
- Cores e estilos
- Comportamento (quando mostrar, tempo de exibição)

---

## 🔍 Google Search Console

### Como Configurar

1. **Acesse o Google Search Console**:
   - https://search.google.com/search-console
   - Faça login com sua conta Google

2. **Adicione uma Propriedade**:
   - Clique em "Adicionar propriedade"
   - Escolha "Prefixo de URL"
   - Digite: `https://ldccapital.com.br`

3. **Verifique a Propriedade**:
   
   **Opção 1: Tag HTML** (Recomendado)
   - No Search Console, escolha "Tag HTML"
   - Copie o código de verificação
   - Adicione ao arquivo `.env`:
     ```env
     GOOGLE_SEARCH_CONSOLE_VERIFICATION="seu-codigo-aqui"
     ```
   - Descomente a linha no `src/app/layout.tsx`:
     ```typescript
     verification: {
       google: process.env.GOOGLE_SEARCH_CONSOLE_VERIFICATION,
     },
     ```

   **Opção 2: Arquivo HTML**
   - Baixe o arquivo de verificação
   - Coloque em: `public/google-site-verification.html`

4. **Envie o Sitemap**:
   - Após verificar, vá em "Sitemaps"
   - Adicione: `https://ldccapital.com.br/sitemap.xml`
   - Clique em "Enviar"

5. **Configure URLs Canônicas**:
   - O site já está configurado com URLs canônicas
   - Verifique em: Cobertura → URLs canônicas

### Monitoramento

Após configurar, monitore:
- **Cobertura**: Páginas indexadas
- **Desempenho**: Queries, impressões, cliques, CTR
- **Core Web Vitals**: LCP, FID, CLS
- **Links**: Backlinks e links internos

---

## 📊 Schema.org Structured Data

### Status Atual
✅ **Implementado** - Organization e LocalBusiness

### Schemas Implementados

1. **Organization** (`src/lib/schema.ts`):
   - Nome, URL, logo
   - Descrição
   - Endereço e contato
   - Redes sociais

2. **LocalBusiness / FinancialService**:
   - Informações de negócio local
   - Horário de funcionamento
   - Preço (priceRange)

3. **Article** (para posts do blog):
   - Título, descrição, imagem
   - Data de publicação
   - Autor e editor

### Validar Schema

1. **Google Rich Results Test**:
   - https://search.google.com/test/rich-results
   - Cole a URL da página
   - Verifique se há erros

2. **Schema.org Validator**:
   - https://validator.schema.org/
   - Cole o código JSON-LD

### Adicionar Novos Schemas

```typescript
import { JsonLd, getArticleSchema } from "@/lib/schema";

// Em uma página
const articleSchema = getArticleSchema(
  "Título do Artigo",
  "Descrição",
  "/images/cover.jpg",
  "2025-01-15"
);

return (
  <>
    <JsonLd data={articleSchema} />
    {/* resto do conteúdo */}
  </>
);
```

---

## 🗺️ Sitemap e Robots.txt

### Sitemap Dinâmico

✅ **Implementado** em `src/app/sitemap.ts`

O sitemap é gerado automaticamente e inclui:
- Páginas estáticas (home, consultoria, blog, etc.)
- Posts do blog (do banco de dados)
- Materiais (do banco de dados)

**Acesse**: `https://ldccapital.com.br/sitemap.xml`

### Robots.txt

✅ **Implementado** em `src/app/robots.ts`

Configurado para:
- Permitir indexação de todas as páginas públicas
- Bloquear: `/admin/`, `/api/`, `/_next/`, `/static/`
- Apontar para o sitemap

**Acesse**: `https://ldccapital.com.br/robots.txt`

---

## 📍 Google My Business / Maps

### Como Configurar

1. **Acesse o Google Business Profile**:
   - https://www.google.com/business/
   - Faça login com sua conta Google

2. **Crie um Perfil**:
   - Clique em "Gerenciar agora"
   - Escolha "Adicionar seu negócio ao Google"
   - Preencha:
     - Nome: "LDC Capital"
     - Categoria: "Consultoria de Investimentos" ou "Serviços Financeiros"
     - Endereço (se tiver escritório físico)
     - Telefone
     - Site: `https://ldccapital.com.br`
     - Horário de funcionamento

3. **Verifique o Negócio**:
   - Google enviará um código por correio ou telefone
   - Siga as instruções para verificar

4. **Otimize o Perfil**:
   - Adicione fotos profissionais
   - Escreva uma descrição completa
   - Adicione produtos/serviços
   - Publique posts regularmente
   - Responda avaliações

5. **Integre com o Site**:
   - O Schema.org LocalBusiness já está configurado
   - Isso ajuda o Google a entender seu negócio

### Melhorar Visibilidade no Maps

- **Solicite Avaliações**: Peça para clientes deixarem avaliações
- **Posts Regulares**: Publique atualizações, ofertas, notícias
- **Fotos Atualizadas**: Adicione fotos regularmente
- **Responda Perguntas**: Monitore e responda perguntas dos usuários
- **Horários Precisos**: Mantenha horários atualizados

---

## 🚀 Próximos Passos

### Prioridade Alta

1. ✅ Configurar Meta Pixel ID no `.env`
2. ✅ Verificar site no Google Search Console
3. ✅ Criar perfil no Google My Business
4. ✅ Adicionar código de verificação do Search Console

### Prioridade Média

1. **Criar Imagens OG (Open Graph)**:
   - Tamanho: 1200x630px
   - Para: Home, Consultoria, Blog (cada post)
   - Salvar em: `public/images/og/`

2. **Configurar Eventos no GA4**:
   - Criar eventos para ações importantes
   - Configurar conversões

3. **Otimizar Core Web Vitals**:
   - Monitorar no Google Search Console
   - Otimizar imagens (WebP, lazy loading)
   - Melhorar tempo de carregamento

4. **Criar Conteúdo Regular**:
   - Posts no blog semanalmente
   - Materiais educativos
   - Atualizar informações

### Prioridade Baixa

1. **Backlinks**:
   - Parcerias com outros sites
   - Guest posts
   - Diretórios locais

2. **Redes Sociais**:
   - Criar perfis oficiais
   - Compartilhar conteúdo regularmente
   - Adicionar links no Schema.org

3. **Google Ads**:
   - Criar campanhas de busca
   - Integrar com GA4
   - Rastrear conversões

---

## 📝 Checklist de Implementação

### Configurações Básicas
- [x] Banner de cookies implementado
- [x] Google Analytics 4 configurado
- [ ] Meta Pixel ID adicionado ao `.env`
- [ ] Google Search Console verificado
- [ ] Google My Business criado

### SEO Técnico
- [x] Sitemap dinâmico criado
- [x] Robots.txt configurado
- [x] Schema.org implementado
- [x] Metadata completo (Open Graph, Twitter Cards)
- [x] URLs canônicas configuradas

### Conteúdo
- [ ] Imagens OG criadas
- [ ] Conteúdo otimizado com palavras-chave
- [ ] Blog atualizado regularmente
- [ ] Materiais educativos publicados

### Monitoramento
- [ ] Google Analytics configurado com eventos
- [ ] Google Search Console monitorado
- [ ] Core Web Vitals otimizados
- [ ] Backlinks monitorados

---

## 🆘 Suporte

Se tiver dúvidas ou problemas:

1. **Documentação Oficial**:
   - Google Analytics: https://support.google.com/analytics
   - Meta Pixel: https://www.facebook.com/business/help
   - Google Search Console: https://support.google.com/webmasters

2. **Ferramentas de Validação**:
   - Schema.org: https://validator.schema.org/
   - Rich Results: https://search.google.com/test/rich-results
   - PageSpeed Insights: https://pagespeed.web.dev/

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0

