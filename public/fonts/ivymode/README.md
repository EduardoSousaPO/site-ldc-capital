# Fonte IvyMode - LDC Capital

## Arquivos Necessários

Para que a fonte IvyMode funcione corretamente, você precisa adicionar os seguintes arquivos nesta pasta:

### Arquivos WOFF2 Requeridos:
- `IvyMode-Regular.woff2` (peso 400)
- `IvyMode-SemiBold.woff2` (peso 600) 
- `IvyMode-Bold.woff2` (peso 700)

### Como Obter os Arquivos:

1. **Se você tem os arquivos originais (.otf, .ttf):**
   - Converta para WOFF2 usando: https://cloudconvert.com/ttf-to-woff2
   - Renomeie conforme os nomes acima

2. **Se você tem apenas um arquivo:**
   - Duplique o arquivo para os 3 pesos
   - Renomeie conforme necessário

3. **Fallback Atual:**
   - Enquanto não houver os arquivos, o sistema usa Georgia como fallback
   - A tipografia já está configurada corretamente

### Verificação:
Após adicionar os arquivos, execute `npm run build` para verificar se não há erros.

### Estrutura Esperada:
```
public/fonts/ivymode/
├── IvyMode-Regular.woff2
├── IvyMode-SemiBold.woff2
├── IvyMode-Bold.woff2
└── README.md (este arquivo)
```

## Uso no Projeto

A fonte está configurada para ser usada automaticamente em todos os títulos (h1-h6) através da classe `font-serif`.

**Conforme Manual da Marca LDC Capital:**
- ✅ **Títulos**: IvyMode (esta fonte)
- ✅ **Corpo de texto**: Public Sans (já configurada)
