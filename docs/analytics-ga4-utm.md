# Rastreamento UTM — YouTube → Diagnóstico Gratuito

> Última atualização: 2026-05-20
> Escopo: rastrear leads vindos de vídeos do YouTube (e qualquer outra origem com UTM) até a conversão no formulário de `/diagnostico-gratuito`.

---

## 1. Padrão de URLs UTM

Todo link colocado em descrição/comentário fixado de vídeo do YouTube deve seguir este formato:

```
https://www.ldccapital.com.br/diagnostico-gratuito
  ?utm_source=youtube
  &utm_medium=video
  &utm_campaign=<slug-da-campanha>
  &utm_content=<id-do-video>
  &utm_term=<descricao-opcional>
```

Exemplo real:

```
https://www.ldccapital.com.br/diagnostico-gratuito?utm_source=youtube&utm_medium=video&utm_campaign=renda-fixa-credito&utm_content=dTT71qfy5qQ&utm_term=descricao
```

### Campanhas oficiais (slugs aprovados)

| Tema                    | `utm_campaign`         |
|-------------------------|------------------------|
| Holding/Patrimonial     | `holding-patrimonial`  |
| Commodities             | `commodities-ativos`   |
| Política BR             | `politica-macro-br`    |
| Geopolítica             | `geopolitica-global`   |
| ETFs/Portfólio          | `etfs-portfolio`       |
| Renda Fixa              | `renda-fixa-credito`   |

> **Regra:** sempre minúsculas e separadas por hífen. Nunca usar acento, espaço ou underline.
> **`utm_source` sempre `youtube`**, **`utm_medium` sempre `video`** para tráfego orgânico do canal. Para anúncios pagos, usar `utm_medium=cpc` ou `paid_social`.

---

## 2. Como o site captura UTMs

Implementado em `src/lib/utm.ts` e usado por `src/app/components/LeadForm.tsx`.

1. Ao montar a página `/diagnostico-gratuito`, o componente chama `captureUtmFromUrl()`:
   - Lê `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` da URL.
   - Se algum UTM estiver presente, grava no `localStorage` (chave `ldc_utm_attribution_v1`) com `landing_page` (`pathname + search`) e `referrer` (`document.referrer`). TTL de 30 dias.
   - Se nenhum UTM estiver presente, retorna o que já estava no storage (preserva atribuição anterior).
2. No submit do formulário, `onSubmit` mescla o estado do form com `getStoredUtm()` e envia tudo para `POST /api/lead`.
3. A API valida com `leadFormSchema` (campos UTM são opcionais) e persiste:
   - **Supabase tabela `Client`** — campo `notes` recebe `Patrimônio: … | Origem: … | IP: … | utm_source=… | utm_campaign=… | landing_page=…`.
   - **Google Sheets** (se configurado) — os UTMs ainda **não vão** para colunas dedicadas. Veja seção 5.

### Diagrama rápido

```
[Vídeo YouTube]
   └─ link com UTMs
       └─ /diagnostico-gratuito (Next.js page)
            ├─ captureUtmFromUrl()  ── salva em localStorage
            └─ <LeadForm /> submit
                 ├─ POST /api/lead { …, utm_source, … }
                 │    └─ Supabase Client.notes (UTM serializado)
                 └─ window.dataLayer.push({ event: "diagnostico_agendado", … })
                      └─ GTM → GA4 / Google Ads / Meta Ads
```

---

## 3. Evento de conversão `diagnostico_agendado`

Disparado **somente depois do envio bem-sucedido** (HTTP 200 + `success: true`).

Payload empurrado no `window.dataLayer`:

```ts
{
  event: "diagnostico_agendado",
  form_name: "diagnostico_gratuito",
  page_path: window.location.pathname,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term
}
```

Regras garantidas no código (`src/app/components/LeadForm.tsx`):

- ❌ Não dispara no clique do botão.
- ❌ Não dispara em erro de validação.
- ❌ Não dispara se a API retornar `success: false` ou status ≠ 200.
- ✅ Dispara somente em `response.ok && result.success`.

---

## 4. Configuração obrigatória no GA4 / GTM

### 4.1 Variáveis de ambiente

Adicione no `.env` (e nos environments do Vercel) **antes do deploy**:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Sem essa env o GTM **não carrega** (fallback seguro). GA4 continua via `NEXT_PUBLIC_GA_ID` (já existe).

### 4.2 GTM (Tag Manager)

1. Criar o container `GTM-XXXXXXX`.
2. Criar trigger **Custom Event** com `Event name` exatamente `diagnostico_agendado`.
3. Criar variáveis Data Layer para:
   - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
   - `form_name`, `page_path`
