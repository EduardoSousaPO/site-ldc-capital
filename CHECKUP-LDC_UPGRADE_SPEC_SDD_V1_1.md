# CHECKUP-LDC — UPGRADE V1.1 (Valor Percebido + Paywall + Upsell) — SPEC + SDD

> **Objetivo deste upgrade**
> Aumentar **valor percebido**, **conversão no paywall (R$47)** e **taxa de upsell** para:
> 1) Revisão guiada (one-off) e
> 2) Consultoria recorrente + Wealth Planning LDC  
> **sem aumentar muito a complexidade** e mantendo UX como diferencial.

> **Importante**
> - O **preview gratuito** deve ser **bem básico** (não “entregar o ouro”).
> - O conteúdo premium deve parecer “metodologia de Wealth”: claro, executável e com artefatos (PDF, copiar/colar WhatsApp, e-mail).

---

## 0) Definições

### Pilares de produto (Montano/MCP)
1) **Entrega imediata**: o usuário entende em 10s se está “saudável” ou “em risco”.
2) **Paywall justo**: o gratuito mostra só o “gosto”; o pago entrega o “prato”.
3) **Próximo passo inevitável**: ao final, a ação natural é “revisar com consultor” e/ou entrar na consultoria.

### Preço e metas
- **Ticket do checkup:** R$47 por acesso (1 relatório + PDF + utilitários).
- **Meta:** aumentar taxa de pagamento, reduzir abandono, elevar agendamentos.

---

## 1) Escopo do Upgrade (o que entra)

### 1.1 Preview gratuito (mínimo, persuasivo)
**Exibir apenas:**
- Nota global (0–100) + **1 frase curta**
- **2 alertas** (títulos curtos; sem detalhes)
- **1 gráfico simples** (pizza por classe OU Brasil vs Exterior — escolher 1)
- CTA forte: “Desbloquear relatório completo + PDF + plano copiável (R$47)”

**Bloquear no preview:**
- Score breakdown por dimensões
- Percentuais exatos de metas/targets
- Lista Top 5 posições
- Simulações “antes vs depois”
- Texto detalhado de riscos/melhorias
- Plano de ação com checklist
- Botões de “copiar”, “enviar por e-mail/WhatsApp”
- PDF

> **Regra:** preview deve gerar ansiedade positiva (“quero ver completo”) sem frustração excessiva.

---

### 1.2 Conteúdo premium (pós-pagamento)
#### (A) Score Breakdown (5 mini-notas)
Exibir 5 barras/indicadores com:
- Diversificação Global
- Concentração
- Liquidez
- Complexidade
- Eficiência de custos (por bucket)

Cada item deve ter:
- nota (0–100) + label (baixo/médio/alto risco)
- **meta visual** (ex.: alvo mínimo) — sem parecer “forçado”
- tooltip: “como calculamos” (curto)

#### (B) “Antes vs Depois” (What-if heurístico)
Exibir 2–3 botões de simulação:
- +10% Exterior
- Reduzir Top5 para 45%
- Elevar Liquidez para Score 60

Para cada botão:
- mostrar “Nota estimada: 67 → 74”
- 1 linha de impacto (“reduz risco local”, “melhora flexibilidade”, etc.)

> **Sem otimização complexa:** apenas recalcular sub-scores com parâmetros ajustados.

#### (C) Top 5 posições
Card “Top 5 posições” com:
- nome/ativo
- % da carteira
- classe (badge)
- (opcional) bucket de liquidez (badge)

#### (D) Plano de ação executável (7 dias)
Transformar em:
- checklist com 3 itens
- botões:
  - “Copiar plano”
  - “Compartilhar no WhatsApp” (template)
  - “Enviar por e-mail” (via backend)

#### (E) PDF premium + utilitários
- Botão “Baixar PDF”
- PDF inclui breakdown + gráficos + plano
- Registro do PDF em storage
- Disclaimers e transparência

---

### 1.3 Upsell (duas camadas)
#### Upsell 1 (imediato, pós-compra): Revisão guiada
Exibir bloco após premium:
- “Transforme este relatório em um plano de ajuste com um consultor”
- “20 min” + CTA “Agendar Revisão”
- (Opcional) “Crédito” do checkup no upsell (ex.: R$47 abatidos) — se aplicável.

#### Upsell 2 (principal): Consultoria LDC + Wealth Planning
Bloco com:
- 3 bullets: reunião mensal, rebalanceamento, wealth planning
- CTA: “Quero conversar sobre a Consultoria LDC”
- Deve passar contexto automaticamente (anexar ID do checkup no lead)

---

## 2) Requisitos funcionais

### RF1 — Paywall correto (não vazar premium)
- Itens premium só aparecem em `status=paid`.
- Preview mostra apenas o mínimo definido.

### RF2 — Score Breakdown implementado com dados existentes
- Reaproveitar `analytics_engine`:
  - criar sub-scores consistentes
  - salvar em `analytics_json`

### RF3 — What-if heurístico
- Função pura: `simulate_adjustment(analytics, policy, adjustment) -> new_scores`
- Ajustments suportados (enum):
  - `ADD_EXTERIOR_10`
  - `REDUCE_TOP5_TO_45`
  - `INCREASE_LIQUIDITY_TO_60`

### RF4 — Top 5
- Calcular a partir de holdings (% por valor).
- Exibir somente em premium.

### RF5 — Plano copiável + WhatsApp + e-mail
- Copiar: client-side.
- WhatsApp: abrir `https://wa.me/?text=...` (urlencoded).
- E-mail:
  - endpoint backend `POST /api/checkups/:id/email-plan` para enviar ao e-mail do usuário (capturar e-mail no checkout ou pedir 1 campo).

