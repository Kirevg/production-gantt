# Установка службы Windows для автокоммита Git
# Запуск от имени администратора

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status
)

$serviceName = "GitAutoCommit"
$scriptPath = "C:\Projects\production-gantt\auto-commit-detailed.ps1"

function Install-Service {
    Write-Host "Установка службы $serviceName..." -ForegroundColor Yellow
    
    # Создаем службу
    New-Service -Name $serviceName -BinaryPathName "powershell.exe -ExecutionPolicy Bypass -File $scriptPath" -DisplayName "Git Auto Commit Service" -Description "Автоматическое логирование Git изменений" -StartupType Automatic
    
    Write-Host "✅ Служба установлена" -ForegroundColor Green
}

function Uninstall-Service {
    Write-Host "Удаление службы $serviceName..." -ForegroundColor Yellow
    
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Remove-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    Write-Host "✅ Служба удалена" -ForegroundColor Green
}

function Start-Service {
    Write-Host "Запуск службы $serviceName..." -ForegroundColor Yellow
    Start-Service -Name $serviceName
    Write-Host "✅ Служба запущена" -ForegroundColor Green
}

function Stop-Service {
    Write-Host "Остановка службы $serviceName..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force
    Write-Host "✅ Служба остановлена" -ForegroundColor Green
}

function Show-Status {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "Статус службы $serviceName`: $($service.Status)" -ForegroundColor Cyan
    } else {
        Write-Host "Служба $serviceName не установлена" -ForegroundColor Red
    }
}

# Основная логика
if ($Install) {
    Install-Service
} elseif ($Uninstall) {
    Uninstall-Service
} elseif ($Start) {
    Start-Service
} elseif ($Stop) {
    Stop-Service
} elseif ($Status) {
    Show-Status
} else {
    Write-Host "Использование:" -ForegroundColor Yellow
    Write-Host "  .\install-git-autocommit-service.ps1 -Install    # Установить службу" -ForegroundColor White
    Write-Host "  .\install-git-autocommit-service.ps1 -Uninstall  # Удалить службу" -ForegroundColor White
    Write-Host "  .\install-git-autocommit-service.ps1 -Start      # Запустить службу" -ForegroundColor White
    Write-Host "  .\install-git-autocommit-service.ps1 -Stop      # Остановить службу" -ForegroundColor White
    Write-Host "  .\install-git-autocommit-service.ps1 -Status    # Показать статус" -ForegroundColor White
}
