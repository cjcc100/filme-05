# Script PowerShell para enviar mudanças ao GitHub
# Uso: .\.push.ps1 "Mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 Iniciando processo de push para GitHub..." -ForegroundColor Green

# Adicionar todas as mudanças
Write-Host "📝 Adicionando arquivos modificados..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Criando commit: $CommitMessage" -ForegroundColor Yellow
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar commit. Verifique se há mudanças para commitar." -ForegroundColor Red
    exit 1
}

# Push para o GitHub
Write-Host "📤 Enviando para GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sucesso! Mudanças enviadas para o GitHub." -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao fazer push. Verifique sua conexão e permissões." -ForegroundColor Red
    exit 1
}
