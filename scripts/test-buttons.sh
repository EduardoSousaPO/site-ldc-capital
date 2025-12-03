#!/bin/bash

# Script de Testes - Wealth Planning
# Testa as funcionalidades básicas usando curl

BASE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL}/api/admin/wealth-planning"

echo "🧪 Testes de API - Wealth Planning"
echo "URL Base: ${BASE_URL}"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo "📋 Testando: $name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ $name - Status: $http_code${NC}"
        PASSED=$((PASSED + 1))
        echo "   Resposta: $body" | head -c 200
        echo ""
        return 0
    elif [ "$http_code" = "401" ]; then
        echo -e "${YELLOW}⚠️  $name - Não autorizado (401)${NC}"
        echo "   Nota: Você precisa estar logado para este teste"
        FAILED=$((FAILED + 1))
        return 1
    else
        echo -e "${RED}❌ $name - Status: $http_code${NC}"
        echo "   Resposta: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Teste 1: Listar Clientes
test_endpoint "Listar Clientes" "GET" "${API_BASE}/clients"

# Teste 2: Criar Cliente
TIMESTAMP=$(date +%s)
CLIENT_DATA="{\"name\":\"Cliente Teste $TIMESTAMP\",\"email\":\"teste$TIMESTAMP@exemplo.com\",\"phone\":\"11999999999\"}"
test_endpoint "Criar Cliente" "POST" "${API_BASE}/clients" "$CLIENT_DATA"

# Resumo
echo ""
echo "📊 RESUMO DOS TESTES"
echo "===================="
echo -e "${GREEN}Passou: $PASSED${NC}"
echo -e "${RED}Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Alguns testes falharam.${NC}"
    echo "💡 Nota: Testes que requerem autenticação podem falhar se você não estiver logado."
    exit 1
fi

