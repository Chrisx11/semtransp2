# Script para remover código não utilizado
# Execute com cuidado e faça backup antes!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Limpeza de Código Não Utilizado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lista de arquivos/pastas para remover
$arquivosParaRemover = @(
    # Arquivos de backup
    "components\troca-oleo-dialog.tsx.bak",
    "app\dashboard\manutencoes\troca-oleo\page.tsx.bak",
    "components\troca-oleo-dialog.tsx.new",
    
    # Código não utilizado
    "components\ChatWidget.tsx",
    "services\nota-service.ts",
    "app\services\veiculo-service.ts",
    "pages\api\teste-env.js",
    "app\dashboard\supabase-diagnostico.tsx",
    
    # Páginas de diagnóstico (descomente se quiser remover)
    # "app\dashboard\servico-externo\fornecedores\diagnostico",
    # "app\dashboard\servico-externo\borracharia\diagnostico"
)

$pastasParaRemover = @(
    # Pastas de diagnóstico (descomente se quiser remover)
    # "app\dashboard\servico-externo\fornecedores\diagnostico",
    # "app\dashboard\servico-externo\borracharia\diagnostico"
)

Write-Host "Arquivos que serão removidos:" -ForegroundColor Yellow
foreach ($arquivo in $arquivosParaRemover) {
    if (Test-Path $arquivo) {
        Write-Host "  - $arquivo" -ForegroundColor White
    } else {
        Write-Host "  - $arquivo (não encontrado)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Pastas que serão removidas:" -ForegroundColor Yellow
foreach ($pasta in $pastasParaRemover) {
    if (Test-Path $pasta) {
        Write-Host "  - $pasta" -ForegroundColor White
    } else {
        Write-Host "  - $pasta (não encontrada)" -ForegroundColor Gray
    }
}

Write-Host ""
$confirmacao = Read-Host "Deseja continuar? (S/N)"

if ($confirmacao -ne "S" -and $confirmacao -ne "s") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Removendo arquivos..." -ForegroundColor Green

$removidos = 0
$naoEncontrados = 0

# Remover arquivos
foreach ($arquivo in $arquivosParaRemover) {
    if (Test-Path $arquivo) {
        try {
            Remove-Item $arquivo -Force
            Write-Host "  ✓ Removido: $arquivo" -ForegroundColor Green
            $removidos++
        } catch {
            Write-Host "  ✗ Erro ao remover: $arquivo - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Não encontrado: $arquivo" -ForegroundColor Gray
        $naoEncontrados++
    }
}

# Remover pastas
foreach ($pasta in $pastasParaRemover) {
    if (Test-Path $pasta) {
        try {
            Remove-Item $pasta -Recurse -Force
            Write-Host "  ✓ Removida: $pasta" -ForegroundColor Green
            $removidos++
        } catch {
            Write-Host "  ✗ Erro ao remover: $pasta - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Não encontrada: $pasta" -ForegroundColor Gray
        $naoEncontrados++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo:" -ForegroundColor Cyan
Write-Host "  Removidos: $removidos" -ForegroundColor Green
Write-Host "  Não encontrados: $naoEncontrados" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se há pastas vazias para limpar
Write-Host "Verificando pastas vazias..." -ForegroundColor Yellow

$pastasParaVerificar = @(
    "app\services",
    "pages\api",
    "pages"
)

foreach ($pasta in $pastasParaVerificar) {
    if (Test-Path $pasta) {
        $arquivos = Get-ChildItem $pasta -Recurse -File
        if ($arquivos.Count -eq 0) {
            Write-Host "  ⚠ Pasta vazia encontrada: $pasta" -ForegroundColor Yellow
            $removerPastaVazia = Read-Host "    Deseja remover? (S/N)"
            if ($removerPastaVazia -eq "S" -or $removerPastaVazia -eq "s") {
                try {
                    Remove-Item $pasta -Recurse -Force
                    Write-Host "  ✓ Pasta removida: $pasta" -ForegroundColor Green
                } catch {
                    Write-Host "  ✗ Erro ao remover pasta: $pasta - $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    }
}

Write-Host ""
Write-Host "Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Execute 'npm run build' para verificar se não quebrou nada" -ForegroundColor White
Write-Host "  2. Teste a aplicação" -ForegroundColor White
Write-Host "  3. Faça commit das mudanças" -ForegroundColor White
Write-Host ""

