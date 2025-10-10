// Teste da integração com Google Sheets
// Execute este arquivo após configurar as variáveis de ambiente

const testData = {
  nome: "Eduardo Sousa",
  telefone: "(62) 99159-5338",
  email: "eduspires123@gmail.com",
  patrimonio: "300k-1m",
  origem: "youtube",
  consentimento: true
};

console.log('🧪 Testando integração com Google Sheets...');
console.log('📝 Dados de teste:', testData);

fetch('http://localhost:3000/api/lead', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📊 Status da resposta:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Resposta da API:', data);
  
  if (data.success) {
    console.log('🎉 Teste bem-sucedido!');
    console.log('📋 Verifique a planilha Google Sheets para confirmar que os dados foram inseridos.');
    console.log('📧 Verifique se os emails foram enviados (se configurado).');
  } else {
    console.log('❌ Teste falhou:', data.message);
  }
})
.catch(error => {
  console.error('🚨 Erro no teste:', error);
});

// Exemplo de como os dados aparecerão na planilha:
console.log('\n📋 Exemplo de como os dados aparecerão na planilha:');
console.log('┌─────────────────────┬──────────────┬─────────────────┬─────────────────────────┬─────────────────────────┬──────────────────────┬─────────────────┬────────┬─────────────┐');
console.log('│ Data/Hora           │ Nome Completo│ Telefone        │ E-mail                  │ Patrimônio              │ Como nos conheceu?   │ Origem          │ Status │ Observações │');
console.log('├─────────────────────┼──────────────┼─────────────────┼─────────────────────────┼─────────────────────────┼──────────────────────┼─────────────────┼────────┼─────────────┤');
console.log('│ 03/10/2025 14:30:25 │ Eduardo Sousa│ (62) 99159-5338 │ eduspires123@gmail.com  │ R$ 300.000-R$ 1.000.000│ YouTube              │ Home            │ Novo   │             │');
console.log('└─────────────────────┴──────────────┴─────────────────┴─────────────────────────┴─────────────────────────┴──────────────────────┴─────────────────┴────────┴─────────────┘');







