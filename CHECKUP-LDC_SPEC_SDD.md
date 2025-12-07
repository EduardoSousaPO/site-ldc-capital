# CHECKUP-LDC — SPEC + SDD (Spec-Driven Development) para Cursor

> **Contexto do projeto**
> - Este feature será desenvolvido **dentro do repositório/site da LDC Capital**, aproveitando **layout, cores, tipografia e componentes já existentes** no projeto local.
> - A funcionalidade será acessada **por enquanto** via uma **URL oculta** (rota não linkada no menu público).
> - Nome do produto/feature: **Checkup-LDC** (Portfolio Checkup MCP).

---

## 0) Objetivo (MCP / Minimum Cash Product)

### Proposta de valor (1 frase)
**“Cole/importe sua carteira e receba em minutos um diagnóstico claro (nota, riscos, melhorias) + PDF premium, sem fricção.”**

### Por que alguém paga por isso (mesmo com ChatGPT/Claude)
- **Pipeline de produto**, não “prompt”: ingestão → normalização → cálculo de pesos → score consistente → gráficos → PDF → trilha de auditoria.
- **Experiência sem atrito**: usuário não precisa “formatar prompt” nem “montar planilha”.
- **Consistência**: mesmas regras, mesma estrutura, toda vez.

### Meta MCP (V1)
- Entregar **valor imediato** com:
  1) **Entrada rápida** (colar/CSV)
  2) **Diagnóstico determinístico** (regras + score)
  3) **Relatório acionável + PDF** (paywall)

---

## 1) Requisitos funcionais (MCP — somente o essencial)

### RF1 — Inserção da carteira (sem fricção)
- Usuário pode inserir holdings por:
  - **Colar tabela** (copiar/colar do Excel/Sheets/corretora)
  - **Upload CSV/Excel** (opcional no V1, mas recomendado se fácil)
- Campos mínimos por linha:
  - `nome_ou_codigo` (texto)
  - `valor` **ou** (`quantidade` e `preco`, se tiver)
  - `tipo` (dropdown: Ação BR, ETF BR, FII, Exterior, Fundo, Previdência, RF Pós, RF IPCA, Caixa, Outros)
- O sistema deve:
  - **sugerir tipo automaticamente** por heurística (ex.: ticker com “11” → FII; “ETF” no nome; “TESOURO” etc.)
  - permitir “**Aplicar a todos similares**” (ex.: todos que contêm “TESOURO” = RF IPCA)
- Objetivo: **a classificação não pode levar mais que 60–90s** para uma carteira típica.

### RF2 — Questionário mínimo (suitability leve / contexto)
- 3–4 perguntas:
  - `objetivo_principal`: {aposentadoria, renda, crescimento, preservação}
  - `prazo_anos`: número (ou faixas: 0–3, 3–7, 7–15, 15+)
  - `tolerancia_risco`: {baixa, média, alta}
  - (opcional) `idade` ou faixa (ex.: 18–29, 30–39, 40–49, 50+)
- Resultado deve ser usado para calibrar **alertas** e **score**.

### RF3 — Preview gratuito + Paywall (MCP)
- Após “Analisar”, exibir **preview**:
  - Nota (0–100)
  - 2 alertas principais (curtos)
  - 1 gráfico simples (ex.: pizza por classe)
- **Paywall** para destravar:
  - relatório completo na tela
  - PDF premium
  - plano de ação (3 passos)

### RF4 — Relatório premium (na tela)
Conteúdo mínimo do relatório completo:
- Nota (0–100) + interpretação textual curta
- Alocação por classe (pizza) + Brasil x Exterior (barra)
- Concentração (top5/top10)
- “Complexidade” (proxy: % em fundos/previdência/estruturas difíceis)
- 3 riscos + 3 melhorias
- Plano de ação em 7 dias
- Transparência: limites da análise (fundos/RF tratados por classe)

### RF5 — PDF premium
- PDF gerado server-side (ou client com render consistente), com:
  - capa simples (Checkup-LDC + data)
  - gráficos e resumo
  - riscos/melhorias/plano
  - rodapé com disclaimer

### RF6 — Multi-LLM configurável (orquestrador)
- Deve existir uma camada única `llm_provider` com:
  - **OpenAI** e pelo menos mais 1 provedor (ex.: Anthropic/Claude) pluggable
  - Seleção por tarefa:
    - `diagnosis_json` (gera JSON estruturado do texto/insights)
    - `rewrite_ptbr` (polimento do texto final)
