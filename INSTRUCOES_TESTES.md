# 🧪 Instruções para Executar os Testes

## ✅ Correções Aplicadas

1. **Script corrigido para usar `.env`** (não `.env.local`)
2. **Busca automática do arquivo `.env`** em múltiplos caminhos
3. **Validação melhorada** de variáveis de ambiente
4. **Logs detalhados** para debug

## 🚀 Como Executar

### Opção 1: Teste Direto (Recomendado)
```bash
cd site-ldc
npm run test:wealth-planning:fixed
```

### Opção 2: Executar Diretamente
```bash
cd site-ldc
npx tsx scripts/test-wealth-planning-fixed.ts
```

## 📋 O que o Script Faz

1. ✅ **Carrega variáveis de ambiente** do arquivo `.env`
2. ✅ **Valida** se `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` existem
3. ✅ **Conecta ao Supabase** usando Admin Client
4. ✅ **Executa 8 testes**:
   - Criar Cliente
   - Listar Clientes
   - Buscar Cliente
   - Atualizar Cliente
   - Criar Cenário
   - Listar Cenários
   - Excluir Cliente COM Cenários (deve falhar)
   - Excluir Cliente SEM Cenários (deve funcionar)
5. ✅ **Mostra resumo** com taxa de sucesso

## 🔍 Verificação Pré-Teste

Antes de executar, verifique:

```bash
# 1. Verificar se .env existe
ls -la site-ldc/.env

# 2. Verificar variáveis críticas
grep "NEXT_PUBLIC_SUPABASE_URL" site-ldc/.env
grep "SUPABASE_SERVICE_ROLE_KEY" site-ldc/.env
```

## ⚠️ Problemas Comuns

### Erro: "Arquivo .env não encontrado"
**Solução**: Verifique se o arquivo `.env` está no diretório `site-ldc/`

### Erro: "NEXT_PUBLIC_SUPABASE_URL não encontrado"
**Solução**: Verifique se a variável está definida no `.env` sem espaços extras

### Erro: "SUPABASE_SERVICE_ROLE_KEY não encontrado"
**Solução**: Verifique se a variável está definida no `.env`

### Erro de Conexão
**Solução**: Verifique se as credenciais do Supabase estão corretas

## 📊 Resultado Esperado

Se tudo estiver correto, você verá:

```
✅ Variáveis de ambiente carregadas
   Supabase URL: https://xvbpqlojxwbvqizmixrr...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🧪 Iniciando testes automatizados do Wealth Planning...

📋 Teste 1: Criar Cliente
✅ Criar Cliente
   Detalhes: {"id":"...","name":"Cliente Teste ..."}

📋 Teste 2: Listar Clientes
✅ Listar Clientes
   Detalhes: {"count":X}

...

📊 RESUMO DOS TESTES
============================================================
✅ Criar Cliente
✅ Listar Clientes
✅ Buscar Cliente
✅ Atualizar Cliente
✅ Criar Cenário
✅ Listar Cenários
✅ Excluir Cliente COM Cenários
✅ Excluir Cliente SEM Cenários
============================================================

Total: 8 | Passou: 8 | Falhou: 0
Taxa de sucesso: 100.0%

✅ Todos os testes passaram!
```

## 🐛 Se os Testes Falharem

1. **Verifique os logs** - O script mostra erros detalhados
2. **Verifique o .env** - Certifique-se de que todas as variáveis estão corretas
3. **Verifique a conexão** - Teste se consegue conectar ao Supabase
4. **Verifique o banco** - Certifique-se de que as tabelas existem

## 📝 Notas

- Os testes criam dados reais no banco de dados
- Dados de teste são identificados por padrões específicos
- O script tenta limpar dados de teste automaticamente
- Se um teste falhar no meio, alguns dados podem ficar no banco




