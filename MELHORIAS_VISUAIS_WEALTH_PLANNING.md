# 🎨 Melhorias Visuais e de UX - Wealth Planning

## Guia Visual de Implementação

Este documento complementa a análise técnica com mockups e sugestões visuais concretas para melhorar a experiência do usuário.

---

## 1. 💾 Indicador de Salvamento

### **Problema Atual:**
Usuário não sabe se as alterações foram salvas.

### **Solução Visual:**

```
┌─────────────────────────────────────────┐
│  Wealth Planning       [Salvando... ⏳] │  ← Quando salvando
│                                          │
│  [ou]                                    │
│                                          │
│  Wealth Planning       [✓ Salvo há 2s]  │  ← Quando salvo
└─────────────────────────────────────────┘
```

### **Implementação:**

```tsx
// components/wealth-planning/SaveIndicator.tsx

export const SaveIndicator = ({ status, lastSaved }: Props) => {
  return (
    <div className="fixed top-20 right-6 z-50 transition-all">
      {status === 'saving' && (
        <div className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 border border-[#98ab44]/20">
          <Loader2 className="h-4 w-4 animate-spin text-[#98ab44]" />
          <span className="text-sm font-sans text-[#262d3d]">Salvando...</span>
        </div>
      )}
      
      {status === 'saved' && (
        <div className="bg-[#98ab44]/10 shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 border border-[#98ab44]">
          <Check className="h-4 w-4 text-[#98ab44]" />
          <span className="text-sm font-sans text-[#262d3d]">
            Salvo há {formatTimeAgo(lastSaved)}
          </span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 border border-red-300">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-sans text-red-600">Erro ao salvar</span>
        </div>
      )}
    </div>
  );
};
```

---

## 2. 💰 Máscaras Monetárias

### **Problema Atual:**
Campos numéricos sem formatação (ex: "50000" em vez de "R$ 50.000,00").

### **Antes vs Depois:**

```
ANTES:
┌──────────────────────────────┐
│ Capital Atual                │
│ [50000            ]          │
└──────────────────────────────┘

DEPOIS:
┌──────────────────────────────┐
│ Capital Atual                │
│ [R$ 50.000,00     ]          │
└──────────────────────────────┘
```

### **Implementação:**

```tsx
// components/wealth-planning/CurrencyInput.tsx

import { NumericFormat } from 'react-number-format';

export const CurrencyInput = ({ value, onChange, label }: Props) => {
  return (
    <div className="space-y-2">
      <Label className="font-sans">{label}</Label>
      <NumericFormat
        value={value}
        onValueChange={(values) => onChange(values.floatValue || 0)}
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale
        className="flex h-10 w-full rounded-md border border-[#e3e3e3] bg-white px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#98ab44] focus:border-[#98ab44] transition-all"
        placeholder="R$ 0,00"
      />
    </div>
  );
};

// Uso:
<CurrencyInput
  label="Capital Atual"
  value={portfolio?.total || 0}
  onChange={(value) => updateField('portfolio.total', value)}
/>
```

---

## 3. 📋 Preview de Cenário (Última Etapa do Wizard)

### **Layout Proposto:**