- **Fallback**: se o provedor falhar, tentar o outro.

### RF7 — “House View” (política de análise) **configurável**
- Implementar `policy_profile` (filosofia padrão) com parâmetros ajustáveis.
- Deve orientar a análise para:
  - diversificação global (exterior) como robustez de longo prazo
  - portfólio descomplicado
  - baixo custo (quando o usuário sinalizar custos altos)
  - liquidez alta (evitar prazos longos quando objetivo/prazo/risco pedirem)
  - tilt defensivo **leve** (setores resilientes / não cíclicos)
- **Sem manipulação oculta**: apresentar como “Filosofia padrão (ajustável)” com texto curto.

### RF8 — Trilha de auditoria (mínimo)
- Salvar:
  - inputs do usuário (holdings + questionário)
  - versão do `policy_profile`
  - provedor/modelo de LLM usado
  - hash de entrada/saída do LLM
  - data/hora

---

## 2) Requisitos não funcionais

### RNF1 — UX como diferencial
- Objetivo: **tempo total do fluxo** (colar → relatório) em **≤ 5 min**.
- Sem jargão; linguagem clara; componentes visuais consistentes com o site LDC.

### RNF2 — Estilo / Design system (obrigatório)
- Reutilizar **100%** do design do site LDC Capital:
  - cores / tokens
  - tipografia (font-family, tamanhos, pesos)
  - componentes (botões, cards, inputs)
  - espaçamentos e grid
- Proibido introduzir um “novo tema” ou bibliotecas que conflitem com o setup atual.
- Se existir Tailwind/config de tokens/CSS variables, **usar o existente**.

### RNF3 — Privacidade e segurança (mínimo)
- Rota “oculta” não é segurança por si só.
- V1: permitir “URL oculta” + **token de acesso** (query param) ou **login admin** (se já existe auth).
- Armazenamento: uploads e dados do checkup devem ter isolamento por usuário.

### RNF4 — Performance
- Análise local (regras) deve ser instantânea (< 1s para 200 linhas).
- LLM e PDF podem demorar, mas devem mostrar loader e estados claros.

---

## 3) Rotas e acesso (URL oculta)

### Rota sugerida
- `/checkup-ldc` (não linkar no menu; access control por token ou auth)

### Controle de acesso V1 (mínimo)
Escolher 1:
- **Opção A (rápida):** `CHECKUP_LDC_ACCESS_TOKEN` e exigir `?token=...`
- **Opção B (melhor):** usar auth existente do site (ex.: admin/consultor)

---

## 4) Modelo de dados (Supabase/Postgres) — mínimo

> Ajustar ao stack existente. Se o projeto já usa Prisma, manter **consistência** com o padrão atual; se já migrou para Supabase direto, usar SQL.

### Tabela: `checkups`
- `id` (uuid)
- `user_id` (uuid/text) — conforme auth existente
- `created_at` (timestamptz)
- `status` enum: `draft | preview | paid | done`
- `objetivo_principal` text
- `prazo_anos` int
- `tolerancia_risco` text
- `idade_faixa` text (opcional)
- `policy_profile_id` uuid
- `score_total` int (0–100) (cache)
- `analytics_json` jsonb (cache)
- `report_json` jsonb (cache)
- `pdf_url` text (opcional)

### Tabela: `holdings`
- `id` uuid
- `checkup_id` uuid (fk)
- `nome_raw` text
- `ticker_norm` text (opcional)
- `tipo` text (enum)
- `valor` numeric
- `moeda` text default 'BRL'
- `liquidez_bucket` text (opcional)
- `custo_bucket` text (opcional)
- `risco_bucket` text (opcional)

### Tabela: `llm_runs`
- `id` uuid
- `checkup_id` uuid
- `created_at` timestamptz
- `provider` text
- `model` text
- `task` text
- `prompt_version` text
- `input_hash` text
- `output_json` jsonb

### Tabela: `policy_profiles`
- `id` uuid
- `name` text
- `config` jsonb

---

## 5) Engine de análise (regras determinísticas)

### Saídas do engine (estrutura padrão)
Gerar um objeto `analytics`:
- `allocation_by_class`: {classe: percentual}
- `br_vs_exterior`: {br: %, exterior: %}
- `top_holdings`: lista (nome, %, tipo)
- `concentration_top5`: %
- `concentration_top10`: %
- `complexity_score`: 0–100 (proxy)
- `liquidity_score`: 0–100 (proxy)
- `flags`: lista de flags (strings), ex.:
  - `HIGH_CONCENTRATION_TOP5`
  - `LOW_GLOBAL_DIVERSIFICATION`
  - `HIGH_COMPLEXITY_FUNDS`
  - `LOW_LIQUIDITY_BUCKET`
  - `RISK_MISMATCH_OBJECTIVE`

