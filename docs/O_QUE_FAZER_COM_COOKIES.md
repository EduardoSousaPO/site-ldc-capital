# 🍪 O Que Você Pode Fazer Com Os Cookies Implementados

Este documento explica todas as funcionalidades e possibilidades de uso dos cookies de análise e marketing que foram implementados no site.

---

## 📊 **COOKIES DE ANÁLISE (Google Analytics 4)**

### 1. **Rastreamento de Comportamento dos Visitantes**

#### O que você pode ver no Google Analytics:

✅ **Audiência**:
- Quantos visitantes únicos o site recebe
- De onde vêm (país, cidade)
- Dispositivos usados (desktop, mobile, tablet)
- Navegadores e sistemas operacionais
- Idade e gênero (estimado)
- Interesses dos visitantes

✅ **Aquisição**:
- Como os visitantes chegaram ao site:
  - Google (busca orgânica)
  - Redes sociais
  - Links diretos
  - Outros sites (referrers)
- Quais palavras-chave trouxeram visitantes
- Performance de campanhas

✅ **Comportamento**:
- Quais páginas são mais visitadas
- Quanto tempo os visitantes ficam no site
- Taxa de rejeição (quem sai rapidamente)
- Fluxo de navegação (caminho que os visitantes fazem)
- Páginas de entrada e saída

✅ **Conversões**:
- Quantos formulários foram preenchidos
- Quantos downloads foram feitos
- Quantos botões de contato foram clicados
- Taxa de conversão geral

### 2. **Eventos Customizados que Você Pode Rastrear**

#### Eventos já implementados:

```typescript
import { trackEvent, trackLead, trackDownload, trackBlogView } from "@/lib/analytics";

// 1. Rastrear envio de formulário
trackLead("formulario-contato", 100);

// 2. Rastrear download de material
trackDownload("Guia de Investimentos", "ebook");

// 3. Rastrear visualização de post
trackBlogView("Como Investir no Exterior", "Investimentos");

// 4. Rastrear evento customizado
trackEvent("button_click", "engagement", "cta-hero");
```

#### Exemplos práticos de uso:

**No formulário de contato:**
```typescript
// src/app/components/LeadForm.tsx
import { trackLead } from "@/lib/analytics";

const onSubmit = async (data: LeadFormData) => {
  // ... código de envio ...
  
  if (response.ok && result.success) {
    // Rastrear conversão
    trackLead("formulario-home", 100);
  }
};
```

**No download de material:**
```typescript
// Quando usuário baixa um PDF
const handleDownload = (materialName: string) => {
  // ... lógica de download ...
  
  trackDownload(materialName, "ebook");
};
```

**Em botões importantes:**
```typescript
// Botão "Fale Conosco"
const handleContactClick = () => {
  trackEvent("button_click", "engagement", "cta-contato");
  // ... abrir formulário ...
};
```

### 3. **Relatórios e Insights que Você Pode Criar**

#### Relatórios Personalizados:

1. **Relatório de Conversões**:
   - Quantos leads foram gerados por dia/semana/mês
   - Taxa de conversão por página
   - Custo por lead (se usar Google Ads)

2. **Relatório de Conteúdo**:
   - Quais posts do blog são mais lidos
   - Quais materiais são mais baixados
   - Tempo médio de leitura

3. **Relatório de Origem**:
   - De onde vêm os melhores leads
   - Quais canais geram mais conversões
   - ROI de cada canal de marketing

4. **Relatório de Dispositivos**:
   - Performance em mobile vs desktop
   - Taxa de conversão por dispositivo
   - Páginas que precisam otimização mobile

### 4. **Integração com Google Ads**

Se você usar Google Ads, pode:
- Rastrear conversões de campanhas
- Criar públicos personalizados baseados em visitantes
- Fazer remarketing (mostrar anúncios para quem visitou)
- Otimizar campanhas baseado em dados reais

---

## 📱 **COOKIES DE MARKETING (Meta Pixel)**

### 1. **Rastreamento de Campanhas no Facebook/Instagram**

#### O que você pode fazer:

✅ **Criar Públicos Personalizados**:
- Pessoas que visitaram o site
- Pessoas que preencheram formulário
- Pessoas que baixaram material
- Pessoas que leram posts específicos

✅ **Remarketing (Retargeting)**:
- Mostrar anúncios para quem visitou mas não converteu
- Re-engajar visitantes antigos
- Criar sequências de anúncios

