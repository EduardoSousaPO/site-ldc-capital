/**
 * Script de Testes Simples - Wealth Planning API
 * Testa as rotas API diretamente usando fetch
 */

const https = require('https');
const http = require('http');

// Configuração
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/admin/wealth-planning`;

const results = [];

function logTest(name, passed, error, details) {
  results.push({ name, passed, error, details });
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (error) {
    console.log(`   Erro: ${error}`);
  }
  if (details) {
    console.log(`   Detalhes:`, JSON.stringify(details, null, 2));
  }
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 5000, // 5 segundos de timeout
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        reject(new Error(`Conexão recusada - servidor não está rodando em ${url}`));
      } else {
        reject(error);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout ao conectar com ${url}`));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testListClients() {
  try {
    const response = await makeRequest(`${API_BASE}/clients`);
    
    if (response.status === 401) {
      logTest('Listar Clientes', false, 'Não autorizado - precisa estar logado');
      return null;
    }
    
    if (response.status !== 200) {
      logTest('Listar Clientes', false, `Status ${response.status}`, response.data);
      return null;
    }

    logTest('Listar Clientes', true, undefined, { 
      count: Array.isArray(response.data) ? response.data.length : 0 
    });
    return response.data;
  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('servidor não está rodando')) {
      logTest('Listar Clientes', false, `Servidor não está rodando. Execute 'npm run dev' primeiro.`);
    } else {
      logTest('Listar Clientes', false, error.message);
    }
    return null;
  }
}

async function testCreateClient() {
  try {
    const testClient = {
      name: `Cliente Teste ${Date.now()}`,
      email: `teste${Date.now()}@exemplo.com`,
      phone: '11999999999',
      notes: 'Cliente criado por teste automatizado',
    };

    const response = await makeRequest(`${API_BASE}/clients`, {
      method: 'POST',
      body: testClient,
    });

    if (response.status === 401) {
      logTest('Criar Cliente', false, 'Não autorizado - precisa estar logado');
      return null;
    }

    if (response.status !== 201) {
      logTest('Criar Cliente', false, `Status ${response.status}`, response.data);
      return null;
    }

    logTest('Criar Cliente', true, undefined, { 
      id: response.data.id, 
      name: response.data.name 
    });
    return response.data;
  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('servidor não está rodando')) {
      logTest('Criar Cliente', false, `Servidor não está rodando. Execute 'npm run dev' primeiro.`);
    } else {
      logTest('Criar Cliente', false, error.message);
    }
    return null;
  }
}

async function testDeleteClient(clientId) {
  try {
    const response = await makeRequest(`${API_BASE}/clients/${clientId}`, {
      method: 'DELETE',
    });

    if (response.status === 401) {
      logTest('Excluir Cliente', false, 'Não autorizado - precisa estar logado');
      return false;
    }

    if (response.status === 400) {
      // Esperado se cliente tem cenários
      logTest('Excluir Cliente (com cenários)', true, undefined, {
        message: 'Erro esperado - cliente tem cenários vinculados',
        error: response.data.error,
      });
      return true;
    }

    if (response.status !== 200) {
      logTest('Excluir Cliente', false, `Status ${response.status}`, response.data);
      return false;
    }

    logTest('Excluir Cliente', true);
    return true;
  } catch (error) {
    logTest('Excluir Cliente', false, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testes de API - Wealth Planning\n');
  console.log(`URL Base: ${BASE_URL}\n`);

  // Teste 1: Listar Clientes
  console.log('📋 Teste 1: Listar Clientes');
  const clients = await testListClients();

  // Teste 2: Criar Cliente
  console.log('\n📋 Teste 2: Criar Cliente');
  const newClient = await testCreateClient();

  if (newClient) {
    // Teste 3: Excluir Cliente (sem cenários)
    console.log('\n📋 Teste 3: Excluir Cliente (sem cenários)');
    await testDeleteClient(newClient.id);
  }

  // Resumo
  console.log('\n\n📊 RESUMO DOS TESTES\n');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  console.log('='.repeat(60));
  console.log(`\nTotal: ${total} | Passou: ${passed} | Falhou: ${failed}`);
  console.log(`Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('⚠️  Alguns testes falharam.');
    console.log('💡 Nota: Testes que requerem autenticação podem falhar se você não estiver logado.\n');
  } else {
    console.log('✅ Todos os testes passaram!\n');
  }
}

runTests().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

