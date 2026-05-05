# Bloomberg PDFs — Test Fixtures

PDFs reais usados para testar `extractor.ts`, `format-detector.ts` e o orchestrator de F-007.

## Arquivos esperados

Cada arquivo cobre **um formato Bloomberg distinto** para validar `BloombergFormat` (PBN/BFW/BN/APW):

| Arquivo | Formato | Origem | Característica para teste |
|---|---|---|---|
| `bloomberg-brazilian-news-20260427.pdf` | **PBN** | Bloomberg Brazilian News (in Portuguese) | Briefing diário "Cinco assuntos quentes" — múltiplos temas, links inline, imagens, autores nomeados |
| `bloomberg-first-word-20260427.pdf` | **BFW** | Bloomberg First Word | Tabela estruturada de índices ("Às 7:31, S&P 500 Futuro -0,1%..."), bullets aninhados, agenda "Para acompanhar" |
| `bloomberg-news-20260427.pdf` | **BN** | Bloomberg News (traduzido máquina EN→PT) | Header "Traduzido por máquina de Inglês para Português", tom de matéria internacional |
| `associated-press-traduzido-20260427.pdf` | **APW** | Associated Press traduzido | Header "Associated Press", múltiplas notícias agrupadas, pouca formatação |

## Por que precisamos de PDFs reais

- pdfjs-dist tem comportamento específico para layouts Bloomberg (tabelas quebram em linhas avulsas)
- Filtros de metaconteúdo (`BLOOMBERG_METADATA_SECTIONS`) precisam validar contra texto real
- Detecção de auto-translation precisa do header exato
- Smoke test (Parte 9 do prompt F-007) precisa de input autêntico

## Privacidade

Estes PDFs são **conteúdo Bloomberg privado** (assinatura corporativa). NÃO commit em repositório público.

`bloomberg-pdfs/*.pdf` deve estar em `.gitignore` se o repo for público. Em repo privado da LDC, versionar é OK para testes reproducíveis.

## ADR relacionado

`docs/news/decisions/ADR-003-bloomberg-sinal-interno.md` — Bloomberg como sinal interno, NUNCA citado como fonte pública.