✅ **Lookalike Audiences**:
- Encontrar pessoas similares aos seus melhores clientes
- Expandir alcance com público qualificado
- Reduzir custo por aquisição

### 2. **Eventos do Meta Pixel**

#### Eventos automáticos:
- `PageView` - Toda página visitada
- `Lead` - Quando formulário é enviado
- `ViewContent` - Visualização de conteúdo

#### Eventos customizados que você pode criar:

```typescript
import { trackMetaEvent } from "@/lib/analytics";

// Rastrear início de preenchimento de formulário
trackMetaEvent("InitiateCheckout", {
  content_name: "Formulário de Contato",
  value: 100,
  currency: "BRL"
});

// Rastrear visualização de página importante
trackMetaEvent("ViewContent", {
  content_name: "Página de Consultoria",
  content_category: "Serviços",
  content_type: "product"
});

// Rastrear conclusão de ação
trackMetaEvent("CompleteRegistration", {
  content_name: "Cadastro de Lead",
  status: true
});
```

### 3. **Otimização de Campanhas**

Com os dados do Pixel, você pode:

✅ **Otimizar para Conversões**:
- Meta vai mostrar anúncios para quem tem mais chance de converter
- Reduzir custo por lead
- Aumentar ROI das campanhas

✅ **Criar Campanhas Segmentadas**:
- Campanhas diferentes para diferentes públicos
- Mensagens personalizadas
- Criativos específicos

✅ **Medir ROI Real**:
- Ver quantos leads vieram do Facebook/Instagram
- Calcular custo real por conversão
- Comparar com outros canais

---

## 🎯 **CASOS DE USO PRÁTICOS**

### Caso 1: **Rastrear Qual Página Gera Mais Leads**

```typescript
// Em cada formulário, adicione:
trackLead("formulario-home", 100);
trackLead("formulario-contato", 100);
trackLead("formulario-consultoria", 100);

// No Google Analytics, você verá:
// - Qual página tem melhor taxa de conversão
// - Onde investir mais esforço
```

### Caso 2: **Entender o Caminho do Cliente**

```typescript
// Rastrear cada etapa do funil:
trackEvent("page_view", "funnel", "home");
trackEvent("button_click", "funnel", "saiba-mais");
trackEvent("form_start", "funnel", "formulario");
trackLead("formulario-completo", 100);

// Você verá no GA4:
// - Quantos começam o processo
// - Onde desistem
// - Como otimizar o funil
```

### Caso 3: **Remarketing Inteligente**

```typescript
// No Meta Pixel, você pode criar públicos:
// 1. Visitantes que viram página de consultoria mas não preencheram formulário
// 2. Visitantes que baixaram material mas não entraram em contato
// 3. Visitantes que leram blog mas não converteram

// Depois criar campanhas específicas para cada grupo
```

### Caso 4: **Medir Efetividade de Conteúdo**

```typescript
// Rastrear engajamento com conteúdo:
trackBlogView("Título do Post", "Categoria");
trackDownload("Nome do Material", "Tipo");

// No Analytics você verá:
// - Quais posts geram mais leads
// - Quais materiais são mais valiosos
// - Onde investir em criação de conteúdo
```

### Caso 5: **Otimizar Campanhas Pagas**

```typescript
// Com cookies, você pode:
// 1. Ver quais campanhas geram leads reais
// 2. Pausar campanhas que não convertem
// 3. Aumentar investimento nas que funcionam
// 4. Criar públicos similares aos convertidos
```

---

## 📈 **MÉTRICAS IMPORTANTES QUE VOCÊ PODE ACOMPANHAR**

### No Google Analytics:

1. **Taxa de Conversão**:
   - Quantos visitantes viram vs quantos converteram
   - Meta: 2-5% é considerado bom

2. **Taxa de Rejeição**:
   - Quantos saem sem interagir
   - Meta: Menos de 50% é bom

3. **Tempo na Página**:
   - Quanto tempo visitantes ficam
   - Meta: Mais de 2 minutos

4. **Páginas por Sessão**:
   - Quantas páginas cada visitante vê
   - Meta: Mais de 2 páginas

5. **Taxa de Retorno**:
   - Quantos visitantes voltam
   - Meta: Mais de 30%

### No Meta Pixel:

1. **Taxa de Conversão de Campanhas**:
   - Quantos cliques vs quantas conversões
   - Meta: Mais de 1%

2. **Custo por Lead (CPL)**:
   - Quanto custa cada lead gerado
   - Meta: Menor possível mantendo qualidade

