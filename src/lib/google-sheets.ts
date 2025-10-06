import { google } from 'googleapis';

// Configuração do Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Função para autenticar com Google Sheets
export async function getGoogleSheetsAuth() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return auth;
}

// Função para adicionar dados ao Google Sheets
export async function addToGoogleSheets(data: {
  nome: string;
  email: string;
  telefone: string;
  patrimonio: string;
  origem: string;
  mensagem?: string;
  titulo?: string;
  origemFormulario: 'Home' | 'Fale Conosco' | 'Materiais';
}) {
  try {
    const auth = await getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_ID não configurado');
    }

    // Dados para inserir na planilha - ordem correspondente aos cabeçalhos
    const values = [
      [
        new Date().toLocaleString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }), // Data/Hora formatada
        data.nome, // Nome Completo
        data.telefone, // Telefone
        data.email, // E-mail
        data.patrimonio, // Patrimônio para Investimento
        data.origem, // Como nos conheceu?
        data.origemFormulario, // Origem (Formulário)
        'Novo', // Status inicial
        data.mensagem || data.titulo || '' // Observações (mensagem ou título se houver)
      ]
    ];

    // Inserir dados na planilha
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Leads!A:I', // Colunas A até I (9 colunas)
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log('Dados adicionados ao Google Sheets:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erro ao adicionar dados ao Google Sheets:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Função para criar a planilha com cabeçalhos (executar uma vez)
export async function createSheetsHeaders() {
  try {
    const auth = await getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_ID não configurado');
    }

    // Cabeçalhos da planilha - correspondentes aos campos do formulário
    const headers = [
      'Data/Hora',
      'Nome Completo',
      'Telefone',
      'E-mail',
      'Patrimônio para Investimento',
      'Como nos conheceu?',
      'Origem (Formulário)',
      'Status',
      'Observações'
    ];

    // Inserir cabeçalhos
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Leads!A1:I1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });

    console.log('Cabeçalhos criados no Google Sheets:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erro ao criar cabeçalhos no Google Sheets:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}