### RF6 — PDF atualizado
- Incluir novos blocos.
- Garantir consistência visual com design LDC.

### RF7 — Upsell tracking
- CTA de agendamento deve:
  - enviar `checkup_id`
  - enviar principais flags (ex.: baixa liquidez, baixa diversificação global) como “contexto do lead”
  - registrar evento de analytics (mínimo: `upsell_clicked`)

---

## 3) Requisitos não funcionais (UX)
- Premium deve responder à pergunta em **10 segundos**:
  - “O que está errado?”
  - “O que fazer?”
- Manter “clean” e evitar texto longo.
- Loading states claros para:
  - pagamento confirmado
  - geração do PDF
  - envio de e-mail

---

## 4) Ajustes em dados / schema (mínimos)

### `analytics_json` (adicionar)
- `subscores`:
  - `global_diversification`
  - `concentration`
  - `liquidity`
  - `complexity`
  - `cost_efficiency`
- `what_if`:
  - array de simulações com `label`, `score_before`, `score_after`, `note`

### Nova tabela opcional (ou usar `checkups`):
- `events` (se quiser)
  - `checkup_id`, `event_name`, `created_at`, `metadata`

---

## 5) UI/UX — especificação por tela

### Tela Preview (gratuita)
- Nota grande
- 2 alertas curtos
- 1 gráfico simples
- Card “O relatório completo inclui:” (lista)
  - breakdown (5 dimensões)
  - simulações
  - top5
  - plano copiável + WhatsApp + e-mail
  - PDF premium
- CTA: “Desbloquear por R$47”

### Tela Premium (paga)
Ordem recomendada:
1) Score + breakdown (5 barras)
2) What-if (3 botões)
3) Top 5 posições
4) Riscos (3) + Melhorias (3)
5) Plano 7 dias (checklist + copiar/WhatsApp/e-mail)
6) PDF
7) Upsells

---

## 6) Critérios de aceite (DoD)

### DoD paywall
- Não aparece:
  - top5, breakdown, what-if, plano copiável, PDF
  quando `status != paid`.

### DoD premium
- Breakdown aparece e faz sentido com os flags.
- What-if altera score de forma coerente.
- Plano copiável funciona em desktop/mobile.
- WhatsApp abre com mensagem preformatada.
- E-mail chega com o plano + link do PDF (quando existir).

### DoD upsell
- CTA de agendamento envia `checkup_id` e contexto.
- Evento `upsell_clicked` registrado.

---

## 7) SDD (Spec-Driven Development) — como implementar no Cursor

### Passo 1 — Mapear componentes existentes
- Reusar components do site:
  - Progress/Stepper (se existir), Cards, Buttons, Badges
- Confirmar tokens e tipografia.

### Passo 2 — Implementar paywall gate (hard)
- Criar helper `isPaid(checkup)` e render condicional.
- Garantir que endpoints premium validem status server-side.

### Passo 3 — Subscores + breakdown
- Atualizar `analytics_engine` para gerar `subscores`.
- Atualizar UI para render barras e metas.

### Passo 4 — What-if heurístico
- Implementar `simulate_adjustment`.
- Render “score before/after”.

### Passo 5 — Top 5
- Implementar cálculo e card UI.

### Passo 6 — Plano copiável + WhatsApp + e-mail
- Copiar/WhatsApp client
- E-mail endpoint backend + template

### Passo 7 — PDF
- Atualizar template do PDF com novos blocos
- Validar render e tipografia

### Passo 8 — Upsell + tracking
- Implementar CTAs
- Registrar eventos

---

## 8) Prompt “copiar/colar” para o Cursor (upgrade)

### Prompt A — Paywall + Preview básico
> Atualize o Checkup-LDC para que o **preview gratuito seja minimalista** (nota + 2 alertas + 1 gráfico) e todo conteúdo premium fique bloqueado por paywall.  
> Implementar render condicional e validação server-side (status=paid).  
> Manter design system e componentes do site LDC.

### Prompt B — Score breakdown + subscores
> Atualize o `analytics_engine` para gerar `subscores` (diversificação global, concentração, liquidez, complexidade, custo).  
> Renderizar no relatório premium como 5 barras com meta visual e labels simples.  
> Persistir em `analytics_json`.

### Prompt C — What-if heurístico
> Implementar “Antes vs Depois” com 3 simulações simples e coerentes, sem otimização complexa.  
> Criar função pura `simulate_adjustment` e render do score antes/depois.

### Prompt D — Plano copiável + WhatsApp + e-mail
> Transformar o plano de 7 dias em checklist.  
> Adicionar botões: copiar, compartilhar no WhatsApp, enviar por e-mail.  
> Criar endpoint backend para envio e registrar evento.

### Prompt E — Upsell
> Implementar blocos de upsell pós-compra:  
> 1) Revisão guiada 20 min (one-off)  
> 2) Consultoria LDC + Wealth Planning  
> CTAs devem carregar `checkup_id` e principais flags como contexto do lead.

---

## 9) Conteúdo (copy) — placeholders
- Preview: “Seu checkup está pronto. Destrave o relatório completo para ver exatamente o que está puxando sua nota para baixo e o plano de ação.”
- Premium: “O que puxou sua nota: (3 bullets)”
- Upsell 1: “Quer transformar este relatório em um plano prático com um consultor?”
- Upsell 2: “A LDC acompanha, reequilibra e consolida — com Wealth Planning completo.”

---

**Fim do SPEC + SDD Upgrade V1.1**
