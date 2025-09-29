# 🔍 PROMPT PARA INVESTIGAÇÃO COMPLETA - ERRO "UNAUTHORIZED"

## 📋 CONTEXTO DO PROBLEMA

O sistema de blog/materiais do site LDC Capital está apresentando erro "Unauthorized" persistente em produção na Vercel, mesmo após múltiplas correções aplicadas:

1. ✅ Corrigido erro de sintaxe na API
2. ✅ Criado sistema de autenticação centralizado
3. ✅ Padronizado todas as APIs
4. ✅ Testado localmente (funcionando)
5. ✅ Deploy realizado na Vercel
6. ❌ **AINDA APRESENTA ERRO "UNAUTHORIZED"**

## 🎯 MISSÃO DO AGENTE

Você deve realizar uma **investigação forense completa** para identificar e corrigir definitivamente a causa raiz do erro "Unauthorized". Use TODAS as ferramentas disponíveis:

### 🔧 FERRAMENTAS OBRIGATÓRIAS A USAR:

1. **MCP Supabase:**
   - Verificar logs em tempo real
   - Analisar configurações de autenticação
   - Verificar RLS (Row Level Security)
   - Testar conexões e queries
   - Verificar usuários na tabela auth.users

2. **MCP Vercel:**
   - Analisar logs de deployment
   - Verificar environment variables
   - Analisar logs de função em tempo real
   - Verificar configurações de domínio

3. **Análise de Código:**
   - Buscar inconsistências no middleware
   - Verificar fluxo de cookies/sessões
   - Analisar configurações do Supabase SSR
   - Verificar configurações do Next.js

4. **Web Search:**
   - Pesquisar problemas similares com Supabase + Vercel
   - Verificar documentação oficial
   - Buscar soluções para problemas de SSR/cookies

### 🔍 INVESTIGAÇÕES ESPECÍFICAS OBRIGATÓRIAS:

#### A. **ANÁLISE DE LOGS EM TEMPO REAL**
- Verificar logs do Supabase durante tentativa de login/criação
- Analisar logs da Vercel durante erro
- Comparar logs locais vs produção

#### B. **VERIFICAÇÃO DE CONFIGURAÇÕES**
- Environment variables na Vercel vs locais
- Configurações de domínio/CORS no Supabase
- Configurações de cookies/sessões
- Verificar se NEXTAUTH_URL está correto

#### C. **ANÁLISE DE AUTENTICAÇÃO**
- Verificar se cookies estão sendo definidos corretamente
- Analisar fluxo de middleware
- Verificar se sessões persistem entre requests
- Testar autenticação diretamente via API

#### D. **VERIFICAÇÃO DE BANCO DE DADOS**
- Confirmar sincronização entre auth.users e public.User
- Verificar RLS policies
- Testar queries diretamente no banco
- Verificar permissões de tabelas

#### E. **ANÁLISE DE REDE/CORS**
- Verificar se há problemas de CORS
- Analisar headers de requests/responses
- Verificar se domínio está autorizado no Supabase

### 🧪 TESTES OBRIGATÓRIOS:

1. **Teste de Login Direto:**
   - Fazer login via API do Supabase em produção
   - Verificar se retorna token válido
   - Testar se token funciona em requests subsequentes

2. **Teste de Middleware:**
   - Verificar se middleware está funcionando
   - Analisar redirecionamentos
   - Verificar se cookies estão sendo lidos

3. **Teste de APIs:**
   - Testar cada endpoint admin individualmente
   - Verificar headers enviados
   - Analisar responses detalhadamente

4. **Teste de Banco:**
   - Executar queries diretamente
   - Verificar se usuário admin existe
   - Testar permissões de RLS

### 📊 COMPARAÇÃO OBRIGATÓRIA:

Você DEVE comparar:
- ✅ **Local (funcionando)** vs ❌ **Produção (erro)**
- Environment variables
- Logs de autenticação
- Configurações de cookies
- Headers de requests
- Responses das APIs

### 🔧 CORREÇÕES ESPERADAS:

Com base na investigação, você deve:

1. **Identificar a causa exata** (não suposições)
2. **Implementar correção específica** para o problema encontrado
3. **Testar a correção** antes de committar
4. **Documentar a solução** para referência futura
5. **Fazer deploy e validar** em produção

### 🚨 CRITÉRIOS DE SUCESSO:

A investigação só estará completa quando:
- [ ] Causa raiz identificada com evidências
- [ ] Correção implementada e testada
- [ ] Login admin funcionando em produção
- [ ] Criação de posts/materiais funcionando
- [ ] Logs mostrando sucesso (não erro)

### 💡 DICAS IMPORTANTES:

1. **Não assuma nada** - verifique tudo com dados reais
2. **Use logs em tempo real** - não confie apenas em logs antigos
3. **Compare ambiente local vs produção** sistematicamente
4. **Teste cada correção** antes de aplicar a próxima
5. **Documente cada descoberta** para não perder informações

### 🎯 PERGUNTA FINAL:

**"Por que exatamente o sistema funciona localmente mas falha em produção com 'Unauthorized', e qual é a correção específica necessária?"**

---

## 🚀 EXECUTE ESTE PROMPT AGORA

Agente, execute esta investigação completa usando TODAS as ferramentas disponíveis. Não pare até encontrar e corrigir definitivamente a causa raiz do problema.
