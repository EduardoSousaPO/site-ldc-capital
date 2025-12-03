# Script para corrigir o problema de branches e fazer push
Set-Location "$PSScriptRoot\site-ldc"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORRIGINDO REPOSITÓRIO GIT E FAZENDO PUSH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se está no diretório correto
Write-Host "[1/7] Verificando diretório..." -ForegroundColor Yellow
Write-Host "Diretório: $(Get-Location)" -ForegroundColor White
if (-not (Test-Path .git)) {
    Write-Host "ERRO: Repositório Git não encontrado em $(Get-Location)" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Repositório Git encontrado" -ForegroundColor Green
Write-Host ""

# 2. Configurar remote
Write-Host "[2/7] Configurando remote origin..." -ForegroundColor Yellow
git remote remove origin 2>&1 | Out-Null
git remote add origin https://github.com/EduardoSousaPO/site-ldc-capital.git
Write-Host "✓ Remote configurado" -ForegroundColor Green
Write-Host ""

# 3. Fazer fetch
Write-Host "[3/7] Fazendo fetch do remote..." -ForegroundColor Yellow
git fetch origin
Write-Host "✓ Fetch concluído" -ForegroundColor Green
Write-Host ""

# 4. Verificar/criar branch master
Write-Host "[4/7] Verificando branch master..." -ForegroundColor Yellow
$currentBranch = git branch --show-current 2>&1
if ($currentBranch -and $currentBranch -ne "") {
    Write-Host "Branch atual: $currentBranch" -ForegroundColor White
    if ($currentBranch -ne "master") {
        Write-Host "Trocando para branch master..." -ForegroundColor Yellow
        git checkout master 2>&1
        if ($LASTEXITCODE -ne 0) {
            git checkout -b master origin/master 2>&1
            if ($LASTEXITCODE -ne 0) {
                git checkout -b master 2>&1
            }
        }
    }
} else {
    Write-Host "Nenhuma branch local. Criando master..." -ForegroundColor Yellow
    git checkout -b master origin/master 2>&1
    if ($LASTEXITCODE -ne 0) {
        git checkout -b master 2>&1
    }
}
Write-Host "✓ Branch master ativa" -ForegroundColor Green
Write-Host ""

# 5. Adicionar arquivos
Write-Host "[5/7] Adicionando arquivos..." -ForegroundColor Yellow
git add -A
$status = git status --short
if ($status) {
    Write-Host "Arquivos modificados:" -ForegroundColor White
    Write-Host $status
} else {
    Write-Host "Nenhum arquivo modificado" -ForegroundColor Yellow
}
Write-Host ""

# 6. Fazer commit
Write-Host "[6/7] Fazendo commit..." -ForegroundColor Yellow
$commitMsg = @"
feat: adiciona simulador PGBL e melhora PDFs com logo LDC

- Cria simulador PGBL completo com cálculos fiscais
- Adiciona campos para consultor e lead
- Implementa exportação PDF para PGBL
- Melhora layout dos PDFs (PGBL e Wealth Planning)
- Adiciona logo LDC Capital em base64 nos PDFs
- Melhora explicação da economia fiscal acumulada
- Aplica design system LDC nos PDFs
"@

$commitOutput = git commit -m $commitMsg 2>&1
Write-Host $commitOutput
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit realizado" -ForegroundColor Green
} else {
    Write-Host "⚠ Aviso no commit (pode ser que não havia mudanças)" -ForegroundColor Yellow
}
Write-Host ""

# 7. Fazer push
Write-Host "[7/7] Fazendo push para origin/master..." -ForegroundColor Yellow
$pushOutput = git push -u origin master 2>&1
Write-Host $pushOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ SUCESSO! Push realizado com sucesso!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifique no GitHub:" -ForegroundColor Cyan
    Write-Host "https://github.com/EduardoSousaPO/site-ldc-capital/commits/master" -ForegroundColor White
    Write-Host ""
    Write-Host "O deploy na Vercel deve iniciar automaticamente em alguns segundos." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ ERRO no push" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "1. Credenciais do GitHub não configuradas" -ForegroundColor White
    Write-Host "2. Necessário Personal Access Token" -ForegroundColor White
    Write-Host "3. Problema de permissões no repositório" -ForegroundColor White
    Write-Host ""
    Write-Host "Configure as credenciais:" -ForegroundColor Yellow
    Write-Host "git config --global user.name 'Seu Nome'" -ForegroundColor White
    Write-Host "git config --global user.email 'seu-email@example.com'" -ForegroundColor White
}

