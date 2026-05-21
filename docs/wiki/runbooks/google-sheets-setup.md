# 📊 Configuração Google Sheets - LDC Capital

Este documento explica como configurar a integração com Google Sheets para capturar leads do site.

## 🔧 Pré-requisitos

1. Conta Google (Gmail)
2. Acesso ao Google Cloud Console
3. Planilha Google Sheets criada

## 📋 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID**

### 2. Habilitar APIs

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure e habilite:
   - **Google Sheets API**
   - **Google Drive API**

### 3. Criar Service Account

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **Service Account**
3. Preencha:
   - **Service account name**: `ldc-sheets-integration`
   - **Service account ID**: será gerado automaticamente
   - **Description**: `Integração do site LDC Capital com Google Sheets`
4. Clique em **Create and Continue**
5. Em **Role**, selecione **Editor**
6. Clique em **Continue** e depois **Done**

### 4. Gerar Chave Privada

1. Na lista de Service Accounts, clique no que você criou
2. Vá na aba **Keys**
3. Clique em **Add Key** > **Create new key**
4. Selecione **JSON** e clique em **Create**
5. O arquivo JSON será baixado automaticamente
6. **IMPORTANTE**: Guarde este arquivo em local seguro!

### 5. Criar Planilha Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com/)
2. Crie uma nova planilha
3. Nomeie como **"LDC Capital - Leads"**
4. Anote o **ID da planilha** (está na URL):
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

### 6. Configurar Permissões da Planilha

1. Na planilha, clique em **Compartilhar**
2. Adicione o email do Service Account (encontrado no arquivo JSON baixado)
3. Defina permissão como **Editor**
4. Clique em **Enviar**

### 7. Configurar Cabeçalhos da Planilha

1. Na planilha, renomeie a primeira aba para **"Leads"**
2. Execute o script de configuração:
   ```bash
   cd site-ldc
   npm run setup-sheets
   ```

### 8. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Abra o arquivo JSON baixado e extraia as informações:
   ```json
   {
     "client_email": "ldc-sheets-integration@seu-projeto.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```

3. Configure as variáveis no `.env.local`:
   ```env
   # Google Sheets Integration
   GOOGLE_SHEETS_ID="seu_sheet_id_aqui"
   GOOGLE_SERVICE_ACCOUNT_EMAIL="ldc-sheets-integration@seu-projeto.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua_chave_privada_aqui\n-----END PRIVATE KEY-----"
   
   # Email Configuration
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="contato@ldccapital.com.br"
   SMTP_PASS="sua_senha_de_app_aqui"
   ```

### 9. Configurar Email (Gmail)

1. Acesse [Configurações do Gmail](https://myaccount.google.com/security)
2. Ative **Verificação em duas etapas**
3. Vá em **Senhas de app**
4. Gere uma senha para **Mail**
5. Use esta senha na variável `SMTP_PASS`

## 🧪 Testar Integração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse o site e preencha um formulário

3. Verifique se:
   - Os dados aparecem na planilha
   - Email é enviado para contato@ldccapital.com.br
   - Email de confirmação é enviado para o lead

## 📊 Estrutura da Planilha

A planilha terá as seguintes colunas, correspondentes aos campos do formulário:

| Coluna | Campo | Descrição |
|--------|-------|-----------|
| A | Data/Hora | Data e hora da submissão (automático - formato brasileiro) |
| B | Nome Completo | Nome completo do lead |
| C | Telefone | Telefone do lead |
| D | E-mail | E-mail do lead |
| E | Patrimônio para Investimento | Faixa de patrimônio selecionada |
| F | Como nos conheceu? | Canal de aquisição/origem |
| G | Origem (Formulário) | Qual formulário foi usado (Home, Fale Conosco, etc.) |
| H | Status | Status do lead (Novo, Em andamento, Convertido, etc.) |
| I | Observações | Mensagens adicionais ou observações |

## 🔒 Segurança

- **NUNCA** commite o arquivo JSON ou as chaves privadas
- Use sempre variáveis de ambiente
- Mantenha as permissões da planilha restritas
- Monitore os logs de acesso

## 🆘 Troubleshooting

### Erro: "The caller does not have permission"
- Verifique se o Service Account tem acesso à planilha
- Confirme se as APIs estão habilitadas

### Erro: "Invalid credentials"
- Verifique se a chave privada está correta no .env
- Confirme se não há quebras de linha extras

### Emails não estão sendo enviados
- Verifique se a senha de app está correta
- Confirme se a verificação em duas etapas está ativa

### Dados não aparecem na planilha
- Verifique se o SHEET_ID está correto
- Confirme se a aba se chama "Leads"

## 📞 Suporte

Em caso de dúvidas, consulte:
- [Documentação Google Sheets API](https://developers.google.com/sheets/api)
- [Documentação Service Accounts](https://cloud.google.com/iam/docs/service-accounts)

---

**Criado em:** 03/10/2025  
**Última atualização:** 03/10/2025  
**Versão:** 1.0
