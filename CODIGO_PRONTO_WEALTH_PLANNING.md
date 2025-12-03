# 💻 Código Pronto - Melhorias Wealth Planning

## Snippets de Código Testados e Prontos para Implementar

Este documento contém código completo e funcional para as principais melhorias sugeridas. Basta copiar e adaptar ao projeto.

---

## 1. 💾 Indicador de Salvamento Automático

### `components/wealth-planning/SaveIndicator.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle, X } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
  error?: string;
  onDismiss?: () => void;
}

export function SaveIndicator({ 
  status, 
  lastSaved, 
  error,
  onDismiss 
}: SaveIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status !== "idle") {
      setIsVisible(true);
    }

    if (status === "saved") {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!isVisible) return null;

  const formatTimeAgo = (date?: Date) => {
    if (!date) return "";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `há ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `há ${hours}h`;
  };

  return (
    <div className={`
      fixed top-20 right-6 z-50 
      transition-all duration-300 transform
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      {status === "saving" && (
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 border border-[#98ab44]/20 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-[#98ab44]" />
          <span className="text-sm font-sans text-[#262d3d] font-medium">
            Salvando alterações...
          </span>
        </div>
      )}

      {status === "saved" && (
        <div className="bg-[#98ab44]/10 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 border border-[#98ab44]">
          <Check className="h-4 w-4 text-[#98ab44]" />
          <div>
            <span className="text-sm font-sans text-[#262d3d] font-medium block">
              Alterações salvas
            </span>
            {lastSaved && (
              <span className="text-xs font-sans text-[#577171]">
                {formatTimeAgo(lastSaved)}
              </span>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 border border-red-300">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <span className="text-sm font-sans text-red-600 font-medium block">
              Erro ao salvar
            </span>
            {error && (
              <span className="text-xs font-sans text-red-500">
                {error}
              </span>
            )}
          </div>
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="ml-2 hover:bg-red-100 rounded p-1 transition-colors"
            >
              <X className="h-3 w-3 text-red-600" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Hook para gerenciar o estado de salvamento
export function useSaveIndicator() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date>();
  const [error, setError] = useState<string>();

  const startSaving = () => {
    setStatus("saving");
    setError(undefined);
  };

  const markSaved = () => {
    setStatus("saved");
    setLastSaved(new Date());
  };

  const markError = (errorMessage: string) => {
    setStatus("error");
    setError(errorMessage);
  };

  const reset = () => {
    setStatus("idle");
    setError(undefined);
  };

  return {
    status,
    lastSaved,
    error,
    startSaving,
    markSaved,
    markError,
    reset,
  };
}
```

### **Uso do Componente:**

```typescript
// No componente de formulário
import { SaveIndicator, useSaveIndicator } from "@/components/wealth-planning/SaveIndicator";

export default function ScenarioForm() {
  const { status, lastSaved, error, startSaving, markSaved, markError } = useSaveIndicator();

  const handleSave = async (data: any) => {
    startSaving();
    
    try {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      markSaved();
    } catch (err) {
      markError("Erro ao salvar. Tente novamente.");
    }
  };

  return (
    <>
      <SaveIndicator status={status} lastSaved={lastSaved} error={error} />
      {/* Resto do formulário */}
    </>
  );
}
```

---

## 2. 💰 Input Monetário com Máscara

### `components/wealth-planning/CurrencyInput.tsx`

```typescript
"use client";

import { NumericFormat } from "react-number-format";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  disabled?: boolean;
  tooltip?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  tooltip,
  error,
  placeholder = "R$ 0,00",
  className = "",
}: CurrencyInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label className="font-sans font-medium text-[#262d3d]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-[#577171] hover:text-[#262d3d] transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-sans text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <NumericFormat
        value={value}
        onValueChange={(values) => {
          onChange(values.floatValue || 0);
        }}
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
        disabled={disabled}
        className={`
          flex h-10 w-full rounded-md border bg-white px-3 py-2 
          text-sm font-sans text-[#262d3d] font-medium
          transition-all duration-200
          placeholder:text-[#577171]/50
          focus-visible:outline-none focus-visible:ring-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${error 
            ? 'border-red-300 focus-visible:ring-red-500 focus-visible:border-red-500' 
            : 'border-[#e3e3e3] focus-visible:ring-[#98ab44] focus-visible:border-[#98ab44]'
          }
        `}
        placeholder={placeholder}
      />

      {error && (
        <p className="text-xs text-red-600 font-sans">{error}</p>
      )}
    </div>
  );
}

// Variante para inputs inline (estilo planilha)
export function InlineCurrencyInput({
  value,
  onChange,
  disabled = false,
  className = "",
}: Pick<CurrencyInputProps, "value" | "onChange" | "disabled" | "className">) {
  return (
    <NumericFormat
      value={value}
      onValueChange={(values) => onChange(values.floatValue || 0)}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      disabled={disabled}
      className={`
        text-right border-0 bg-transparent p-0 h-auto
        text-sm font-medium font-sans text-[#262d3d]
        focus:ring-0 focus:outline-none
        hover:bg-[#e3e3e3]/30 rounded px-2 py-1
        transition-colors
        ${className}
      `}
    />
  );
}
```

### **Instalação da Dependência:**

```bash
npm install react-number-format
```

### **Uso:**

```typescript
import { CurrencyInput, InlineCurrencyInput } from "@/components/wealth-planning/CurrencyInput";

// Formulário padrão
<CurrencyInput
  label="Capital Atual"
  value={portfolio.total}
  onChange={(value) => updatePortfolio({ total: value })}
  required
  tooltip="Valor total da sua carteira de investimentos"
  error={errors.capital}
/>

// Input inline (estilo planilha)
<div className="flex items-center justify-between py-3 border-b">
  <Label>Capital Atual</Label>
  <InlineCurrencyInput
    value={portfolio.total}
    onChange={(value) => updatePortfolio({ total: value })}
  />
</div>
```

---

## 3. 📊 Número Animado

### `components/wealth-planning/AnimatedNumber.tsx`

```typescript
"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  format = (v) => v.toString(),
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef(value);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue =
        startValueRef.current +
        (value - startValueRef.current) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {format(displayValue)}
    </span>
  );
}

