# 🚀 Configuração para Deploy na Vercel

## 🔧 Problema Identificado

O erro "Internal Server Error" ao criar posts no admin em produção é causado por:

1. **NEXTAUTH_URL incorreta** - Configurada para localhost em vez da URL de produção
2. **Falta de logs detalhados** - Dificulta debug em produção
3. **Autenticação inconsistente** - Diferença entre user_metadata e dados do banco

## ✅ Soluções Implementadas

### 1. **Melhor Tratamento de Erros**
- ✅ Logs detalhados nas APIs
- ✅ Verificação de autenticação melhorada
- ✅ Busca do usuário no banco de dados (não apenas user_metadata)

### 2. **Configuração de Produção**
- ✅ Arquivo `.env.production` criado
- ✅ NEXTAUTH_URL corrigida para produção

## 🔐 Configuração das Environment Variables na Vercel

### **Passo 1: Acessar Vercel Dashboard**
1. Vá para https://vercel.com/dashboard
2. Selecione o projeto `site-ldc-capital`
3. Vá em **Settings** → **Environment Variables**

### **Passo 2: Adicionar/Atualizar Variáveis**

```bash
# Database (usar string com SSL + pooling para Vercel)
DATABASE_URL = "postgresql://postgres:Catolico0202@db.xvbpqlojxwbvqizmixrr.supabase.co:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1"

# Supabase
NEXT_PUBLIC_SUPABASE_URL = "https://xvbpqlojxwbvqizmixrr.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YnBxbG9qeHdidnFpem1peHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjI0NzksImV4cCI6MjA3MjQzODQ3OX0.mzcB2XLAyR8cz_ohvdYA-C7ThyZJskYdSN_NuJtq7AI"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YnBxbG9qeHdidnFpem1peHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg2MjQ3OSwiZXhwIjoyMDcyNDM4NDc5fQ.3jEcQ8IxZP7N9Ih-lkTSLLOduCld5nlGokZthQu-7SE"
SUPABASE_STORAGE_BUCKET = "ldc-assets"

# NextAuth - CRÍTICO: Use a URL correta de produção
NEXTAUTH_URL = "https://site-ldc-capital.vercel.app"
NEXTAUTH_SECRET = "your-super-secure-production-secret-key-here"

# Admin User
ADMIN_EMAIL = "admin@ldccapital.com.br"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "Administrador LDC"
```

### **Passo 3: Redeploy**
1. Após salvar as variáveis, vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Selecione **Redeploy**

## 🐛 Debug em Produção

### **Ver Logs da Vercel**
1. Vá em **Functions** → **View Function Logs**
2. Teste criar um post no admin
3. Verifique os logs detalhados que agora incluem:
   - ✅ Status da autenticação
   - ✅ Dados recebidos
   - ✅ Erros específicos
   - ✅ Stack trace completo

### **Logs Esperados (Sucesso)**
```
🔐 Checking authentication...
✅ User found: { id: "...", email: "admin@ldccapital.com.br" }
✅ Database user: { id: "...", email: "...", role: "ADMIN" }
📝 Creating new post...
✅ User authorized: admin@ldccapital.com.br
📋 Request body: { title: true, content: "Content provided", ... }
📝 Generated slug: meu-novo-post
📊 Reading time: 2 min read
💾 Creating post in database...
✅ Post created successfully: cmxxx...
```

### **Logs de Erro (Ajudam a identificar problema)**
```
❌ Auth error: [detalhes do erro]
❌ No user found
❌ User not found in database
❌ Insufficient permissions: USER
❌ Missing required fields: { title: true, content: false }
```

## 🔍 Verificação Final

### **Teste 1: Login Admin**
1. Acesse: `https://seu-site.vercel.app/admin/login`
2. Login: `admin@ldccapital.com.br` / `admin123`
3. Deve redirecionar para dashboard

### **Teste 2: Criar Post**
1. Acesse: `https://seu-site.vercel.app/admin/posts/new`
2. Preencha título e conteúdo
3. Clique em "Publicar"
4. Deve aparecer toast de sucesso

### **Teste 3: Verificar Logs**
1. Se der erro, verifique os logs na Vercel
2. Os novos logs detalhados vão mostrar exatamente onde está o problema

## 🚨 Problemas Comuns

### **1. NEXTAUTH_URL Incorreta**
- **Sintoma**: Erro de autenticação
- **Solução**: Verificar se NEXTAUTH_URL está com a URL correta de produção

### **2. Usuário não encontrado no banco**
- **Sintoma**: "User not found in database"
- **Solução**: Verificar se o usuário admin foi criado corretamente no Supabase

### **3. Problemas de CORS**
- **Sintoma**: Erro de network/fetch
- **Solução**: Verificar configurações do Supabase para permitir a URL de produção

## ✅ Checklist de Deploy

- [ ] Environment variables configuradas na Vercel
- [ ] NEXTAUTH_URL com URL de produção
- [ ] NEXTAUTH_SECRET alterado para produção
- [ ] Redeploy realizado
- [ ] Teste de login funcionando
- [ ] Teste de criação de post funcionando
- [ ] Logs detalhados visíveis na Vercel

---

**💡 Dica**: Após configurar, teste primeiro o login admin. Se funcionar, o problema era realmente a configuração de ambiente. Se não funcionar, verifique os logs detalhados para identificar o problema específico.