```
┌────────────────────────────────────────────────────────────┐
│  Novo Cenário de Planejamento                    [Voltar]  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Resumo do Cenário                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │ 👤 Dados Pessoais    │ 📝 Editar                     │   │
│  ├──────────────────────┴──────────────────────────────┤   │
│  │ Nome: João Silva                                     │   │
│  │ Idade: 35 anos → Aposentadoria: 60 anos             │   │
│  │ Expectativa de vida: 85 anos                         │   │
│  │ Perfil: Moderado-Agressivo                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │ 💰 Situação Atual    │ 📝 Editar                     │   │
│  ├──────────────────────┴──────────────────────────────┤   │
│  │ Capital Atual: R$ 500.000,00                         │   │
│  │ Poupança Mensal: R$ 5.000,00                         │   │
│  │ Renda Desejada: R$ 20.000,00/mês                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │ 📈 Projeção Rápida   │                               │   │
│  ├──────────────────────┴──────────────────────────────┤   │
│  │ Capital Necessário: R$ 6.000.000,00                  │   │
│  │ Capital Projetado: R$ 4.850.000,00                   │   │
│  │ ⚠️ Faltam: R$ 1.150.000,00 (19%)                     │   │
│  │                                                       │   │
│  │ 💡 Sugestão: Aumente poupança para R$ 7.500/mês      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [Voltar e Ajustar]    [Salvar e Ver Resultados Completos] │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### **Benefícios:**
- ✅ Usuário vê tudo antes de salvar
- ✅ Pode editar qualquer seção sem perder dados
- ✅ Projeção rápida já dá uma prévia
- ✅ Sugestões automáticas

---

## 4. 📄 PDF Profissional - Template Visual

### **Capa Proposta:**

```
┌────────────────────────────────────────────┐
│                                             │
│          [Logo LDC Capital]                 │
│                                             │
│                                             │
│     RELATÓRIO DE WEALTH PLANNING            │
│                                             │
│     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                             │
│     Cliente: João Silva                     │
│     Cenário: Aposentadoria aos 60 anos      │
│     Data: 03 de Dezembro de 2025            │
│                                             │
│     Consultor: Maria Santos                 │
│     LDC Capital - Planejamento Financeiro   │
│                                             │
│                                             │
│                                             │
│     CONFIDENCIAL                            │
│                                             │
└────────────────────────────────────────────┘
```

### **Página de Sumário Executivo:**

```
┌────────────────────────────────────────────┐
│  SUMÁRIO EXECUTIVO                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                             │
│  📊 SITUAÇÃO ATUAL                          │
│  • Idade: 35 anos                           │
│  • Capital Atual: R$ 500.000,00             │
│  • Poupança Mensal: R$ 5.000,00             │
│  • Perfil: Moderado-Agressivo               │
│                                             │
│  🎯 OBJETIVOS                               │
│  • Aposentadoria aos: 60 anos               │
│  • Renda Desejada: R$ 20.000,00/mês         │
│  • Expectativa de Vida: 85 anos             │
│                                             │
│  📈 PROJEÇÃO                                │
│  ┌────────────────────────────────┐         │
│  │ Capital Necessário             │         │
│  │ R$ 6.000.000,00                │         │
│  ├────────────────────────────────┤         │
│  │ Capital Projetado              │         │
│  │ R$ 4.850.000,00 (81%)          │         │
│  └────────────────────────────────┘         │
│                                             │
│  ⚠️ ANÁLISE                                 │
│  Com sua poupança atual, você atingirá      │
│  81% do capital necessário. Para atingir    │
│  100%, sugerimos:                           │
│                                             │
│  ✓ Aumentar poupança para R$ 7.500/mês     │
│  ou                                         │
│  ✓ Adiar aposentadoria para 62 anos        │
│  ou                                         │
│  ✓ Aceitar renda de R$ 16.200/mês          │
│                                             │
└────────────────────────────────────────────┘
```

### **Página de Gráficos:**

```
┌────────────────────────────────────────────┐
│  EVOLUÇÃO DO PATRIMÔNIO                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                             │
│   [Gráfico de Linhas - 3 cenários]         │
│   ┌─────────────────────────────────────┐  │
│ 8M│                   ...Manutenção      │  │
│   │                 ..                   │  │
│ 6M│              ...  ─── Consumo        │  │
│   │           ...                        │  │
│ 4M│        ...    ─ ─ Atual              │  │
│   │     ...                              │  │
│ 2M│  ..                                  │  │
│   │..                                    │  │
│ 0 ├──────────────────────────────────────┤  │
│   35  40  45  50  55  60  65  70  75  80 │  │
│              Idade (anos)                 │  │
│   └─────────────────────────────────────┘  │
│                                             │
│  LEGENDA:                                   │
│  ─ ─ Cenário Atual (Poupança: R$ 5.000/mês)│
│  ─── Consumo do Patrimônio                  │
│  ... Manutenção do Patrimônio               │
│                                             │
└────────────────────────────────────────────┘
```

---

## 5. 📊 Dashboard Interativo - Melhorias

### **A. Termômetro Financeiro Aprimorado:**

```
┌──────────────────────────────────────────────┐
│  INDICADOR DE VIABILIDADE                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                               │
│  Seu cenário está 81% viável                  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │████████████████░░░░░░                  │  │
│  │   0%    25%    50%    75%    100%      │  │
│  └────────────────────────────────────────┘  │
│   🔴 Crítico  🟡 Atenção  🟢 Saudável       │
│                                               │
│  💡 Para atingir 100%:                        │
│  • Aumentar poupança em R$ 2.500/mês         │
│  • ou adiar aposentadoria 2 anos             │
│  • ou reduzir renda desejada em 19%          │
│                                               │
└──────────────────────────────────────────────┘
```

### **B. Cards de Métricas com Comparação:**

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ CAPITAL PROJETADO           │  │ CAPITAL NECESSÁRIO           │
│                             │  │                             │
│ R$ 4.850.000,00             │  │ R$ 6.000.000,00             │
│                             │  │                             │
│ 81% do necessário           │  │ Faltam R$ 1.150.000,00      │
│ ↑ +5% vs cenário anterior   │  │ ⚠️ Ajuste necessário        │
└─────────────────────────────┘  └─────────────────────────────┘

┌─────────────────────────────┐  ┌─────────────────────────────┐
│ APORTE MENSAL NECESSÁRIO     │  │ RENTABILIDADE NECESSÁRIA     │
│                             │  │                             │
│ R$ 7.500,00                 │  │ 8,2% a.a.                   │
│                             │  │                             │
│ +R$ 2.500 vs atual          │  │ ✓ Dentro do perfil          │
│ ⚠️ Ajuste recomendado       │  │ ✓ Realista                  │
└─────────────────────────────┘  └─────────────────────────────┘
```

