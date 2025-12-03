# Requisitos adicionais para gestão de cenários e geração de relatórios PDF

Ao transformar a planilha de planejamento de vida em um aplicativo web, é essencial adicionar uma camada de **gestão de cenários**.  Essa funcionalidade permitirá ao consultor criar, salvar, editar e excluir diversos estudos para um mesmo cliente ou prospect.  A seguir estão as principais características e recomendações para implementar essa capacidade.

## 1. Cadastro de clientes e leads

1. **Identificação única:** cada cliente ou lead deve possuir um identificador único (por exemplo, um endereço de e‑mail ou um código interno) para vincular os estudos realizados a esse registro.
2. **Campos personalizáveis:** o consultor deve poder informar nome, e‑mail, telefone e notas adicionais sobre o cliente.  Esses dados serão incluídos na capa do relatório em PDF.
3. **Lista de clientes:** disponibilize uma página/tela com todos os clientes cadastrados.  Ao selecionar um cliente, o consultor poderá ver todos os cenários já criados para ele.

## 2. Criação e gestão de cenários de simulação

### 2.1 Criação de cenários múltiplos

- **Novo cenário:** ao preencher o formulário de dados (idade, despesas, objetivos etc.), o consultor poderá salvar a simulação com um título, por exemplo, “Plano Aposentadoria aos 50” ou “Estratégia Conservadora”.
- **Alteração de parâmetros:** a interface deve permitir variar qualquer parâmetro (poupança anual, idade de aposentadoria, rentabilidade esperada, valor de projetos etc.) para criar cenários alternativos.  O consultor pode rapidamente duplicar um cenário existente, alterar alguns campos e salvar como outro nome.
- **Edição posterior:** cenários salvos devem ser editáveis.  Ao abrir um cenário, os campos são carregados na interface; o consultor pode ajustá‑los e salvar novamente.

### 2.2 Exclusão e organização

- **Exclusão de cenários:** ofereça a opção de excluir cenários indesejados.  É recomendável solicitar confirmação antes de apagar dados permanentes.
- **Organização por cliente:** cada cliente terá uma lista de cenários.  Utilize filtros ou campos de busca para encontrar cenários pelo título ou data de criação.
- **Data de criação/última edição:** registre quando cada cenário foi criado e atualizado.  Isso facilita o acompanhamento das versões de estudo e sua evolução ao longo do tempo.

## 3. Relatórios PDF customizáveis

### 3.1 Geração de relatório

1. **Conteúdo abrangente:** o PDF deve conter todas as informações da simulação: dados pessoais (respeitando a privacidade), premissas macroeconômicas, projeções de investimento, tabelas comparativas e gráficos.
2. **Gráficos bem formatados:** utilize cores e legendas claras para diferenciar cenários.  Garanta que os eixos estejam legíveis e que cada gráfico tenha título e fonte explicados na legenda.
3. **Narrativas e interpretações:** além de números, inclua breves explicações de cada cenário (por exemplo, “Neste cenário, com poupança anual de 60 000 R$, o capital acumulado é insuficiente para a renda desejada; sugerimos aumentar a poupança ou adiar a aposentadoria”).
4. **Personalização da capa:** a capa do PDF deve trazer o nome do cliente ou prospect, o nome do cenário e a data da simulação.  Se houver logo do consultor/empresa, inclua em destaque.

### 3.2 Exportação e download

1. **Botão de exportação:** após gerar a simulação, disponibilize um botão “Exportar PDF”.  Esse botão renderiza um modelo HTML com os dados e gráficos e o converte em PDF usando uma biblioteca (por exemplo, WeasyPrint ou wkhtmltopdf).
2. **Armazenamento opcional:** o consultor pode optar por armazenar o PDF no servidor ou baixá‑lo para compartilhar com o cliente.  Se armazenado, o cenário deve guardar o caminho para o arquivo.
3. **Edição pós‑exportação:** mesmo após gerar o PDF, o consultor pode voltar e alterar o cenário; uma nova exportação substitui ou gera um novo arquivo, conforme preferência.

## 4. Usabilidade e experiência do consultor

1. **Interface intuitiva:** use uma navegação em abas ou etapas para guiar o consultor pelas seções: dados do cliente, planejamento de aposentadoria, projetos, proteção familiar, resumo de resultados.
2. **Feedback imediato:** à medida que o consultor altera um parâmetro (idade de aposentadoria, poupança, rentabilidade), recalcule e atualize os gráficos em tempo real.  Isso torna a ferramenta didática e incentiva a experimentação de diferentes estratégias.
3. **Segurança e privacidade:** dados dos clientes devem ser protegidos.  Utilize autenticação e autorização para que apenas o consultor responsável acesse os cenários.

## 5. Conclusão

Incluir um sistema de gestão de cenários adiciona enorme valor ao aplicativo de planejamento financeiro.  Os consultores poderão criar versões alternativas para cada cliente, comparar resultados e, quando estiverem satisfeitos, gerar relatórios PDF personalizados e profissionalmente formatados.  Esse recurso facilita o acompanhamento do planejamento ao longo do tempo e torna a comunicação com clientes e prospects muito mais eficiente e customizada.