3. **ROAS (Return on Ad Spend)**:
   - Retorno sobre investimento em anúncios
   - Meta: Mais de 3:1

---

## 🔧 **COMO IMPLEMENTAR RASTREAMENTO NOS FORMULÁRIOS**

### Exemplo Completo: Rastrear Formulário de Contato

```typescript
// src/app/components/LeadForm.tsx
"use client";

import { trackLead, trackEvent } from "@/lib/analytics";

export default function LeadForm() {
  const onSubmit = async (data: LeadFormData) => {
    // Rastrear início do preenchimento (opcional)
    trackEvent("form_start", "engagement", "formulario-contato");
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // ✅ Rastrear conversão bem-sucedida
        trackLead("formulario-home", 100);
        
        // Rastrear evento adicional
        trackEvent("form_submit_success", "conversion", "formulario-contato");
        
        setIsSubmitted(true);
        reset();
      } else {
        // Rastrear erro (para identificar problemas)
        trackEvent("form_submit_error", "error", "formulario-contato");
      }
    } catch (error) {
      trackEvent("form_submit_error", "error", "formulario-contato");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ... seu formulário ...
  );
}
```

---

## 🎨 **CRIAR RELATÓRIOS PERSONALIZADOS**

### No Google Analytics 4:

1. **Acesse**: https://analytics.google.com/
2. **Vá em**: Explorar → Criar exploração
3. **Escolha tipo**: Tabela, Gráfico de linha, etc.
4. **Adicione dimensões**: Página, Origem, Dispositivo
5. **Adicione métricas**: Eventos, Conversões, Usuários
6. **Salve** para acessar depois

### Exemplo de Relatório Útil:

**"Leads por Origem"**:
- Dimensão: Origem/Meio
- Métrica: Evento "lead"
- Visualização: Tabela
- Mostra: De onde vêm os melhores leads

---

## 🚀 **PRÓXIMOS PASSOS RECOMENDADOS**

### 1. **Implementar Tracking nos Formulários**
- Adicionar `trackLead()` em todos os formulários
- Rastrear início e conclusão

### 2. **Criar Eventos Personalizados**
- Botões importantes
- Downloads
- Visualizações de vídeo
- Cliques em links externos

### 3. **Configurar Conversões no GA4**
- Marcar eventos importantes como conversões
- Definir valores para cada conversão

### 4. **Criar Públicos no Meta**
- Visitantes que não converteram
- Visitantes de páginas específicas
- Visitantes que baixaram materiais

### 5. **Configurar Remarketing**
- Criar campanhas de remarketing
- Personalizar mensagens por público
- Otimizar para conversões

---

## 📊 **DASHBOARDS ÚTEIS**

### Dashboard 1: Visão Geral
- Visitantes únicos (hoje, semana, mês)
- Taxa de conversão
- Principais fontes de tráfego
- Páginas mais visitadas

### Dashboard 2: Conversões
- Leads gerados por dia
- Taxa de conversão por página
- Custo por lead (se usar ads)
- Funil de conversão

### Dashboard 3: Conteúdo
- Posts mais lidos
- Materiais mais baixados
- Tempo médio de leitura
- Taxa de engajamento

---

## ⚠️ **IMPORTANTE: LGPD**

Todos os cookies respeitam a LGPD:
- ✅ Usuário pode aceitar ou rejeitar
- ✅ Usuário pode personalizar preferências
- ✅ Consentimento é armazenado localmente
- ✅ Cookies só são ativados após consentimento
- ✅ Política de privacidade disponível

---

## 🆘 **DÚVIDAS FREQUENTES**

**P: Os cookies funcionam mesmo se o usuário rejeitar?**
R: Cookies necessários sempre funcionam. Cookies de análise e marketing só funcionam se o usuário aceitar.

**P: Como vejo os dados coletados?**
R: Google Analytics: https://analytics.google.com/
   Meta Pixel: https://business.facebook.com/events_manager

**P: Posso rastrear usuários específicos?**
R: Não, por questões de privacidade. Os dados são anonimizados e agregados.

**P: Quanto tempo os dados ficam armazenados?**
R: Google Analytics: 14 meses (padrão), pode configurar até 50 meses
   Meta Pixel: Conforme política do Facebook

**P: Preciso avisar os usuários sobre cookies?**
R: Sim, e já está implementado! O banner aparece automaticamente.

---

**Última atualização**: Janeiro 2025