---

## 6. 🎛️ Controles Tipo Planilha (Melhorados)

### **Implementação Atual:**
```
Idade Atual               [35]
Idade Aposentadoria       [60]
Capital Atual       [500000]
```

### **Implementação Melhorada:**

```
┌──────────────────────────────────────────────────────────┐
│  PARÂMETROS DO CENÁRIO                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│  ┌──────────────────────────┬──────────────────────────┐ │
│  │ Idade Atual              │       [35] anos    [-][+]│ │
│  ├──────────────────────────┼──────────────────────────┤ │
│  │ Idade Aposentadoria      │       [60] anos    [-][+]│ │
│  ├──────────────────────────┼──────────────────────────┤ │
│  │ Capital Atual            │  [R$ 500.000,00]  [-][+]│ │
│  ├──────────────────────────┼──────────────────────────┤ │
│  │ Poupança Mensal          │  [R$ 5.000,00]    [-][+]│ │
│  ├──────────────────────────┼──────────────────────────┤ │
│  │ Renda Desejada (Mensal)  │  [R$ 20.000,00]   [-][+]│ │
│  ├──────────────────────────┼──────────────────────────┤ │
│  │ Retorno Esperado         │       [7,5] % a.a. [-][+]│ │
│  └──────────────────────────┴──────────────────────────┘ │
│                                                           │
│  [Recalcular Agora]  [Restaurar Padrão]  [Duplicar]     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### **Recursos Adicionais:**
- Botões [-] e [+] para ajustar valores rapidamente
- Sliders para campos numéricos
- Atalho de teclado: Setas ↑↓ para ajustar valor focado
- Botão "Recalcular Agora" para forçar atualização imediata

---

## 7. 📱 Responsividade Mobile

### **Layout Desktop vs Mobile:**

#### **Desktop (Atual):**
```
┌────────────────────────────────────────────────┐
│  ┌──────────────┬──────────────────────────┐   │
│  │  Parâmetros  │   Gráfico de Projeção   │   │
│  │              │                          │   │
│  │              │       [Gráfico]          │   │
│  │              │                          │   │
│  └──────────────┴──────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │        Tabela Comparativa                │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

