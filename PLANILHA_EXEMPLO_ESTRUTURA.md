# Estrutura da Planilha Google Sheets - LDC Capital

## 📋 Colunas da Planilha

A planilha será configurada com as seguintes colunas, correspondentes exatamente aos campos do formulário "Fale com nossa equipe":

| Coluna | Campo | Exemplo | Observações |
|--------|-------|---------|-------------|
| **A** | **Data/Hora** | `03/10/2025 14:30:25` | Preenchido automaticamente no formato brasileiro |
| **B** | **Nome Completo** | `Eduardo Sousa` | Campo obrigatório do formulário |
| **C** | **Telefone** | `(62) 99159-5338` | Campo obrigatório com formatação automática |
| **D** | **E-mail** | `eduspires123@gmail.com` | Campo obrigatório com validação |
| **E** | **Patrimônio para Investimento** | `R$ 300.000 - R$ 1.000.000` | Seleção do dropdown |
| **F** | **Como nos conheceu?** | `YouTube` | Origem/canal de aquisição |
| **G** | **Origem (Formulário)** | `Home` ou `Fale Conosco` | Identifica qual formulário foi usado |
| **H** | **Status** | `Novo` | Status inicial, pode ser alterado manualmente |
| **I** | **Observações** | `Interessado em consultoria` | Campo livre para anotações |

## 🔄 Exemplo de Dados na Planilha

```
| Data/Hora           | Nome Completo | Telefone        | E-mail                | Patrimônio              | Como nos conheceu? | Origem      | Status | Observações |
|---------------------|---------------|-----------------|----------------------|-------------------------|-------------------|-------------|--------|-------------|
| 03/10/2025 14:30:25 | Eduardo Sousa | (62) 99159-5338 | eduspires123@gmail.com | R$ 300.000-R$ 1.000.000 | YouTube           | Home        | Novo   |             |
| 03/10/2025 15:45:12 | Maria Silva   | (11) 98765-4321 | maria@email.com      | R$ 1.000.000-R$ 5.000.000 | Google           | Fale Conosco | Novo   | Urgente     |
```

## ⚙️ Configurações Automáticas

### Data/Hora
- **Formato:** `DD/MM/AAAA HH:MM:SS`
- **Fuso horário:** America/Sao_Paulo (Brasília)
- **Preenchimento:** Automático no momento da submissão

### Campos Obrigatórios
- Nome Completo ✅
- Telefone ✅  
- E-mail ✅
- Patrimônio para Investimento ✅
- Como nos conheceu? ✅
- Consentimento ✅ (não aparece na planilha, apenas valida)

### Opções de Patrimônio
- `R$ 0 - R$ 300.000`
- `R$ 300.000 - R$ 1.000.000`
- `R$ 1.000.000 - R$ 5.000.000`
- `R$ 5.000.000 - R$ 10.000.000`
- `R$ 10.000.000 - R$ 30.000.000`
- `Acima de R$ 30.000.000`

### Opções de Origem
- `YouTube`
- `Google`
- `Instagram`
- `LinkedIn`
- `Indicação`
- `Outros`

## 🎯 Benefícios da Nova Estrutura

1. **Correspondência Exata:** Cada coluna corresponde a um campo do formulário
2. **Data/Hora Automática:** Registro preciso do momento da submissão
3. **Formato Brasileiro:** Data e hora no padrão nacional
4. **Organização Clara:** Campos ordenados logicamente
5. **Facilidade de Análise:** Estrutura otimizada para relatórios
6. **Flexibilidade:** Campo "Observações" para anotações adicionais

---
*Estrutura atualizada em: 03/10/2025*



