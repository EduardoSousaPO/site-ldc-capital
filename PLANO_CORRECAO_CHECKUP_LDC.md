# Plano de Correção - Checkup-LDC

## 🔍 Erros Identificados

### 1. **CRÍTICO: Dependências não instaladas**
- **Erro**: `Module not found: Can't resolve 'papaparse'`
- **Erro**: `Module not found: Can't resolve 'xlsx'`
- **Causa**: As dependências estão no `package.json` mas não foram instaladas no `node_modules`
- **Impacto**: A aplicação não consegue compilar/executar

### 2. **POTENCIAL: Verificação de variáveis de ambiente**
- As variáveis estão configuradas no `.env`, mas precisam ser validadas em runtime
- Verificar se o LLM Orchestrator está inicializando corretamente

### 3. **POTENCIAL: Validação de APIs**
- Verificar se todas as rotas de API estão funcionando corretamente
- Validar conexão com Supabase

---

## 📋 Plano de Correção

### Fase 1: Instalação de Dependências (CRÍTICO - Prioridade 1)

**Objetivo**: Instalar todas as dependências necessárias para o Checkup-LDC funcionar.

**Ações**:
1. ✅ Verificar se `papaparse` e `xlsx` estão no `package.json` (já estão)
2. ⚠️ Executar `npm install` para instalar as dependências
3. ✅ Verificar se `@types/papaparse` está instalado (já está em devDependencies)

**Comando**:
```bash
cd site-ldc
npm install
```

**Validação**:
```bash
npm list papaparse xlsx
# Deve mostrar as versões instaladas
```

---

### Fase 2: Validação de Build (Prioridade 2)

**Objetivo**: Garantir que a aplicação compila sem erros.

**Ações**:
1. Executar build de produção para identificar erros de TypeScript/compilação
2. Verificar warnings e erros no console
3. Corrigir qualquer erro de tipo ou importação

**Comando**:
```bash
npm run build
```

**Validação**:
- Build deve completar sem erros
- Verificar se há warnings que precisam ser corrigidos

---

### Fase 3: Teste de Funcionalidade (Prioridade 3)

**Objetivo**: Testar o fluxo completo do Checkup-LDC no navegador.

**Cenários de Teste**:

#### 3.1. Teste de Input de Portfólio
- [ ] Acessar `/checkup-ldc`
- [ ] Verificar se a página carrega sem erros
- [ ] Testar colar carteira em formato texto
- [ ] Testar upload de arquivo CSV
- [ ] Testar upload de arquivo Excel
- [ ] Verificar se o parser funciona corretamente

#### 3.2. Teste de Confirmação de Tipos
- [ ] Verificar se os holdings são exibidos corretamente
- [ ] Testar seleção de tipos via dropdown
- [ ] Verificar se a confirmação funciona

#### 3.3. Teste de Formulário de Suitability
- [ ] Preencher todos os campos
- [ ] Verificar validação de campos obrigatórios
- [ ] Testar submissão do formulário

#### 3.4. Teste de Análise
- [ ] Verificar se a análise é executada
- [ ] Verificar se o score é calculado
- [ ] Verificar se os analytics são gerados
- [ ] Verificar se o preview é exibido

#### 3.5. Teste de Paywall
- [ ] Verificar se o modal de paywall aparece
- [ ] Testar cupons de desconto (TESTE, FREE, DESCONTO100, DEV)
- [ ] Verificar captura de leads
- [ ] Verificar atualização de status para 'paid'

#### 3.6. Teste de Relatório Completo
- [ ] Verificar se o relatório completo é gerado após pagamento
- [ ] Verificar se o LLM está sendo chamado corretamente
- [ ] Verificar se o relatório é exibido corretamente

#### 3.7. Teste de Geração de PDF
- [ ] Verificar se o PDF é gerado
- [ ] Verificar se o PDF é salvo no Supabase Storage
- [ ] Verificar se o download funciona

---

### Fase 4: Correção de Erros Identificados (Prioridade 4)

**Objetivo**: Corrigir todos os erros encontrados durante os testes.

**Checklist de Verificação**:

#### 4.1. Erros de Console
- [ ] Verificar console do navegador para erros JavaScript
- [ ] Verificar erros de rede (falhas de API)
- [ ] Verificar erros de autenticação/autorização

