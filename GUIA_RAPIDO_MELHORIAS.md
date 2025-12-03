# 🚀 Guia Rápido - Melhorias Wealth Planning

## ⚡ Início Rápido

### 1. Instalar Dependências

```bash
cd site-ldc
npm install
```

### 2. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000/wealth-planning`

---

## 📦 Novos Componentes Disponíveis

### SaveIndicator - Salvamento Automático

```tsx
import { SaveIndicator, useSaveIndicator } from "@/components/wealth-planning/SaveIndicator";

const saveIndicator = useSaveIndicator();

// Usar no seu componente
saveIndicator.startSaving();
saveIndicator.markSaved();
saveIndicator.markError("Mensagem de erro");

<SaveIndicator {...saveIndicator} onDismiss={saveIndicator.reset} />
```

**Onde está integrado**:
- ✅ InteractiveDashboard (salvamento automático de edições)

---

### CurrencyInput - Input Monetário

```tsx
import { CurrencyInput } from "@/components/wealth-planning/CurrencyInput";

<CurrencyInput
  label="Capital Atual"
  value={valor}
  onChange={setValor}
  tooltip="Descrição opcional"
  required
/>
```

**Recursos**:
- Formatação automática BRL
- Máscara R$ 1.000,00
- Tooltips integrados
- Validação visual

---

### AnimatedNumber - Números Animados

```tsx
import { AnimatedNumber, formatters } from "@/components/wealth-planning/AnimatedNumber";

<AnimatedNumber
  value={capitalProjetado}
  format={formatters.currency}
/>
```

**Formatadores disponíveis**:
- `formatters.currency` → R$ 1.000.000
- `formatters.percentage` → 10.50%
- `formatters.number` → 1.000.000

**Onde está integrado**:
- ✅ InteractiveDashboard (métricas principais)

---

### Toast System - Notificações

```tsx
import { useToast } from "@/components/ui/toast-system";

const { showToast } = useToast();

// Usar em qualquer lugar
showToast("Sucesso!", "success");
showToast("Erro!", "error");
showToast("Informação", "info");
showToast("Atenção", "warning");
```

**Onde está integrado**:
- ✅ Dashboard (feedback de ações)
- ✅ Results Page (recálculo de cenários)
- ✅ Todas páginas (via Layout global)

---

### ScenarioSkeleton - Loading State

```tsx
import { ScenarioSkeleton } from "@/components/wealth-planning/ScenarioSkeleton";

{loading ? <ScenarioSkeleton /> : <ConteudoReal />}
```

**Onde está integrado**:
- ✅ Results Page (loading de cenário)

---

### EmptyState - Estados Vazios

```tsx
import { EmptyState } from "@/components/wealth-planning/EmptyState";
import { UserPlus } from "lucide-react";

<EmptyState
  icon={UserPlus}
  title="Nenhum cliente"
  description="Comece cadastrando um cliente"
  actionLabel="Novo Cliente"
  onAction={() => router.push("/novo")}
/>
```

**Onde está integrado**:
- ✅ Dashboard (lista vazia de clientes)

---

### ScenarioPreview - Card de Cenário

```tsx
import { ScenarioPreview } from "@/components/wealth-planning/ScenarioPreview";

<ScenarioPreview
  scenario={cenario}
  onDelete={() => handleDelete(cenario.id)}
/>
```

**Recursos**:
- Status visual (verde/amarelo/vermelho)
- Termômetro financeiro
- Ações rápidas (ver/editar/deletar)
- Animações de hover

---

### PDFGenerator - Exportar PDF

```tsx
import PDFGenerator from "@/components/wealth-planning/PDFGenerator";

<PDFGenerator
  scenarioId={scenario.id}
  clientName={client.name}
  scenarioTitle={scenario.title}
/>
```

**O que gera**:
- Capa personalizada
- Sumário executivo
- Tabela comparativa
- Layout profissional LDC

---

## 🎨 Hooks Utilitários

### useDebounce

```tsx
import { useDebounce } from "@/hooks/useDebounce";

const [value, setValue] = useState("");
const debouncedValue = useDebounce(value, 500);

// Use debouncedValue para API calls
```

---

### useBreakpoint

```tsx
import { useBreakpoint } from "@/hooks/useMediaQuery";

const { isMobile, isTablet, isDesktop } = useBreakpoint();

{isMobile && <MobileVersion />}
{isDesktop && <DesktopVersion />}
```

---

### useKeyboardShortcut

```tsx
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

useKeyboardShortcut("ctrl+s", handleSave);
useKeyboardShortcut("esc", handleClose);
useKeyboardShortcut("ctrl+k", handleSearch);
```

---

## 🎯 Padrões de Uso

