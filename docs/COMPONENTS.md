# Guia de Componentes Reutilizáveis — LDC Capital

Todos os componentes ficam em `src/components/`. Convenção: PascalCase, um componente por arquivo.

---

## UI Primitivos (shadcn/ui)

Pasta: `src/components/ui/`

Configurados com a paleta LDC. Importar diretamente — não customizar internamente.

| Componente | Arquivo | Uso |
|---|---|---|
| `Button` | `ui/button.tsx` | Botões de ação — variants: `default`, `outline`, `ghost`, `destructive` |
| `Input` | `ui/input.tsx` | Campo de texto simples |
| `Label` | `ui/label.tsx` | Label associado a inputs |
| `Card` | `ui/card.tsx` | Container de conteúdo — inclui `CardHeader`, `CardContent`, `CardFooter` |
| `Badge` | `ui/badge.tsx` | Tags e etiquetas pequenas |
| `Checkbox` | `ui/checkbox.tsx` | Checkbox acessível |
| `Textarea` | `ui/textarea.tsx` | Campo de texto multilinha |
| `Tooltip` | `ui/tooltip.tsx` | Tooltip ao hover |
| `Tabs` | `ui/tabs.tsx` | Navegação por abas |
| `Select` | `ui/select.tsx` | Dropdown de seleção |
| `AlertDialog` | `ui/alert-dialog.tsx` | Modal de confirmação |
| `Carousel` | `ui/carousel.tsx` | Carrossel (Embla) |
| `Toast` / `Toaster` | `ui/toast.tsx`, `ui/toaster.tsx` | Notificações temporárias |

---

## Layout Global

### Header

`src/components/Header.tsx`

Header principal do site. Inclui logo, navegação desktop e menu mobile.

```tsx
// É inserido no layout raiz — não importar manualmente em páginas
// Navegação definida internamente no arquivo
```

### Footer

`src/components/Footer.tsx`

Footer com links, redes sociais, disclaimer regulatório CVM e copyright.

### WhatsAppButton

`src/components/WhatsAppButton.tsx`

Botão flutuante fixo no canto inferior direito. Aparece em todas as páginas.

```tsx
// Props: nenhuma — número configurado internamente (55 51 98930-1511)
// Rastreia clique via trackEvent("whatsapp_click")
```

### AdminLayout

`src/components/AdminLayout.tsx`

Layout envolvente para as páginas de admin (`/admin/*`). Inclui sidebar e verificação de autenticação.

---

## Componentes Institucionais (Home e páginas core)

Pasta: `src/components/`

| Componente | Arquivo | Usado em |
|---|---|---|
| `Hero` | `Hero.tsx` | Home — seção principal com CTA |
| `ServicesGrid` | `ServicesGrid.tsx` | Home — grid de serviços |
| `TestimonialsCarousel` | `TestimonialsCarousel.tsx` | Home — depoimentos |
| `FAQ` | `FAQ.tsx` | Home — perguntas frequentes |
| `Timeline` | `Timeline.tsx` | Consultoria — linha do tempo da metodologia |
| `Differentials` | `Differentials.tsx` | Consultoria — diferenciais da LDC |
| `PillarGrid` | `PillarGrid.tsx` | Seção de pilares de gestão |
| `PartnersSection` | `PartnersSection.tsx` | Seção de parceiros |
| `DirectionSection` | `DirectionSection.tsx` | Seção de direção/liderança |
| `ImpactSection` | `ImpactSection.tsx` | Seção de impacto/números |
| `TeamGrid` | `TeamGrid.tsx` | Equipe — grid de membros com foto e bio |
| `LeadForm` | `LeadForm.tsx` | Formulário de captura de leads (geral) |
| `CTAButton` | `CTAButton.tsx` | Botão de call-to-action com tracking |

---

## Componentes de Landing Pages

### Landing E-book (`/ebook-investimentos-internacionais`)

Pasta: `src/components/landing-ebook/`