#### 4.2. Erros de API
- [ ] Testar cada endpoint individualmente
- [ ] Verificar logs do servidor para erros
- [ ] Validar respostas das APIs

#### 4.3. Erros de Banco de Dados
- [ ] Verificar se as queries estão corretas
- [ ] Verificar se as políticas RLS estão funcionando
- [ ] Verificar se os dados estão sendo salvos corretamente

#### 4.4. Erros de LLM
- [ ] Verificar se a API key do OpenAI está funcionando
- [ ] Verificar se o LLM Orchestrator está inicializando
- [ ] Verificar se os prompts estão corretos
- [ ] Verificar se as respostas do LLM estão sendo processadas

---

### Fase 5: Validação Final (Prioridade 5)

**Objetivo**: Garantir que tudo está funcionando perfeitamente.

**Ações**:
1. Executar todos os testes novamente
2. Verificar performance (tempo de resposta)
3. Verificar UX (fluxo do usuário)
4. Verificar responsividade (mobile/desktop)
5. Documentar qualquer limitação conhecida

---

## 🛠️ Comandos de Execução

### Instalação de Dependências
```bash
cd site-ldc
npm install
```

### Build e Validação
```bash
npm run build
npm run lint
```

### Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

### Testar no Navegador
1. Acessar: `http://localhost:3000/checkup-ldc`
2. Abrir DevTools (F12)
3. Verificar Console e Network tabs

---

## 📝 Checklist de Validação

### Dependências
- [ ] `papaparse` instalado
- [ ] `xlsx` instalado
- [ ] `@types/papaparse` instalado
- [ ] Todas as outras dependências instaladas

### Build
- [ ] Build completa sem erros
- [ ] Sem warnings críticos
- [ ] TypeScript compila sem erros

### Funcionalidades
- [ ] Input de portfólio funciona
- [ ] Parser funciona (texto, CSV, Excel)
- [ ] Confirmação de tipos funciona
- [ ] Formulário de suitability funciona
- [ ] Análise funciona
- [ ] Score é calculado
- [ ] Preview é exibido
- [ ] Paywall funciona
- [ ] Captura de leads funciona
- [ ] Relatório completo é gerado
- [ ] PDF é gerado e baixado

### APIs
- [ ] POST `/api/checkup-ldc/checkups` funciona
- [ ] POST `/api/checkup-ldc/checkups/[id]/holdings` funciona
- [ ] POST `/api/checkup-ldc/checkups/[id]/analyze` funciona
- [ ] POST `/api/checkup-ldc/checkups/[id]/pay` funciona
- [ ] POST `/api/checkup-ldc/checkups/[id]/report` funciona
- [ ] POST `/api/checkup-ldc/checkups/[id]/pdf` funciona
- [ ] GET `/api/checkup-ldc/checkups/[id]` funciona

### Banco de Dados
- [ ] Tabelas existem (Checkup, Holding, LLMRun, PolicyProfile)
- [ ] Policy Profile padrão existe
- [ ] RLS está configurado corretamente
- [ ] Dados são salvos corretamente

### LLM
- [ ] OpenAI API key está configurada
- [ ] LLM Orchestrator inicializa corretamente
- [ ] Chamadas ao LLM funcionam
- [ ] Respostas são processadas corretamente

---

## 🚨 Problemas Conhecidos

### 1. Dependências não instaladas
- **Status**: Identificado
- **Solução**: Executar `npm install`
- **Prioridade**: CRÍTICA

---

## 📊 Priorização

1. **CRÍTICO** (Fazer primeiro):
   - Instalar dependências (`npm install`)

2. **ALTO** (Fazer em seguida):
   - Validar build
   - Testar fluxo básico

3. **MÉDIO** (Fazer depois):
   - Testar todas as funcionalidades
   - Corrigir erros encontrados

4. **BAIXO** (Fazer por último):
   - Otimizações
   - Melhorias de UX
   - Documentação adicional

---

## ✅ Próximos Passos Imediatos

1. **AGORA**: Executar `npm install` no diretório `site-ldc`
2. **DEPOIS**: Executar `npm run build` para validar
3. **DEPOIS**: Reiniciar servidor de desenvolvimento
4. **DEPOIS**: Testar no navegador novamente
5. **DEPOIS**: Documentar novos erros encontrados (se houver)

---

**Data de Criação**: 2025-12-08  
**Status**: Aguardando execução da Fase 1

