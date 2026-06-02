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
  origemFormulario:
    | 'Home'
    | 'Fale Conosco'
    | 'Materiais'
    | 'Page - ebook invest internacionais'
    | 'Calculadora IR Dividendos 2026'
    | 'Page - Live Eleições 2026'
    | 'Page - Guia LDC';
  // Atribuição UTM (opcionais — só preenchidos pelo form Home a partir do PR UTM YouTube).
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
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
        }),                                  // A: Data/Hora
        data.nome,                           // B: Nome Completo
        data.telefone,                       // C: Telefone
        data.email,                          // D: E-mail
        data.patrimonio,                     // E: Patrimônio
        data.origem,                         // F: Como nos conheceu?
        data.origemFormulario,               // G: Origem (Formulário)
        'Novo',                              // H: Status
        data.mensagem || data.titulo || '',  // I: Observações
        data.utm_source   ?? '',             // J: utm_source
        data.utm_medium   ?? '',             // K: utm_medium
        data.utm_campaign ?? '',             // L: utm_campaign
        data.utm_content  ?? '',             // M: utm_content
        data.utm_term     ?? '',             // N: utm_term
        data.landing_page ?? '',             // O: landing_page
        data.referrer     ?? '',             // P: referrer
      ]
    ];

    // Inserir dados na planilha
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Leads!A:P', // 16 colunas (A–I dados originais + J–P UTM)
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
      'Observações',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'landing_page',
      'referrer',
    ];

    // Inserir cabeçalhos
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Leads!A1:P1',
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