| Componente | Descrição |
|---|---|
| `HeroSection.tsx` | Hero da landing com headline e form |
| `BenefitsSection.tsx` | Lista de benefícios do e-book |
| `SocialProofSection.tsx` | Depoimentos/prova social |
| `FormSection.tsx` | Seção do formulário de captura |

---

## Componentes de Ferramentas Financeiras

### Wealth Planning (`/wealth-planning`)

Pasta: `src/components/wealth-planning/`

Sistema completo de planejamento patrimonial. Formulários wizard + gerador de PDF.

**Formulários principais:**
- `PersonalDataForm.tsx` — dados pessoais do cliente
- `FinancialDataForm.tsx` — renda, patrimônio, dívidas
- `PortfolioForm.tsx` — composição da carteira atual
- `AssetsForm.tsx` — ativos imobilizados e alternativos

**Dashboard e visualização:**
- `InteractiveDashboard.tsx` — painel com KPIs do plano
- `ProjectionChart.tsx` — gráfico de projeção patrimonial
- `ScenarioWizard.tsx` — wizard de cenários (otimista/pessimista)

**Subpasta v2** (`wealth-planning/v2/`) — versão evoluída em uso:
- `ActionPlan.tsx` — plano de ação gerado
- `MeetingWizard.tsx` — wizard para reunião com cliente
- `StressTestPanel.tsx` — painel de stress test de carteira
- `SuccessionChecklist.tsx` — checklist de sucessão
- `ImpactAnalysis.tsx` — análise de impacto de cenários
- `ProjectionChart.tsx` — versão v2 do gráfico

**Utilitários do form:**
- `CurrencyInput.tsx` — input formatado em R$
- `FieldWithTooltip.tsx` — campo com tooltip explicativo
- `ValidationMessage.tsx` — mensagem de erro/validação
- `SaveIndicator.tsx` — indicador de auto-save

### Calculadora de Tributação de Dividendos (`/calculadora-tributacao-dividendos-2026`)

Pasta: `src/components/dividend-tax/`

| Componente | Descrição |
|---|---|
| `DividendTaxCalculator.tsx` | Calculadora principal — inputs e resultado |
| `IncomeCompositionChart.tsx` | Gráfico de composição de renda |
| `RegimeComparisonChart.tsx` | Comparação entre regimes tributários |
| `ScenarioComparisonChart.tsx` | Comparação de cenários |

### PGBL Simulator (`/pgbl-simulator`)

Pasta: `src/components/pgbl/` (ou inline na página)

- `PGBLChart.tsx` — gráfico de evolução do PGBL
- `PGBLTable.tsx` — tabela de contribuições e benefício fiscal

---

## Componentes de Blog e Conteúdo

Usados em `/blog` e `/materiais`.

| Componente | Arquivo | Descrição |
|---|---|---|
| Post card | inline em páginas | Card de preview de post |
| Material card | inline em páginas | Card de material para download |

Conteúdo em MDX processado via `src/app/lib/mdx.ts` e `src/app/lib/blog.ts`.

---

## Componentes de Admin CMS

Pasta: `src/app/admin/` (server components e forms)

Painel em `/admin` com autenticação Supabase. Funcionalidades:
- CRUD de posts do blog
- CRUD de materiais
- Gerenciamento de clientes wealth planning

---

## Hooks Customizados

Pasta: `src/hooks/`

Verificar arquivos existentes para hooks de formulário, autenticação e estado.

---

## Regras de Criação de Componentes

1. **Componentes de UI puros** → colocar em `src/components/ui/` se for primitivo reutilizável
2. **Componentes de feature** → colocar em subpasta da feature: `src/components/wealth-planning/`, `src/components/dividend-tax/`, etc.
3. **Componentes institucionais** → diretamente em `src/components/`
4. **"use client"** → apenas quando necessário (eventos, hooks, estado). Prefira Server Components.
5. Props de estilo → usar `cn()` (clsx + tailwind-merge) para composição de classes
