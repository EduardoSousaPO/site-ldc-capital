# Script para mover tudo da branch wealth-planning para main
Set-Location "$PSScriptRoot\site-ldc"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MOVENDO CONTEÚDO DE wealth-planning PARA main" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar branch atual
Write-Host "[1/6] Verificando branch atual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current 2>&1
Write-Host "Branch atual: $currentBranch" -ForegroundColor White
Write-Host ""

# 2. Adicionar todas as alterações
Write-Host "[2/6] Adicionando todas as alterações..." -ForegroundColor Yellow
git add -A 2>&1 | Out-Null
$status = git status --short
if ($status) {
    Write-Host "Alterações encontradas:" -ForegroundColor White
    Write-Host $status
} else {
    Write-Host "Nenhuma alteração pendente" -ForegroundColor Yellow
}
Write-Host ""

# 3. Fazer commit se houver alterações
Write-Host "[3/6] Fazendo commit das alterações..." -ForegroundColor Yellow
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
if ($commitOutput -match "nothing to commit") {
    Write-Host "Nenhuma alteração para commitar" -ForegroundColor Yellow
} else {
    Write-Host $commitOutput
    Write-Host "✓ Commit realizado" -ForegroundColor Green
}
Write-Host ""

# 4. Criar/verificar branch main
Write-Host "[4/6] Criando/verificando branch main..." -ForegroundColor Yellow
git checkout -b main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    git checkout main 2>&1 | Out-Null
}
Write-Host "✓ Branch main ativa" -ForegroundColor Green
Write-Host ""

# 5. Fazer merge da wealth-planning para main
Write-Host "[5/6] Fazendo merge de wealth-planning para main..." -ForegroundColor Yellow
$mergeOutput = git merge wealth-planning --no-edit 2>&1
Write-Host $mergeOutput
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Merge realizado com sucesso" -ForegroundColor Green
} else {
    Write-Host "⚠ Aviso no merge (pode ser que já estava atualizado)" -ForegroundColor Yellow
}
Write-Host ""

# 6. Configurar remote e fazer push
Write-Host "[6/6] Configurando remote e fazendo push..." -ForegroundColor Yellow
git remote set-url origin https://github.com/EduardoSousaPO/site-ldc-capital.git 2>&1 | Out-Null
$pushOutput = git push -u origin main 2>&1
Write-Host $pushOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ SUCESSO! Push realizado para branch main!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifique no GitHub:" -ForegroundColor Cyan
    Write-Host "https://github.com/EduardoSousaPO/site-ldc-capital/tree/main" -ForegroundColor White
    Write-Host ""
    Write-Host "O deploy na Vercel deve iniciar automaticamente." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "NOTA: A Vercel pode estar configurada para monitorar a branch 'master'." -ForegroundColor Yellow
    Write-Host "Se necessário, configure a Vercel para monitorar 'main' ou faça push também para 'master'." -ForegroundColor Yellow
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
}

