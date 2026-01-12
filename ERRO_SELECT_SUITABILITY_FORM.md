# ERRO: Select não abre no SuitabilityForm - Checkup LDC

## 📋 DESCRIÇÃO DO ERRO

**Problema:** Ao clicar no botão/trigger do componente Select para "Qual seu objetivo principal?" no formulário de suitability, o dropdown não abre. Nenhuma opção aparece e o usuário não consegue selecionar um valor.

**Comportamento esperado:** Ao clicar no SelectTrigger, o dropdown (SelectContent) deve abrir mostrando as opções disponíveis (OBJETIVOS).

**Comportamento atual:** Nada acontece ao clicar no SelectTrigger. O dropdown não abre.

**Severidade:** CRÍTICA - Bloqueia completamente o fluxo do usuário no Checkup LDC.

---

## 🎯 LOCALIZAÇÃO DO ERRO

### Fase do Site
- **Rota:** `/checkup-ldc`
- **Step/Etapa:** `step === 'suitability'` (terceira etapa do fluxo)
- **Fluxo completo:** 
  1. `input` - Usuário insere dados da carteira
  2. `types` - Confirmação de tipos de ativos
  3. **`suitability`** ← **ERRO AQUI**
  4. `analyzing` - Análise da carteira
  5. `preview` - Preview do relatório
  6. `report` - Relatório completo

### Componente Afetado
- **Nome do Componente:** `SuitabilityForm`
- **Localização do arquivo:** `src/app/checkup-ldc/components/SuitabilityForm.tsx`
- **Linha específica do Select problemático:** Linhas 79-102

### Botão/Elemento Específico
- **Label:** "Qual seu objetivo principal? *"
- **Elemento:** `<SelectTrigger>` com `id="objetivo"`
- **Linha no código:** Linha 86-90

---

## 📁 ARQUIVOS ENVOLVIDOS

### 1. Componente Principal (onde o erro ocorre)
**Arquivo:** `src/app/checkup-ldc/components/SuitabilityForm.tsx`
- **Linhas relevantes:** 77-106 (especialmente 79-102)
- **Componente:** `SuitabilityForm` (export function)
- **Estado:** `const [objetivo, setObjetivo] = useState<string>("")`
- **Select problemático:**
  ```tsx
  <Select 
    value={objetivo} 
    onValueChange={(value) => { setObjetivo(value); }}
    required
  >
    <SelectTrigger id="objetivo" className="w-full">
      <SelectValue placeholder="Selecione o objetivo" />
    </SelectTrigger>
    <SelectContent>
      {OBJETIVOS.map(obj => (
        <SelectItem key={obj.value} value={obj.value}>
          {obj.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  ```

### 2. Componente UI Base (Select)
**Arquivo:** `src/components/ui/select.tsx`
- **Componentes relevantes:**
  - `SelectTrigger` (linhas 27-54)
  - `SelectItem` (linhas 104-130)
  - `SelectContent` (linhas 56-89)
- **Biblioteca base:** `@radix-ui/react-select`
- **Import:** `import * as SelectPrimitive from "@radix-ui/react-select"`

### 3. Página que Renderiza o Componente
**Arquivo:** `src/app/checkup-ldc/page.tsx`
- **Linha relevante:** Linha 157
- **Como é usado:**
  ```tsx
  {step === 'suitability' && (
    <SuitabilityForm onSubmit={handleSuitabilitySubmit} />
  )}
  ```

### 4. Constantes (valores do Select)
**Arquivo:** `src/lib/checkup-ldc/constants.ts`
- **Constante usada:** `OBJETIVOS` (array de opções para o Select)

---

## 🔍 CONTEXTO TÉCNICO

### Stack Tecnológico
- **Framework:** Next.js 15.5.7
- **React:** Versão mais recente (via Next.js)
- **UI Library:** Radix UI (`@radix-ui/react-select`)
- **TypeScript:** Sim
- **Client Component:** Sim (`"use client"`)

### Estrutura do Select
O componente Select é um wrapper customizado sobre o Radix UI Select:
- `Select` → `SelectPrimitive.Root`
- `SelectTrigger` → `SelectPrimitive.Trigger`
- `SelectContent` → `SelectPrimitive.Content` (com Portal)
- `SelectItem` → `SelectPrimitive.Item`

### Estado Atual do Código

**SuitabilityForm.tsx:**
- ✅ Não tem handlers `onClick`, `onMouseDown`, `onPointerDown` no Card
- ✅ Não tem `useEffect` com listeners globais
- ✅ `SelectTrigger` não tem `preventDefault()` ou `stopPropagation()`
- ✅ `SelectItem` não tem handlers customizados bloqueando eventos

**select.tsx:**
- ✅ `SelectTrigger` passa `onClick` diretamente para `SelectPrimitive.Trigger`
- ✅ `SelectItem` passa `onClick` e `onPointerDown` diretamente
- ✅ Não há `preventDefault()` ou `stopPropagation()` bloqueando eventos