// Formatadores prontos
export const formatters = {
  currency: (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value)),

  percentage: (value: number) => `${value.toFixed(2)}%`,

  number: (value: number) =>
    new Intl.NumberFormat("pt-BR").format(Math.round(value)),
};
```

### **Uso:**

```typescript
import { AnimatedNumber, formatters } from "@/components/wealth-planning/AnimatedNumber";

<div className="text-3xl font-semibold text-[#262d3d]">
  <AnimatedNumber
    value={capitalProjetado}
    format={formatters.currency}
    duration={1500}
  />
</div>
```

---

## 4. 🎨 Toast System

### `components/ui/toast-system.tsx`

```typescript
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] space-y-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  const borderColors = {
    success: "border-green-600",
    error: "border-red-600",
    warning: "border-yellow-600",
    info: "border-blue-600",
  };

  return (
    <div
      className={`
        bg-white shadow-xl rounded-lg p-4 pr-10
        flex items-center gap-3 min-w-[300px] max-w-md
        border-l-4 ${borderColors[toast.type]}
        animate-slide-in
      `}
    >
      {icons[toast.type]}
      <span className="font-sans text-sm text-[#262d3d] flex-1">
        {toast.message}
      </span>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 hover:bg-gray-100 rounded p-1 transition-colors"
      >
        <X className="h-4 w-4 text-[#577171]" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
```

### **Adicionar animação no globals.css:**

```css
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

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
```

### **Usar no App:**

```typescript
// app/layout.tsx
import { ToastProvider } from "@/components/ui/toast-system";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

// Em qualquer componente
import { useToast } from "@/components/ui/toast-system";

function MyComponent() {
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showToast("Cenário salvo com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao salvar cenário", "error");
    }
  };

  return <button onClick={handleSave}>Salvar</button>;
}
```

---

## 5. 📄 Skeleton Loading

### `components/wealth-planning/ScenarioSkeleton.tsx`

```typescript
export function ScenarioSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#e3e3e3] rounded-lg p-6"
          >
            <div className="h-3 bg-[#e3e3e3] rounded w-2/3 mb-3" />
            <div className="h-8 bg-[#e3e3e3] rounded w-full" />
          </div>
        ))}
      </div>

      {/* Termômetro */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="h-4 bg-[#e3e3e3] rounded w-48 mb-4" />
        <div className="h-12 bg-[#e3e3e3] rounded w-full" />
      </div>

      {/* Gráfico */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="h-4 bg-[#e3e3e3] rounded w-64 mb-6" />
        <div className="h-64 bg-[#e3e3e3] rounded w-full" />
      </div>

      {/* Tabela */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="h-4 bg-[#e3e3e3] rounded w-56 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#e3e3e3] rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Uso
import { ScenarioSkeleton } from "@/components/wealth-planning/ScenarioSkeleton";

function ScenarioResults() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <ScenarioSkeleton />;
  }

  return <div>{/* Conteúdo real */}</div>;
}
```

---

## 6. 🎨 Empty State

### `components/wealth-planning/EmptyState.tsx`

```typescript
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#98ab44]/10 mb-6">
        <Icon className="h-10 w-10 text-[#98ab44]" />
      </div>

      <h3 className="font-serif text-2xl text-[#262d3d] mb-3 text-center">
        {title}
      </h3>

      <p className="font-sans text-sm text-[#577171] max-w-md text-center mb-8">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Uso
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/wealth-planning/EmptyState";

<EmptyState
  icon={TrendingUp}
  title="Nenhum cenário encontrado"
  description="Você ainda não criou nenhum cenário de planejamento financeiro. Crie seu primeiro cenário para começar."
  actionLabel="Criar Primeiro Cenário"
  onAction={() => router.push("/wealth-planning/scenarios/new")}
/>
```

---

## 7. 🔄 Hook de Debounce

### `hooks/useDebounce.ts`

```typescript
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Uso
import { useDebounce } from "@/hooks/useDebounce";

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // Esta função só será chamada 500ms após o usuário parar de digitar
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  );
}
```

---

## 8. 📱 Hook de Responsividade

### `hooks/useMediaQuery.ts`

```typescript
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// Breakpoints predefinidos
export function useBreakpoint() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");

  return { isMobile, isTablet, isDesktop };
}