### Regras mínimas (exemplos)
- `HIGH_CONCENTRATION_TOP5` se top5 > 45%
- `LOW_GLOBAL_DIVERSIFICATION` se exterior < policy.target_exterior_min (por perfil)
- `HIGH_COMPLEXITY_FUNDS` se (fundos+previd) > policy.max_blackbox_pct
- `LOW_LIQUIDITY_BUCKET` se liquidez alta < policy.min_liquidity_high_pct
- `RISK_MISMATCH_OBJECTIVE` se RV muito alta para risco “baixa” + prazo curto

### Score 0–100 (simples)
Começar em 100 e subtrair penalidades por flags e severidade.
- penalidades e targets vêm do `policy_profile`.

---

## 6) Orquestrador LLM (multi-provider)

### Contrato de provider (pseudo)
- `generate_json(task, schema, prompt, input) -> json`

### Tarefas
- `diagnosis_json`:
  - recebe `analytics` + `user_profile` + `policy_profile`
  - retorna JSON com textos e recomendações
- `rewrite_ptbr`:
  - melhora clareza e tom; mantém conteúdo

### Fallback
- Se falhar provedor A, tentar B.
- Logar no `llm_runs`.

---

## 7) Prompting (versões + JSON)

### Schema de saída (diagnosis_json)
```json
{
  "headline": "string",
  "summary": "string",
  "risks": [{"title":"string","detail":"string","severity":"low|med|high"}],
  "improvements": [{"title":"string","detail":"string","impact":"low|med|high"}],
  "action_plan_7_days": ["string","string","string"],
  "transparency_notes": ["string","string"]
}
```

### Prompt base (diagnosis_json) — regras importantes
- Não inventar dados.
- Explicar de forma simples.
- Respeitar `policy_profile` como filosofia padrão.
- Sempre incluir `transparency_notes` sobre limites (fundos/RF por classe).

> **Nota:** manter prompt versionado: `PROMPT_VERSION=checkup_v1_YYYYMMDD`.

---

## 8) PDF (template)
- Template deve usar **os mesmos tokens** do site LDC.
- Conteúdo:
  - capa (Checkup-LDC + data)
  - nota + 2 bullets (resumo)
  - gráficos (pizza e barra)
  - riscos, melhorias, plano 7 dias
  - disclaimer

---

## 9) Integração no site LDC (layout e estilos)

### Regras de integração visual
- Usar a mesma:
  - `Layout` (header/footer se aplicável)
  - `Container` e grid
  - componentes (Button/Input/Card)
  - tipografia (classes existentes)
- A página Checkup-LDC deve “parecer” nativa do site.

### Checklist para Cursor antes de codar
1) Identificar no repo:
   - onde ficam tokens de cor (CSS vars / Tailwind config / theme)
   - componentes base (Button, Input, Card, Typography)
   - layout padrão de páginas internas
2) Replicar padrões de:
   - responsividade
   - loading states
   - mensagens de erro

---

## 10) SPEC de telas (mínimas)

### Tela A — Importar carteira
- Campo colar + botão upload
- Exemplo de formato aceito
- CTA: “Analisar”

### Tela B — Confirmar tipos
- Tabela simples com:
  - nome_raw
  - sugestão de tipo
  - dropdown para corrigir
- Botão: “Aplicar a similares”
- CTA: “Continuar”

### Tela C — Preview (com paywall)
- Nota + 2 alertas + 1 gráfico
- CTA: “Destravar relatório e PDF”

### Tela D — Resultado premium
- Conteúdo completo + botão PDF
- CTA secundário: “Agendar revisão com consultor” (opcional)

---

## 11) Critérios de aceite (Definition of Done)

### DoD funcional
- Usuário cola uma carteira com 10–80 linhas e obtém preview.
- Paywall destrava relatório completo e PDF.
- Logs do LLM ficam registrados.
- Política (policy_profile) influencia score e recomendações.

### DoD de UX
- Fluxo completo em ≤ 5 minutos.
- Zero páginas “quebradas” em mobile.
- Sem “jargão” excessivo.