---

## 🐛 POSSÍVEIS CAUSAS

### 1. Conflito de Event Handlers
- Pode haver algum handler de evento em um componente pai que está interceptando o clique
- O `Card` component pode ter algum handler que não está visível no código

### 2. Problema com Radix UI Portal
- O `SelectContent` usa `SelectPrimitive.Portal` que renderiza fora do DOM tree
- Pode haver um problema de z-index ou posicionamento
- Pode haver um problema com o Portal não sendo renderizado

### 3. Problema com Estado do Radix UI
- O Radix UI Select gerencia seu próprio estado interno (`open`, `value`)
- Pode haver um conflito entre o estado controlado (`value={objetivo}`) e o estado interno

### 4. CSS/Estilos Bloqueando
- Pode haver CSS que está bloqueando a interação (ex: `pointer-events: none`)
- Pode haver z-index incorreto
- Pode haver overflow hidden em algum container pai

### 5. Problema de Hidratação (SSR)
- Pode haver um mismatch entre o HTML renderizado no servidor e no cliente
- O Radix UI pode não estar hidratando corretamente

### 6. Problema com o Card Component
- O `Card` component pode ter algum handler ou estilo que interfere
- O `cardRef` pode estar sendo usado de forma incorreta

---

## 🔧 TENTATIVAS DE CORREÇÃO JÁ REALIZADAS

1. ✅ Removidos handlers `onClick`, `onMouseDown`, `onPointerDown` do Card
2. ✅ Removido `useEffect` com listeners globais
3. ✅ Removido `preventDefault()` e `stopPropagation()` do `SelectTrigger`
4. ✅ Removido handlers customizados do `SelectItem`
5. ✅ Simplificado código para permitir funcionamento normal do Radix UI

**Resultado:** O erro persiste mesmo após todas essas correções.

---

## 🎯 O QUE INVESTIGAR

### 1. Verificar o Card Component
- **Arquivo:** `src/components/ui/card.tsx`
- Verificar se há handlers de eventos no Card que possam estar interferindo
- Verificar se há estilos CSS que bloqueiem interações

### 2. Verificar Event Propagation
- Adicionar `console.log` no `SelectTrigger` para verificar se o evento está chegando
- Verificar se há algum handler em um componente pai que está capturando o evento antes

### 3. Verificar o Portal do Radix UI
- Verificar se o `SelectPrimitive.Portal` está renderizando corretamente
- Verificar z-index e posicionamento do `SelectContent`

### 4. Verificar Estado do Radix UI
- Tentar usar o Select de forma não-controlada primeiro para testar
- Verificar se há conflito entre `value` controlado e estado interno

### 5. Verificar CSS/Estilos
- Inspecionar no DevTools se há CSS bloqueando
- Verificar `pointer-events`, `z-index`, `overflow`

### 6. Verificar Hidratação
- Verificar console do navegador por erros de hidratação
- Verificar se há warnings do React sobre mismatch

### 7. Testar Select Isolado
- Criar um componente de teste isolado com apenas o Select para verificar se funciona
- Se funcionar isolado, o problema está na integração com outros componentes

---

## 📝 INSTRUÇÕES PARA CORREÇÃO

1. **Primeiro:** Testar o Select isoladamente para confirmar que o problema não é do Radix UI em si
2. **Segundo:** Verificar se há algum handler de evento em componentes pais (Card, page.tsx, etc.)
3. **Terceiro:** Verificar CSS e estilos que possam estar bloqueando
4. **Quarto:** Verificar se há problemas de hidratação ou SSR
5. **Quinto:** Se necessário, considerar usar o Select de forma não-controlada temporariamente para isolar o problema

---

## 🧪 COMO REPRODUZIR

1. Acessar `http://localhost:3000/checkup-ldc`
2. Preencher dados da carteira (ou usar exemplo)
3. Clicar em "Gerar meu Checkup"
4. Confirmar tipos de ativos
5. **Chegar na etapa "suitability"**
6. **Clicar no Select "Qual seu objetivo principal?"**
7. **Observar:** Nada acontece, dropdown não abre

---

## 📊 INFORMAÇÕES ADICIONAIS

- **Ambiente:** Produção (Vercel) e Desenvolvimento Local
- **Navegador:** Testado em múltiplos navegadores (comportamento consistente)
- **Última correção tentada:** Remoção de handlers agressivos (commit f6a8b6c)
- **Status:** Erro persiste após múltiplas tentativas de correção

---

## 🔗 LINKS ÚTEIS

- **Documentação Radix UI Select:** https://www.radix-ui.com/primitives/docs/components/select
- **Arquivo do componente:** `src/app/checkup-ldc/components/SuitabilityForm.tsx`
- **Arquivo do Select UI:** `src/components/ui/select.tsx`
- **Página principal:** `src/app/checkup-ldc/page.tsx`

---

**Data do relatório:** 2025-01-08
**Prioridade:** CRÍTICA
**Status:** ABERTO - Aguardando correção

