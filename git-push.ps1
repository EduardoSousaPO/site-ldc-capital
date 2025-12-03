# Script para fazer commit e push das alterações
Set-Location "$PSScriptRoot\site-ldc"

Write-Host "=== DIAGNÓSTICO ===" -ForegroundColor Cyan
Write-Host "Diretório atual: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Git instalado: $(git --version 2>&1)" -ForegroundColor Yellow
Write-Host "Repositório Git existe: $(Test-Path .git)" -ForegroundColor Yellow

if (-not (Test-Path .git)) {
    Write-Host "ERRO: Repositório Git não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== VERIFICANDO BRANCHES ===" -ForegroundColor Cyan
$branches = git branch -a 2>&1
Write-Host $branches

if ($branches -match "no branches") {
    Write-Host "Nenhuma branch local encontrada. Configurando..." -ForegroundColor Yellow
    
    # Configurar remote
    Write-Host "Configurando remote origin..." -ForegroundColor Yellow
    git remote remove origin 2>&1 | Out-Null
    git remote add origin https://github.com/EduardoSousaPO/site-ldc-capital.git 2>&1 | Out-Null
    
    # Fazer fetch para trazer branches remotas
    Write-Host "Fazendo fetch do remote..." -ForegroundColor Yellow
    git fetch origin 2>&1
    
    # Tentar fazer checkout da branch master remota
    Write-Host "Fazendo checkout da branch master..." -ForegroundColor Yellow
    git checkout -b master origin/master 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Se não existir master remota, criar localmente
        Write-Host "Criando branch master local..." -ForegroundColor Yellow
        git checkout -b master 2>&1
    }
}

Write-Host "`n=== STATUS DO REPOSITÓRIO ===" -ForegroundColor Cyan
git status

Write-Host "`n=== ADICIONANDO ARQUIVOS ===" -ForegroundColor Cyan
git add -A
$added = git status --short
if ($added) {
    Write-Host "Arquivos adicionados:" -ForegroundColor Green
    Write-Host $added
} else {
    Write-Host "Nenhum arquivo para adicionar" -ForegroundColor Yellow
}

Write-Host "`n=== FAZENDO COMMIT ===" -ForegroundColor Cyan
$commitMsg = "feat: adiciona simulador PGBL e melhora PDFs com logo LDC

- Cria simulador PGBL completo com cálculos fiscais
- Adiciona campos para consultor e lead
- Implementa exportação PDF para PGBL
- Melhora layout dos PDFs (PGBL e Wealth Planning)
- Adiciona logo LDC Capital em base64 nos PDFs
- Melhora explicação da economia fiscal acumulada
- Aplica design system LDC nos PDFs"

$commitResult = git commit -m $commitMsg 2>&1
Write-Host $commitResult

Write-Host "`n=== CONFIGURANDO REMOTE ===" -ForegroundColor Cyan
git remote set-url origin https://github.com/EduardoSousaPO/site-ldc-capital.git
$remote = git remote -v
Write-Host $remote

Write-Host "`n=== FAZENDO PUSH ===" -ForegroundColor Cyan
$pushResult = git push origin master 2>&1
Write-Host $pushResult

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== SUCESSO! ===" -ForegroundColor Green
    Write-Host "Commit e push realizados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`n=== ERRO NO PUSH ===" -ForegroundColor Red
    Write-Host "Código de saída: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Verifique as credenciais do GitHub" -ForegroundColor Yellow
}

