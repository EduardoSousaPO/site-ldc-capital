# Script para fazer push das correções
Set-Location "$PSScriptRoot\site-ldc"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FAZENDO PUSH DAS CORREÇÕES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar branch atual
Write-Host "[1/5] Verificando branch atual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current 2>&1 | Out-String
Write-Host "Branch: $currentBranch" -ForegroundColor White
Write-Host ""

# 2. Adicionar todas as alterações
Write-Host "[2/5] Adicionando alterações..." -ForegroundColor Yellow
git add -A 2>&1 | Out-Null
$status = git status --short 2>&1 | Out-String
if ($status.Trim()) {
    Write-Host "Alterações:" -ForegroundColor White
    Write-Host $status
} else {
    Write-Host "Nenhuma alteração pendente" -ForegroundColor Yellow
}
Write-Host ""

# 3. Fazer commit
Write-Host "[3/5] Fazendo commit..." -ForegroundColor Yellow
$commitMsg = @"
fix: corrige erros de build - adiciona componentes faltantes

- Cria componente ScenarioWizard para criação/edição de cenários
- Cria componente ScenarioComparisonView para comparação de cenários
- Adiciona tipo ScenarioData que estava faltando
- Corrige imports nos arquivos admin/wealth-planning
- Resolve erros de módulos não encontrados no build da Vercel
"@

$commitOutput = git commit -m $commitMsg 2>&1 | Out-String
if ($commitOutput -match "nothing to commit") {
    Write-Host "Nenhuma alteração para commitar" -ForegroundColor Yellow
} else {
    Write-Host $commitOutput
    Write-Host "✓ Commit realizado" -ForegroundColor Green
}
Write-Host ""

# 4. Verificar qual branch fazer push
Write-Host "[4/5] Verificando branch para push..." -ForegroundColor Yellow
$branch = git branch --show-current 2>&1 | Out-String
$branch = $branch.Trim()
Write-Host "Branch atual: $branch" -ForegroundColor White
Write-Host ""

# 5. Fazer push
Write-Host "[5/5] Fazendo push..." -ForegroundColor Yellow
git remote set-url origin https://github.com/EduardoSousaPO/site-ldc-capital.git 2>&1 | Out-Null

if ($branch -eq "main") {
    $pushOutput = git push origin main 2>&1 | Out-String
} else {
    $pushOutput = git push origin master 2>&1 | Out-String
}

Write-Host $pushOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ SUCESSO! Push realizado!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "O deploy na Vercel deve iniciar automaticamente." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ ERRO no push" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