### DoD de estilo
- Visual 100% consistente com LDC Capital (tokens e componentes do repo).

---

## 12) SDD (Spec-Driven Development) — como executar no Cursor

### Passo 1 — Ler o repositório e mapear padrões
- Identificar:
  - framework (Next/React/etc.)
  - componentes e estilos existentes
  - auth existente
  - padrão de rotas e API
- Criar um documento curto `CHECKUP-LDC_ARCH_NOTES.md` com:
  - onde está o design system
  - como criar novas páginas internas
  - onde ficam APIs e serviços

### Passo 2 — Vertical slice (MCP) em 1 fluxo
Implementar primeiro **o fluxo mínimo**:
- Página `/checkup-ldc` (acesso restrito)
- Colar holdings → parse → confirmar tipos → preview

Sem PDF e sem LLM nesse passo (se quiser acelerar).
Depois:
- adicionar LLM e PDF.

### Passo 3 — Engine determinístico
- Implementar `analytics_engine` puro (testável)
- Criar testes unitários para:
  - parse
  - classificação
  - score
  - flags

### Passo 4 — LLM Orchestrator
- Implementar `llm_provider`
- Adicionar `diagnosis_json` com schema fixo
- Logar `llm_runs`

### Passo 5 — PDF premium
- Template alinhado ao design do site
- Geração e storage

### Passo 6 — Hardening
- erros bem tratados
- timeouts
- auditoria
- copy final

---

## 13) Prompt de trabalho para o Cursor (copiar/colar)

### Prompt 1 — Planejamento/Mapeamento
> Você está no repositório do site da LDC Capital.  
> Tarefa: mapear onde ficam **tokens de design**, **componentes base**, **layout padrão de páginas internas** e **padrão de rotas/APIs**.  
> Gere um arquivo `CHECKUP-LDC_ARCH_NOTES.md` com:  
> - onde encontrar cores/typography (Tailwind/CSS vars)  
> - como criar uma nova rota interna consistente  
> - como reutilizar Button/Input/Card/Container já existentes  
> - como funciona auth (se existir)  
> - como armazenar dados (Supabase/Prisma/etc.)

### Prompt 2 — Implementar vertical slice (sem LLM/PDF)
> Crie a rota interna `/checkup-ldc` (não linkada no menu) usando o layout e design do site.  
> Implementar:  
> - Tela A (colar carteira)  
> - Parse robusto (colado)  
> - Tela B (confirmar tipos com dropdown + aplicar similares)  
> - Tela C (preview: nota + 2 alertas + 1 gráfico)  
>  
> Regras:  
> - Reusar componentes e tokens existentes  
> - Sem novas bibliotecas pesadas  
> - Código organizado em módulos (`features/checkup-ldc/...`)  
> - Criar `analytics_engine` com flags e score.

### Prompt 3 — Multi-LLM + relatório estruturado
> Implementar `llm_provider` com pelo menos OpenAI e um segundo provider (Anthropic/Claude) de forma plugável.  
> Criar task `diagnosis_json` com schema fixo e prompt versionado.  
> Persistir `llm_runs` com provider/model/task/input_hash/output_json.

### Prompt 4 — PDF premium
> Implementar geração de PDF com template alinhado ao design LDC (fontes, cores, espaçamento).  
> O PDF deve conter capa, gráficos, riscos/melhorias/plano e disclaimer.  
> Salvar PDF no storage e persistir `pdf_url` em `checkups`.

---

## 14) Variáveis de ambiente (exemplo)
- `CHECKUP_LDC_ACCESS_TOKEN=...` (se usar token)
- `OPENAI_API_KEY=...`
- `ANTHROPIC_API_KEY=...` (ou outro)
- `LLM_DIAG_PROVIDER=openai|anthropic`
- `LLM_DIAG_MODEL=...`
- `LLM_REWRITE_PROVIDER=openai|anthropic`
- `LLM_REWRITE_MODEL=...`

---

## 15) Disclaimers (texto base)
- “Este relatório é educacional e baseado nas informações fornecidas. Fundos e renda fixa são analisados por classe e peso, sem decomposição interna. Para recomendação personalizada completa, é necessário suitability detalhado e revisão humana.”

---

## 16) Entregáveis do V1
- Rota oculta `/checkup-ldc`
- Fluxo completo (A→B→C→D)
- Paywall + PDF
- Multi-LLM configurável
- Policy profile configurável
- Logs e auditoria

---

**Fim do SPEC + SDD.**
