# Instruções para Limpar Cookies e Resolver Erro 401

## Problema Identificado

Os logs mostram que há cookies de **outros projetos Supabase** no navegador:
- `sb-wsoxukpeyzmpcngjugie-auth-token` (outro projeto)
- `sb-nyexanwlwzdzceilxhhm-auth-token` (outro projeto)
- `sb-nniabnjuwzeqmflrruga-auth-token` (outro projeto)

Mas o projeto atual é: **`xvbpqlojxwbvqizmixrr`**

O cookie correto deveria ser: **`sb-xvbpqlojxwbvqizmixrr-auth-token`**

## Solução Imediata

### Opção 1: Limpar Cookies Manualmente (Recomendado)

1. **Abra o DevTools** (F12)
2. **Vá em "Application"** → **"Cookies"** → **`http://localhost:3000`**
3. **Delete todos os cookies que começam com `sb-`**:
   - `sb-wsoxukpeyzmpcngjugie-auth-token`
   - `sb-nyexanwlwzdzceilxhhm-auth-token`
   - `sb-nniabnjuwzeqmflrruga-auth-token`
   - Qualquer outro cookie `sb-*` que não seja do projeto atual

4. **Faça login novamente**:
   - Acesse `/wealth-planning`
   - Email: `admin@ldccapital.com.br`
   - Senha: `admin123`
   - Isso criará o cookie correto: `sb-xvbpqlojxwbvqizmixrr-auth-token`

### Opção 2: Limpar Todos os Cookies do Localhost

1. **Abra o DevTools** (F12)
2. **Vá em "Application"** → **"Storage"** → **"Clear site data"**
3. **Marque "Cookies and other site data"**
4. **Clique em "Clear site data"**
5. **Recarregue a página** (F5)
6. **Faça login novamente**

### Opção 3: Usar Modo Anônimo/Incógnito

1. **Abra uma janela anônima** (Ctrl+Shift+N no Chrome)
2. **Acesse** `http://localhost:3000/wealth-planning`
3. **Faça login**
4. **Teste se funciona**

## Correções Aplicadas no Código

✅ **Filtro de cookies implementado**:
- O código agora filtra apenas cookies do projeto correto
- Cookies de outros projetos são ignorados

✅ **Logs melhorados**:
- Agora mostra qual projeto está sendo usado
- Mostra quais cookies são do projeto correto

## Como Verificar se Funcionou

Após limpar cookies e fazer login:

1. **Verifique o console do navegador** (F12):
   - Deve mostrar: "Login bem-sucedido"
   - Não deve mostrar mais erros 401

2. **Verifique o terminal do servidor**:
   - Deve mostrar: "Cookies do projeto correto: sb-xvbpqlojxwbvqizmixrr-auth-token"
   - Deve mostrar: "=== checkAdminAuth SUCESSO ==="
   - Deve mostrar: "GET /api/admin/wealth-planning/clients 200"

3. **Verifique os cookies no DevTools**:
   - Application → Cookies → `http://localhost:3000`
   - Deve existir: `sb-xvbpqlojxwbvqizmixrr-auth-token`
   - Não deve existir cookies de outros projetos

## Se Ainda Não Funcionar

1. **Verifique o `.env`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://xvbpqlojxwbvqizmixrr.supabase.co"
   ```
   Deve corresponder ao projeto correto.

2. **Reinicie o servidor**:
   ```bash
   # Parar (Ctrl+C)
   npm run dev
   ```

3. **Limpe o cache do Next.js**:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

**Status**: ✅ Código corrigido para filtrar cookies corretos
**Próximo passo**: Limpar cookies antigos e fazer login novamente

