# Manual do Administrador - Blog e Materiais LDC Capital

## 📋 Índice
1. [Acesso ao Painel Admin](#acesso)
2. [Gerenciamento de Posts do Blog](#blog)
3. [Gerenciamento de Materiais](#materiais)
4. [Upload de Arquivos](#upload)
5. [Identidade Visual](#identidade)
6. [Resolução de Problemas](#problemas)

---

## 🔐 Acesso ao Painel Admin {#acesso}

### Como Acessar
1. Navegue para `/admin/login`
2. Faça login com suas credenciais de administrador
3. Você será redirecionado para o dashboard principal

### Níveis de Acesso
- **ADMIN**: Acesso completo a todas as funcionalidades
- **EDITOR**: Pode criar e editar conteúdo, mas com restrições

---

## 📝 Gerenciamento de Posts do Blog {#blog}

### Dashboard de Posts
- Acesse em `/admin/posts`
- Visualize todos os posts em formato de cards
- Use filtros para buscar por título, categoria ou status
- Estatísticas em tempo real (total, publicados, rascunhos)

### Criar Novo Post

#### 1. Informações Básicas
- **Título**: Obrigatório, será usado para gerar o slug automaticamente
- **Resumo**: Opcional, aparece na listagem do blog
- **Categoria**: Obrigatória para publicação
  - Consultoria Financeira
  - Investimentos
  - Planejamento Financeiro
  - Mercado Financeiro
  - Educação Financeira

#### 2. Conteúdo
- Use o editor Markdown para formatar o texto
- Suporte completo para:
  - Títulos (`# ## ###`)
  - Texto em **negrito** e *itálico*
  - Listas numeradas e com marcadores
  - Links `[texto](url)`
  - Imagens `![alt](url)`
  - Citações `> texto`

#### 3. Imagem de Capa
- **Formatos aceitos**: JPG, PNG, WebP
- **Tamanho máximo**: 5MB
- **Recomendação**: 1200x630px (proporção 16:9)
- Upload direto pelo painel ou URL externa

#### 4. Publicação
- **Salvar Rascunho**: Salva sem publicar
- **Publicar**: Torna o post visível no site
- Posts publicados ganham data de publicação automática

### Editar Post Existente
1. Na listagem, clique no botão "Editar" (ícone de lápis)
2. Modifique os campos desejados
3. Salve como rascunho ou publique as alterações

### Excluir Post
1. Na listagem, clique no botão "Excluir" (ícone de lixeira)
2. Confirme a exclusão (ação irreversível)
3. Post será removido permanentemente

---

## 📚 Gerenciamento de Materiais {#materiais}

### Dashboard de Materiais
- Acesse em `/admin/materials`
- Visualize estatísticas: Total, Publicados, Rascunhos, Em Destaque
- Filtros por status, categoria e busca por texto
- Tabela com informações detalhadas

### Criar Novo Material

#### 1. Informações Básicas
- **Título**: Nome do material (obrigatório)
- **Descrição**: Breve descrição para listagem
- **Conteúdo**: Descrição detalhada do material

#### 2. Configurações
- **Categoria**: Obrigatória para publicação
  - GUIAS
  - Planejamento Financeiro
  - Investimentos
  - Consultoria Financeira
  - Educação Financeira

- **Tipo de Material**: Obrigatório
  - Cartilha
  - Guia
  - E-book
  - Planilha
  - Checklist
  - Template
  - Manual

- **Número de Páginas**: Opcional (apenas números)
- **Material em Destaque**: Checkbox para destacar

#### 3. Upload de Arquivo
- **Formatos aceitos**: PDF, DOC, DOCX, XLS, XLSX
- **Tamanho máximo**: 50MB
- Arraste e solte ou clique para selecionar
- Preview do arquivo após upload

#### 4. Imagem de Capa
- **Formatos aceitos**: JPG, PNG, WebP
- **Tamanho máximo**: 5MB
- **Recomendação**: 400x300px (proporção 4:3)

### Ações Rápidas na Listagem
- **Destacar/Remover Destaque**: Ícone de estrela
- **Publicar/Despublicar**: Ícone de olho
- **Editar**: Ícone de lápis
- **Excluir**: Ícone de lixeira

---

## 📤 Upload de Arquivos {#upload}

### Tipos de Upload Suportados

#### Imagens (Capas)
- **Formatos**: JPG, JPEG, PNG, WebP
- **Tamanho máximo**: 5MB
- **Uso**: Capas de posts e materiais

#### Documentos (Materiais)
- **Formatos**: PDF, DOC, DOCX, XLS, XLSX
- **Tamanho máximo**: 50MB
- **Uso**: Arquivos para download

### Como Fazer Upload
1. **Drag & Drop**: Arraste o arquivo para a área de upload
2. **Clique**: Clique na área e selecione o arquivo
3. **Aguarde**: O upload é processado automaticamente
4. **Confirmação**: Notificação de sucesso ou erro

### Gerenciamento de Arquivos
- Arquivos são armazenados no Supabase Storage
- Nomes são sanitizados automaticamente
- URLs públicas são geradas automaticamente
- Arquivos podem ser removidos pelo painel

---

## 🎨 Identidade Visual {#identidade}

### Cores da Marca LDC Capital
- **Primária**: `#262d3d` (Azul escuro)
- **Acento 1**: `#98ab44` (Verde oliva)
- **Acento 2**: `#becc6a` (Verde claro)
- **Neutro Escuro**: `#344645`
- **Neutro Médio**: `#577171`
- **Cinza Claro**: `#e3e3e3`

### Tipografia
- **Títulos**: IvyMode (serif)
- **Textos**: Public Sans (sans-serif)

### Diretrizes de Uso
1. **Sempre use as cores oficiais** da paleta
2. **Mantenha hierarquia tipográfica** (IvyMode para títulos)
3. **Use espaçamentos consistentes** conforme o design system
4. **Imagens devem ter boa qualidade** e resolução adequada
5. **Textos devem ser legíveis** em todos os dispositivos

### Elementos de Interface
- **Botões primários**: Verde `#98ab44`
- **Cards**: Fundo branco com sombra sutil
- **Estados**: Verde para sucesso, vermelho para erro
- **Badges**: Cores semânticas (verde/publicado, laranja/rascunho)

---

## 🔧 Resolução de Problemas {#problemas}

### Problemas Comuns

#### Upload Falhando
**Sintomas**: Erro ao fazer upload de arquivos
**Soluções**:
1. Verifique o tamanho do arquivo (máx. 5MB para imagens, 50MB para documentos)
2. Confirme o formato (apenas formatos listados são aceitos)
3. Tente um arquivo diferente para testar
4. Verifique sua conexão com a internet

#### Post/Material Não Salvando
**Sintomas**: Erro ao salvar conteúdo
**Soluções**:
1. Verifique se todos os campos obrigatórios estão preenchidos
2. Confirme se você tem permissões adequadas (ADMIN/EDITOR)
3. Tente salvar como rascunho primeiro
4. Recarregue a página e tente novamente

#### Imagens Não Aparecendo
**Sintomas**: Imagens não carregam no preview ou no site
**Soluções**:
1. Verifique se o upload foi concluído com sucesso
2. Confirme se a URL da imagem está correta
3. Teste a URL diretamente no navegador
4. Refaça o upload se necessário

#### Problemas de Acesso
**Sintomas**: Não consegue acessar o painel admin
**Soluções**:
1. Confirme suas credenciais de login
2. Verifique se sua conta tem role ADMIN ou EDITOR
3. Limpe o cache do navegador
4. Tente em modo anônimo/privado

### Contatos de Suporte
- **Desenvolvimento**: Entre em contato com a equipe técnica
- **Conteúdo**: Consulte o responsável pelo marketing
- **Urgências**: Use os canais oficiais da LDC Capital

---

## ✅ Checklist de Publicação

### Antes de Publicar um Post
- [ ] Título claro e atrativo
- [ ] Categoria selecionada
- [ ] Conteúdo revisado e formatado
- [ ] Imagem de capa (opcional, mas recomendada)
- [ ] Preview testado
- [ ] Links funcionando (se houver)

### Antes de Publicar um Material
- [ ] Título descritivo
- [ ] Categoria e tipo definidos
- [ ] Arquivo principal enviado
- [ ] Imagem de capa (recomendada)
- [ ] Descrição completa
- [ ] Número de páginas (se aplicável)
- [ ] Teste de download

### Manutenção Regular
- [ ] Revisar posts antigos mensalmente
- [ ] Atualizar materiais desatualizados
- [ ] Monitorar downloads e engajamento
- [ ] Backup regular do conteúdo
- [ ] Verificar links quebrados

---

## 🚀 Dicas de Produtividade

### Fluxo de Trabalho Recomendado
1. **Planeje o conteúdo** antes de começar a escrever
2. **Use rascunhos** para trabalhos em andamento
3. **Revise sempre** antes de publicar
4. **Teste em dispositivos diferentes** (desktop/mobile)
5. **Monitore o engajamento** dos conteúdos publicados

### Otimização de SEO
- **Títulos descritivos** com palavras-chave relevantes
- **Resumos informativos** para melhor indexação
- **Imagens otimizadas** com tamanhos adequados
- **Conteúdo de qualidade** e relevante para o público

### Consistência da Marca
- **Mantenha o tom** profissional e acessível
- **Use a paleta de cores** oficial
- **Siga as diretrizes** tipográficas
- **Mantenha qualidade visual** em todas as publicações

---

*Manual atualizado em Janeiro 2025 - LDC Capital*
