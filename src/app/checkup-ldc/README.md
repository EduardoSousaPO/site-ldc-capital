# Checkup-LDC - Portfolio Checkup MCP

## Visão Geral

O Checkup-LDC é uma ferramenta de análise de carteira que permite aos usuários colarem/importarem suas carteiras e receberem em minutos um diagnóstico claro (nota, riscos, melhorias) + PDF premium.

## Acesso

- **URL**: `/checkup-ldc` (rota pública, sem controle de acesso)
- **Status**: Funcional e pronto para uso

## Fluxo do Usuário

1. **Importar Carteira**: Colar dados ou fazer upload de CSV/Excel
2. **Confirmar Tipos**: Revisar e ajustar tipos sugeridos automaticamente
3. **Perfil de Investimento**: Responder 3-4 perguntas (objetivo, prazo, risco)
4. **Preview Gratuito**: Ver nota, 2 alertas principais e 1 gráfico
5. **Paywall**: Simular pagamento (mock) para desbloquear
6. **Relatório Completo**: Ver análise completa + baixar PDF

## Funcionalidades Implementadas

### ✅ Sprint 1: Fundação + Ingestão
- [x] Parser de portfolio (texto, CSV, Excel)
- [x] Heurísticas de classificação automática
- [x] Confirmação de tipos com "aplicar similares"
- [x] Questionário de suitability
- [x] APIs de criação e salvamento

### ✅ Sprint 2: Engine Determinístico + Preview
- [x] Analytics Engine (cálculos determinísticos)
- [x] Score Calculator (nota 0-100)
- [x] Policy Profiles (filosofia configurável)
- [x] Preview gratuito com gráficos
- [x] Paywall mock

### ✅ Sprint 3: Multi-LLM + Relatório Premium
- [x] LLM Orchestrator (OpenAI + Gemini)
- [x] Prompts versionados
- [x] Relatório completo na tela
- [x] Logs de LLM runs

### ✅ Sprint 4: Geração de PDF
- [x] PDF Generator com Playwright
- [x] Template HTML alinhado ao design
- [x] Upload para Supabase Storage

## Configuração

### Variáveis de Ambiente Necessárias

```env
# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=https://vszymwnctwzdechsgeue.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=ldc-assets

# LLM Providers (já configurado)
OPENAI_API_KEY=sk-proj-...
GOOGLE_GEMINI_API_KEY= (opcional)
LLM_DIAG_PROVIDER=openai
LLM_DIAG_MODEL=gpt-4o-mini
LLM_REWRITE_PROVIDER=openai
LLM_REWRITE_MODEL=gpt-4o-mini
```

### Banco de Dados

As tabelas já foram criadas:
- `Checkup` - Checkups criados
- `Holding` - Holdings de cada checkup
- `LLMRun` - Logs de execuções LLM
- `PolicyProfile` - Perfis de política (já tem "Padrão LDC")

### Storage

O bucket `ldc-assets` já foi criado no Supabase Storage. Os PDFs serão salvos em `checkups/`.

## Testando

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse: `http://localhost:3000/checkup-ldc`

3. Teste o fluxo completo:
   - Cole uma carteira de exemplo:
   ```
   PETR4	50000
   VALE3	30000
   ITUB4	20000
   BOVA11	100000
   ```
   - Confirme os tipos
   - Preencha o questionário
   - Veja o preview
   - Simule o pagamento
   - Veja o relatório completo
   - Baixe o PDF

## Estrutura de Arquivos

```
src/
├── app/
│   └── checkup-ldc/
│       ├── page.tsx              # Página principal
│       └── components/           # Componentes da UI
├── features/
│   └── checkup-ldc/
│       ├── ingestion/            # Parser de portfolio
│       ├── classification/       # Heurísticas
│       ├── analytics/            # Engine + Score
│       ├── llm/                  # Orchestrator + Providers
│       └── pdf/                  # Gerador de PDF
└── lib/
    └── checkup-ldc/              # Constantes e utilitários
```

## Próximos Passos (Opcionais)

- [ ] Integrar gateway de pagamento real (Mercado Pago/Stripe)
- [ ] Adicionar Google Gemini API key (para fallback)
- [ ] Criar painel admin para gerenciar policy profiles
- [ ] Adicionar mais testes unitários
- [ ] Melhorar tratamento de erros
- [ ] Adicionar analytics/tracking

## Notas

- O pagamento é mockado (simulado) por enquanto
- O PDF é gerado server-side com Playwright
- Os logs de LLM são salvos para auditoria
- O design segue 100% o design system do site LDC