### Pattern 1: Formulário com Auto-Save

```tsx
"use client";

import { useState, useEffect } from "react";
import { CurrencyInput } from "@/components/wealth-planning/CurrencyInput";
import { SaveIndicator, useSaveIndicator } from "@/components/wealth-planning/SaveIndicator";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast-system";

export function MeuFormulario() {
  const [data, setData] = useState({ campo1: 0, campo2: 0 });
  const debouncedData = useDebounce(data, 1000);
  const saveIndicator = useSaveIndicator();
  const { showToast } = useToast();

  useEffect(() => {
    async function save() {
      saveIndicator.startSaving();
      try {
        await fetch("/api/save", {
          method: "POST",
          body: JSON.stringify(debouncedData),
        });
        saveIndicator.markSaved();
      } catch (error) {
        saveIndicator.markError("Erro ao salvar");
        showToast("Erro ao salvar", "error");
      }
    }
    save();
  }, [debouncedData]);

  return (
    <>
      <SaveIndicator {...saveIndicator} />
      <CurrencyInput
        label="Campo 1"
        value={data.campo1}
        onChange={(v) => setData({ ...data, campo1: v })}
      />
    </>
  );
}
```

---

### Pattern 2: Lista com Empty State

```tsx
import { EmptyState } from "@/components/wealth-planning/EmptyState";
import { ScenarioPreview } from "@/components/wealth-planning/ScenarioPreview";
import { Plus } from "lucide-react";

export function ListaCenarios({ cenarios }) {
  if (cenarios.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="Nenhum cenário criado"
        description="Comece criando seu primeiro cenário"
        actionLabel="Criar Cenário"
        onAction={() => router.push("/novo")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cenarios.map((cenario) => (
        <ScenarioPreview key={cenario.id} scenario={cenario} />
      ))}
    </div>
  );
}
```

---

### Pattern 3: Loading + Dados + Empty

```tsx
import { ScenarioSkeleton } from "@/components/wealth-planning/ScenarioSkeleton";
import { EmptyState } from "@/components/wealth-planning/EmptyState";

export function MinhaLista() {
  const { data, loading, error } = useFetchData();

  if (loading) return <ScenarioSkeleton />;
  if (error) return <EmptyState icon={AlertCircle} title="Erro" />;
  if (!data || data.length === 0) return <EmptyState icon={Plus} title="Vazio" />;

  return <ConteudoReal data={data} />;
}
```

---

## 🎨 Estilos e Cores

### Paleta LDC Capital

```css
--color-ldc-primary: #262d3d;      /* Azul escuro */
--color-ldc-accent-1: #98ab44;     /* Verde principal */
--color-ldc-accent-2: #becc6a;     /* Verde claro */
--color-ldc-gray-light: #e3e3e3;   /* Cinza borda */
--color-ldc-neutral-medium: #577171; /* Cinza texto */
```

### Classes Úteis

```tsx
// Títulos
className="font-serif text-2xl text-[#262d3d]"

// Textos
className="font-sans text-sm text-[#577171]"

// Botões primários
className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white"

// Cards
className="bg-white border border-[#e3e3e3] rounded-lg p-6"

// Badges
className="bg-[#98ab44]/10 text-[#262d3d] font-sans"
```

---

## 🔧 Troubleshooting

### SaveIndicator não aparece
- Verifique se está usando o hook `useSaveIndicator()`
- Confirme que o componente está renderizado

### Toast não funciona
- Certifique-se que `<ToastProvider>` está no layout
- Importe de `@/components/ui/toast-system`

### AnimatedNumber não anima
- Verifique se o valor está realmente mudando
- Confirme que é um número válido

### CurrencyInput não formata
- Instale `react-number-format`: `npm install react-number-format`
- Reinicie o servidor de desenvolvimento

---

## ✅ Checklist de Integração

Ao adicionar melhorias em nova página:

- [ ] Importar `useToast` para feedback
- [ ] Adicionar `ScenarioSkeleton` no loading
- [ ] Usar `EmptyState` quando vazio
- [ ] Implementar `SaveIndicator` se houver edição
- [ ] Usar `CurrencyInput` para valores monetários
- [ ] Adicionar `AnimatedNumber` em métricas
- [ ] Aplicar paleta de cores LDC
- [ ] Testar responsividade mobile
- [ ] Adicionar tooltips informativos

---

## 📚 Documentação Completa

Ver: `MELHORIAS_IMPLEMENTADAS_WEALTH_PLANNING.md`

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:

1. Verifique a documentação completa
2. Confira exemplos de uso em componentes existentes
3. Inspecione o código dos componentes implementados
4. Revise os arquivos de integração

---

**Última atualização**: Dezembro 2025  
**Versão**: 1.0.0