#### **Mobile (Proposto):**
```
┌──────────────────────┐
│  💾 Salvo há 2s      │
├──────────────────────┤
│                      │
│  📊 Capital          │
│  Projetado           │
│  R$ 4,8M             │
│                      │
├──────────────────────┤
│                      │
│  🎯 Necessário       │
│  R$ 6,0M             │
│  (Faltam R$ 1,2M)    │
│                      │
├──────────────────────┤
│                      │
│  [Gráfico]           │
│  [Simplificado]      │
│                      │
├──────────────────────┤
│                      │
│  Parâmetros ▼        │
│  (Expandir)          │
│                      │
├──────────────────────┤
│                      │
│  Cenários ▼          │
│  (Expandir)          │
│                      │
├──────────────────────┤
│                      │
│  [Exportar PDF]      │
│                      │
└──────────────────────┘
```

### **Otimizações Mobile:**
- Cards empilhados verticalmente
- Gráficos simplificados (só linha principal)
- Seções expansíveis (accordion)
- Botões maiores (min 44px altura)
- Scroll horizontal em tabelas

---

## 8. 🔄 Loading States e Skeleton Screens

### **Durante Carregamento:**

```
┌──────────────────────────────────────────┐
│  Carregando seu cenário...               │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ████████░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  └────────────────────────────────────┘ │
│  Processando cálculos... (75%)          │
│                                          │
│  [ou Skeleton Screen:]                  │
│                                          │
│  ┌──────────────┬──────────────────┐   │
│  │ ████░░░░░░   │  ████░░░░░░░░░░  │   │
│  │ ████░░░░     │                   │   │
│  │ ████░░░░░░   │  ████░░░░░░░░    │   │
│  └──────────────┴──────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  ████░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  │  ████░░░░░░░░░░░░░░              │  │
│  └──────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### **Implementação:**

```tsx
// components/wealth-planning/ScenarioSkeleton.tsx

