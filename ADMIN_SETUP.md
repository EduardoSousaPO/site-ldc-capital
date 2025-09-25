# 🎛️ Sistema de Administração do Blog LDC Capital

## 📋 Visão Geral

Sistema completo de administração para o blog da LDC Capital, permitindo que usuários autorizados façam login e gerenciem postagens sem precisar mexer no código, similar ao WordPress.

## ✨ Funcionalidades

### 🔐 **Autenticação & Segurança**
- Sistema de login seguro com NextAuth.js
- Controle de acesso baseado em roles (ADMIN/EDITOR)
- Middleware para proteção de rotas
- Sessões seguras e criptografia de senhas

### 📝 **Gerenciamento de Conteúdo**
- **Editor Visual**: Interface tipo WordPress com markdown
- **CRUD Completo**: Criar, editar, visualizar e excluir posts
- **Sistema de Rascunhos**: Salvar e publicar quando estiver pronto
- **Categorias**: Organização automática por categorias
- **Imagens**: Upload e gerenciamento de imagens de capa
- **SEO Automático**: Geração automática de slugs e meta tags

### 📊 **Dashboard Administrativo**
- Estatísticas em tempo real
- Lista completa de postagens
- Filtros e busca avançada
- Status de publicação
- Informações do sistema

## 🚀 Como Usar

### 1️⃣ **Primeiro Acesso**

O sistema já está configurado com um usuário administrador padrão:

```
📧 Email: admin@ldccapital.com.br
🔑 Senha: admin123
🌐 URL: http://localhost:3000/admin/login
```

### 2️⃣ **Fazendo Login**

1. Acesse `http://localhost:3000/admin/login`
2. Digite as credenciais acima
3. Clique em "Entrar"
4. Você será redirecionado para o dashboard

### 3️⃣ **Criando uma Nova Postagem**

1. No dashboard, clique em **"Nova Postagem"**
2. Preencha o título (obrigatório)
3. Escreva o conteúdo usando Markdown
4. Adicione um resumo (opcional)
5. Selecione uma categoria
6. Adicione uma imagem de capa (opcional)
7. Escolha entre:
   - **"Salvar Rascunho"**: Salva sem publicar
   - **"Publicar"**: Publica imediatamente no site

### 4️⃣ **Editando Postagens**

1. No dashboard, clique no ícone de edição ✏️
2. Faça as alterações desejadas
3. Clique em **"Salvar"** ou **"Publicar/Despublicar"**

### 5️⃣ **Gerenciando Postagens**

- **👁️ Publicar/Despublicar**: Clique no ícone do olho
- **🗑️ Excluir**: Clique no ícone da lixeira
- **🔍 Buscar**: Use a barra de pesquisa
- **📂 Filtrar**: Por status (Todos/Publicados/Rascunhos)

## 📝 Guia do Editor Markdown

O editor suporta Markdown completo. Aqui estão os principais comandos:

```markdown
# Título Principal
## Subtítulo
### Título Menor

**Texto em Negrito**
*Texto em Itálico*

- Lista não ordenada
- Item 2

1. Lista ordenada
2. Item 2

[Link](https://exemplo.com)

![Imagem](url-da-imagem.jpg)

> Citação

`código inline`

```código em bloco```
```

## 👥 Gerenciamento de Usuários

### **Roles Disponíveis:**

- **ADMIN**: Acesso total (dashboard, posts, configurações)
- **EDITOR**: Acesso ao dashboard e posts (sem configurações)

### **Criando Novos Usuários:**

Para criar novos usuários, você precisa:

1. Acessar o banco de dados via Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Ou criar via código no seed (recomendado para desenvolvedores)

## 🛠️ Configurações Técnicas

### **Scripts Disponíveis:**

```bash
# Desenvolvimento
npm run dev

# Banco de dados
npm run db:generate    # Gerar cliente Prisma
npm run db:push       # Aplicar schema ao banco
npm run db:seed       # Popular dados iniciais
npm run db:studio     # Interface visual do banco
npm run admin:setup   # Configuração completa inicial
```

### **Estrutura do Banco:**

- **Users**: Usuários do sistema (admin/editor)
- **BlogPost**: Postagens do blog
- **Category**: Categorias dos posts
- **Account/Session**: Dados de autenticação

### **Arquivos Importantes:**

```
site-ldc/
├── src/app/admin/           # Páginas administrativas
├── src/app/api/admin/       # APIs do admin
├── prisma/                  # Configuração do banco
├── .env                     # Variáveis de ambiente
└── ADMIN_SETUP.md          # Este arquivo
```

## 🔧 Manutenção

### **Backup Regular:**
O banco SQLite está em `prisma/dev.db` - faça backup regular deste arquivo.

### **Logs:**
Monitore os logs do console para erros ou problemas.

### **Atualizações:**
Mantenha as dependências atualizadas, especialmente:
- `next-auth` (segurança)
- `prisma` (banco de dados)
- `next` (framework)

## 🆘 Solução de Problemas

### **Não consigo fazer login:**
1. Verifique se o banco está configurado: `npm run admin:setup`
2. Confirme as credenciais padrão
3. Verifique os logs no console

### **Posts não aparecem no site:**
1. Verifique se o post está **Publicado** (não Rascunho)
2. Confirme se a categoria está correta
3. Recarregue a página do blog

### **Erro ao salvar post:**
1. Verifique se título e conteúdo estão preenchidos
2. Confirme se a categoria foi selecionada (para publicar)
3. Verifique os logs da API

### **Problemas de permissão:**
1. Confirme seu role no sistema
2. Faça logout e login novamente
3. Verifique se o middleware está funcionando

## 🎯 Próximos Passos

Este sistema está pronto para uso em produção. Para melhorias futuras, considere:

- Upload de imagens mais robusto
- Editor WYSIWYG mais avançado
- Sistema de comentários
- Analytics integrado
- Backup automático
- Notificações por email

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com o desenvolvedor.

---

**✅ Sistema pronto para uso! Comece criando sua primeira postagem!**