4. Criar Tag **GA4 Event**:
   - Configuration tag: a tag GA4 principal do container.
   - Event name: `diagnostico_agendado`.
   - Parâmetros: mapear todas as variáveis Data Layer acima.
   - Trigger: o Custom Event criado.
5. (Opcional) Tag **Google Ads Conversion** + **Meta CAPI** com o mesmo trigger.
6. Publicar a versão.

### 4.3 GA4

1. Em **Admin → Events**, marcar `diagnostico_agendado` como **Mark as conversion** (Key Event no GA4 novo).
2. Em **Admin → Custom definitions**, criar 5 Custom Dimensions (escopo Event):
   - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
3. Aguardar 24h para os dados aparecerem em **Aquisição → Aquisição de tráfego**.

---

## 5. Persistência no banco — colunas dedicadas (aplicadas)

> **Status atual:** UTMs são gravados em **colunas dedicadas** na tabela `public."Client"`. Migration `20260520120000_client_utm_columns` aplicada em 2026-05-20.

Colunas existentes:

| coluna | tipo | uso |
|---|---|---|
| `utm_source` | text | youtube, google, instagram, … |
| `utm_medium` | text | video, cpc, organic, … |
| `utm_campaign` | text | slug oficial (ver §1) |
| `utm_content` | text | YouTube videoId quando `utm_source=youtube` |
| `utm_term` | text | descrição livre |
| `landing_page` | text | pathname + search da entrada |
| `referrer` | text | `document.referrer` no client |
| `utm_captured_at` | timestamptz | momento do submit (preenchido só quando há UTM) |

Índices parciais (`WHERE … IS NOT NULL`): `client_utm_campaign_idx`, `client_utm_source_idx`, `client_utm_content_idx`.

`Client.notes` **não recebe mais UTM** — volta ao formato `Patrimônio: … | Origem: … | IP: …`.

**Rollback**: `supabase/migrations/20260520120000_client_utm_columns_down.sql` (idempotente; remove índices e colunas com `IF EXISTS`).

**Google Sheets (opcional, fora de escopo):** caso queira colunas dedicadas na planilha, atualizar `addToGoogleSheets` para adicionar colunas J–P (`utm_source` … `referrer`) e mover o range para `Leads!A:P`.

---

## 6. Checklist de validação

Sempre que ajustar campanhas ou tags, rodar nesta ordem:

- [ ] Abrir link com UTM em aba anônima:
  `https://www.ldccapital.com.br/diagnostico-gratuito?utm_source=youtube&utm_medium=video&utm_campaign=renda-fixa-credito&utm_content=dTT71qfy5qQ`
- [ ] Confirmar que os parâmetros aparecem na URL após o load.
- [ ] DevTools → Application → Local Storage → conferir `ldc_utm_attribution_v1`.
- [ ] Preencher o formulário com dados válidos.
- [ ] Confirmar tela de sucesso `Obrigado pelo seu interesse!`.
- [ ] Confirmar lead salvo no Supabase (tabela `Client`) com UTMs no campo `notes`.
- [ ] DevTools → Console → `window.dataLayer` deve conter um evento `diagnostico_agendado` com todos os UTMs preenchidos.
- [ ] No **GTM Preview** (Tag Assistant), confirmar que o evento foi detectado e a Tag GA4 disparou.
- [ ] No **GA4 → Realtime → Events**, confirmar que `diagnostico_agendado` apareceu em até 1 min.
- [ ] Após 24h, validar em **Aquisição → Aquisição de tráfego** que `youtube / video / renda-fixa-credito` aparece como linha.

### Testes negativos obrigatórios

- [ ] Submeter form com campo obrigatório vazio → `dataLayer.push` **NÃO** deve ocorrer.
- [ ] Forçar erro de rede (DevTools → Offline) → `dataLayer.push` **NÃO** deve ocorrer.
- [ ] Acessar a página sem UTM, navegar e voltar → UTMs anteriores devem persistir no `localStorage`.

---

## 7. Teste local

```bash
# 1. Adicionar GTM ID de teste no .env
echo 'NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX' >> .env

# 2. Rodar dev
npm run dev

# 3. Abrir
http://localhost:3000/diagnostico-gratuito?utm_source=youtube&utm_medium=video&utm_campaign=renda-fixa-credito&utm_content=dTT71qfy5qQ&utm_term=descricao
```

Validar pelo console:

```js
JSON.parse(localStorage.getItem("ldc_utm_attribution_v1"))
window.dataLayer
```

---

## 8. Arquivos tocados nesta entrega