export const ScenarioSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#e3e3e3] rounded-lg p-6">
            <div className="h-4 bg-[#e3e3e3] rounded w-1/2 mb-3" />
            <div className="h-8 bg-[#e3e3e3] rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="h-64 bg-[#e3e3e3] rounded" />
      </div>

      {/* Tabela */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#e3e3e3] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 9. 🎨 Paleta de Cores - Guia de Uso

### **Cores Principais:**

```
#262d3d (Azul Escuro)
████████  - Títulos principais, texto importante
          - Headers, labels primários

#98ab44 (Verde Oliva)
████████  - CTAs, botões de ação
          - Indicadores positivos, sucesso
          - Links hover

#e3e3e3 (Cinza Claro)
████████  - Bordas, divisores
          - Backgrounds de cards
          - Estados disabled

#577171 (Cinza Médio)
████████  - Texto secundário
          - Labels de apoio
          - Placeholders
```

### **Cores de Status:**

```
✅ Sucesso:    #10b981 (Verde)
⚠️ Atenção:    #f59e0b (Amarelo/Laranja)
❌ Erro:       #ef4444 (Vermelho)
ℹ️ Info:       #3b82f6 (Azul)
```

---

## 10. ⚡ Micro-interações

### **A. Hover em Cards:**

```tsx
<div className="
  border border-[#e3e3e3] 
  rounded-lg p-6 
  transition-all duration-300
  hover:shadow-lg 
  hover:border-[#98ab44]/30
  hover:-translate-y-1
  cursor-pointer
">
  {/* Conteúdo do card */}
</div>
```

### **B. Click em Botões:**

```tsx
<button className="
  bg-[#98ab44] text-white
  px-6 py-3 rounded-lg
  font-sans font-medium
  transition-all duration-200
  hover:bg-[#98ab44]/90
  hover:shadow-md
  active:scale-95
  focus:ring-4 focus:ring-[#98ab44]/20
">
  Salvar Cenário
</button>
```

### **C. Transições Suaves:**

```tsx
// components/wealth-planning/AnimatedNumber.tsx

export const AnimatedNumber = ({ value, duration = 1000 }: Props) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = displayValue;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const currentValue = start + (end - start) * progress;
      
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value]);

  return (
    <span className="font-semibold text-[#262d3d] font-sans tabular-nums">
      {formatCurrency(displayValue)}
    </span>
  );
};
```

---

## 📦 Componentes Prontos para Implementar

### **1. Toast/Notification System**

```tsx
// components/ui/toast.tsx

export const Toast = ({ message, type, onClose }: Props) => {
  return (
    <div className={`
      fixed bottom-6 right-6 z-50
      bg-white shadow-xl rounded-lg p-4
      flex items-center gap-3
      border-l-4
      ${type === 'success' ? 'border-[#10b981]' : 
        type === 'error' ? 'border-[#ef4444]' : 
        'border-[#3b82f6]'}
      animate-slide-in
    `}>
      {type === 'success' && <CheckCircle className="h-5 w-5 text-[#10b981]" />}
      {type === 'error' && <XCircle className="h-5 w-5 text-[#ef4444]" />}
      {type === 'info' && <Info className="h-5 w-5 text-[#3b82f6]" />}
      
      <span className="font-sans text-sm text-[#262d3d]">{message}</span>
      
      <button onClick={onClose} className="ml-4">
        <X className="h-4 w-4 text-[#577171]" />
      </button>
    </div>
  );
};
```

### **2. Empty State**

```tsx
// components/wealth-planning/EmptyState.tsx

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: Props) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#98ab44]/10 mb-4">
        <Icon className="h-8 w-8 text-[#98ab44]" />
      </div>
      
      <h3 className="font-serif text-xl text-[#262d3d] mb-2">
        {title}
      </h3>
      
      <p className="font-sans text-sm text-[#577171] max-w-md mx-auto mb-6">
        {description}
      </p>
      
      {action}
    </div>
  );
};

// Uso:
<EmptyState
  icon={TrendingUp}
  title="Nenhum cenário criado"
  description="Comece criando seu primeiro cenário de planejamento financeiro"
  action={
    <Button className="bg-[#98ab44]">
      <Plus className="mr-2 h-4 w-4" />
      Criar Primeiro Cenário
    </Button>
  }
/>
```

---

## 🎯 Checklist de Implementação

### **Fase 1: Críticas (1-2 semanas)**
- [ ] Indicador de salvamento
- [ ] Máscaras monetárias em todos os inputs
- [ ] Preview de cenário antes de salvar
- [ ] Loading states e skeletons
- [ ] Toast notifications

### **Fase 2: Importantes (2-3 semanas)**
- [ ] PDF profissional com template
- [ ] Gráficos interativos (Recharts)
- [ ] Responsividade mobile completa
- [ ] Micro-interações
- [ ] Empty states

### **Fase 3: Inovações (1-2 meses)**
- [ ] Dashboard comparativo
- [ ] Sistema de versioning
- [ ] Calculadora rápida
- [ ] Atalhos de teclado
- [ ] Testes E2E

---

## 🎬 Animações CSS (Prontas para Usar)

```css
/* globals.css */

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-border {
  0%, 100% {
    border-color: rgb(152, 171, 68, 0.5);
  }
  50% {
    border-color: rgb(152, 171, 68, 1);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

.animate-pulse-border {
  animation: pulse-border 2s ease-in-out infinite;
}
```

---

## 📐 Grid System Recomendado

```tsx
// Layouts responsivos com Tailwind

// Grid de 4 colunas (cards de métricas)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {metrics.map(metric => <MetricCard key={metric.id} {...metric} />)}
</div>

// Grid 2 colunas (parâmetros + gráfico)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
  <ParametersPanel />
  <ChartsPanel />
</div>

// Grid 3 colunas (cenários)
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  <ScenarioCard scenario="current" />
  <ScenarioCard scenario="maintenance" />
  <ScenarioCard scenario="consumption" />
</div>
```

---

**Documento Visual por:** Claude  
**Data:** 03 de Dezembro de 2025  
**Versão:** 1.0

🎨 Use este guia como referência visual durante a implementação!