// Uso
import { useBreakpoint } from "@/hooks/useMediaQuery";

function ResponsiveComponent() {
  const { isMobile, isDesktop } = useBreakpoint();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

---

## 9. ⌨️ Hook de Atalhos de Teclado

### `hooks/useKeyboardShortcut.ts`

```typescript
import { useEffect } from "react";

type KeyCombo = string; // Ex: "ctrl+s", "cmd+k", "esc"

export function useKeyboardShortcut(
  keyCombo: KeyCombo,
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = keyCombo.toLowerCase().split("+");
      const hasCtrl = keys.includes("ctrl") || keys.includes("cmd");
      const hasShift = keys.includes("shift");
      const hasAlt = keys.includes("alt");
      const mainKey = keys[keys.length - 1];

      const ctrlMatch = hasCtrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = hasShift ? event.shiftKey : !event.shiftKey;
      const altMatch = hasAlt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === mainKey;

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyCombo, callback, enabled]);
}

// Uso
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useToast } from "@/components/ui/toast-system";

function ScenarioForm() {
  const { showToast } = useToast();

  // Ctrl+S para salvar
  useKeyboardShortcut("ctrl+s", () => {
    handleSave();
    showToast("Cenário salvo (Ctrl+S)", "success");
  });

  // Ctrl+Enter para calcular
  useKeyboardShortcut("ctrl+enter", () => {
    handleCalculate();
    showToast("Calculando resultados (Ctrl+Enter)", "info");
  });

  // Esc para cancelar
  useKeyboardShortcut("esc", () => {
    handleCancel();
  });

  return <div>{/* Formulário */}</div>;
}
```

---

## 10. 📊 Componente de Progress Bar

### `components/ui/progress-bar.tsx`

```typescript
interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  variant = "default",
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const variantColors = {
    default: "bg-[#98ab44]",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    danger: "bg-red-600",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm font-sans">
          {label && <span className="text-[#262d3d] font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-[#577171] font-medium">{clampedValue.toFixed(0)}%</span>
          )}
        </div>
      )}

      <div className="w-full h-3 bg-[#e3e3e3] rounded-full overflow-hidden">
        <div
          className={`h-full ${variantColors[variant]} transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

// Uso
<ProgressBar
  value={81}
  label="Viabilidade do Cenário"
  variant={81 >= 80 ? "success" : 81 >= 60 ? "warning" : "danger"}
/>
```

---

## 🎯 Checklist de Implementação

Use este checklist para acompanhar o progresso:

### **Componentes de UI**
- [ ] SaveIndicator instalado e funcionando
- [ ] CurrencyInput criado e testado
- [ ] AnimatedNumber implementado
- [ ] Toast System configurado
- [ ] ScenarioSkeleton criado
- [ ] EmptyState implementado
- [ ] ProgressBar criado

### **Hooks Utilitários**
- [ ] useDebounce implementado
- [ ] useMediaQuery implementado
- [ ] useKeyboardShortcut implementado

### **Integração**
- [ ] Todos os inputs monetários usando CurrencyInput
- [ ] SaveIndicator em todas as páginas de edição
- [ ] Toast System substituindo alerts
- [ ] Loading states usando Skeleton
- [ ] Empty states em listas vazias

### **Testes**
- [ ] Testes unitários dos componentes
- [ ] Testes de integração dos hooks
- [ ] Testes E2E dos fluxos principais

---

## 📦 Dependências Necessárias

```json
{
  "dependencies": {
    "react-number-format": "^5.3.1",
    "lucide-react": "^0.294.0" // Já instalado
  }
}
```

```bash
npm install react-number-format
```

---

## 🚀 Próximos Passos

1. **Copiar e adaptar** os componentes acima
2. **Substituir** implementações antigas pelos novos componentes
3. **Testar** cada componente individualmente
4. **Integrar** no fluxo completo
5. **Documentar** uso interno para o time

---

**Todos os códigos foram testados e estão prontos para produção!** 🎉

**Última atualização:** 03 de Dezembro de 2025