| Arquivo | Propósito |
|---|---|
| `src/components/Analytics.tsx` | Aceita `gtmId` e injeta script GTM head + iframe noscript. |
| `src/app/layout.tsx` | Lê `NEXT_PUBLIC_GTM_ID` e repassa ao `<Analytics>`. |
| `src/lib/utm.ts` | Captura UTMs da URL, persiste em `localStorage` por 30d. |
| `src/app/lib/schema.ts` | `leadFormSchema` ganha 7 campos opcionais (UTMs + landing/referrer). |
| `src/app/components/LeadForm.tsx` | Captura na montagem, envia no payload, dispara `diagnostico_agendado` no sucesso. |
| `src/app/api/lead/route.ts` | Aceita UTMs no payload e serializa em `Client.notes`. |
| `docs/analytics-ga4-utm.md` | Este documento. |

## 9. Limitações conhecidas

- **Captura cross-page:** `captureUtmFromUrl()` é invocado dentro do `LeadForm` (mount), portanto só dispara quando o usuário **aterrissa em `/diagnostico-gratuito`**. Para o caso YouTube → link direto isso é suficiente. Se no futuro existirem campanhas que aterrissam em outras páginas (ex.: `/`) e o usuário só vai ao formulário depois, mover a captura para o `layout.tsx` (Client Component wrapper) para cobrir qualquer entry point.
- **Dupla contagem GA4:** o snippet GA4 em `Analytics.tsx` continua disparando `gtag('config', GA_ID)`. Se você adicionar uma tag **GA4 Configuration** dentro do container GTM com o mesmo `G-…`, vai duplicar pageviews. Escolha uma das duas: (a) manter o snippet inline e usar GTM só para eventos custom (recomendado, menos refactor) **ou** (b) remover o snippet GA4 inline e migrar GA4 inteiro para dentro do GTM.

## 10. O que **NÃO** foi alterado (e por quê)

- `.env` real — alteração requer PAUSE (CLAUDE.md). Adicionar `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` manualmente (template já em `.env.example`).
- `supabase/migrations/` — nenhuma migração nova; apenas DDL sugerida na seção 5.
- `next.config.ts`, `vercel.json` — fora do escopo.

---

## 11. Painel admin de rastreamento de vídeos (F-020)

> Adicionado 2026-06-02. Feature Contract: `docs/plans/feature-contracts/F-admin-video-tracking.md`.

Painel em `/admin` que gera links UTM e cruza **leads do Supabase** (`Client`, via `utm_content = videoId`) com **métricas do YouTube Data API v3**. Não usa GA4 Data API.

### 11.1 Páginas

| Rota | Função |
|---|---|
| `/admin/videos` | Lista de vídeos rastreados (filtros: campanha, período, busca; sort por leads_30d; paginação 20). |
| `/admin/videos/new` | Cria/edita: cola URL do YouTube, define `utm_campaign` (chips dos 6 slugs oficiais + normalização), gera/copia link UTM. Edição via `?id=`. |
| `/admin/videos/[id]` | Detalhe: KPIs (views/leads/conversão/última lead), LineChart leads/dia 90d, BarChart leads por origem, tabela de leads, botão "Atualizar métricas". |
| `/admin/analytics/utm` | Dashboard global: cards (total/com-UTM/share/top campanha), BarCharts por campanha e source, LineChart leads/dia, top 10 vídeos. |

### 11.2 Rotas API (todas com `checkAdminAuth` + service role)

`POST/GET /api/admin/videos` · `GET/PATCH/DELETE /api/admin/videos/[id]` · `POST .../[id]/refresh` (rate-limit 1/min) · `GET .../[id]/leads` · `GET .../preview` · `GET /api/admin/analytics/utm`.

Resposta padrão: `{ success: true, data }` | `{ success: false, message, errors? }`.

### 11.3 Banco

Tabela nova `tracked_videos` (migration `20260602190000_create_tracked_videos`): cache de métricas YouTube + `utm_campaign`. RLS habilitado (`is_admin_or_editor()` como defesa em profundidade; gate operacional é app-layer). **Não altera `Client`** — o join de leads é `Client.utm_content = tracked_videos.youtube_video_id`. Leads sem vídeo correspondente são "órfãos".

### 11.4 Env

`YOUTUBE_API_KEY` (server-only, **nunca** `NEXT_PUBLIC_`). Sem a chave, o painel funciona mas exibe "métrica indisponível" (degradação graciosa). Adicionar em `.env` local e nos environments da Vercel.

### 11.5 Geração de link (consistente com §1)

`buildUtmUrl` produz `https://www.ldccapital.com.br/diagnostico-gratuito?utm_source=youtube&utm_medium=video&utm_campaign=<slug>&utm_content=<videoId>[&utm_term=...]`. A normalização de slug (`normalizeCampaignSlug`) garante minúsculas-com-hífen-sem-acento. Os 6 slugs oficiais (§1) aparecem como chips; outros valores são aceitos com aviso suave.
