import { createSheetsHeaders } from '../src/lib/google-sheets';

async function setupGoogleSheets() {
  console.log('Configurando cabeçalhos do Google Sheets...');
  
  try {
    const result = await createSheetsHeaders();
    
    if (result.success) {
      console.log('✅ Cabeçalhos criados com sucesso no Google Sheets!');
      console.log('A planilha está pronta para receber leads.');
    } else {
      console.error('❌ Erro ao criar cabeçalhos:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  setupGoogleSheets();
}

export { setupGoogleSheets };














