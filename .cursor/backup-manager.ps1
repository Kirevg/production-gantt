# Менеджер бэкапов для проекта Production Gantt
# Запуск: .\backup-manager.ps1

param(
    [string]$Action = "menu",
    [string]$BackupName = "",
    [string]$Description = "",
    [int]$IntervalMinutes = 5
)

Write-Host "🔧 Менеджер бэкапов Production Gantt" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

switch ($Action.ToLower()) {
    "start" {
        if ($IntervalMinutes -ne 5) {
            Write-Host "🚀 Запускаем автоматическое сохранение (интервал: $IntervalMinutes мин)..." -ForegroundColor Green
            node auto-save.js start $IntervalMinutes
        } else {
            Write-Host "🚀 Запускаем автоматическое сохранение..." -ForegroundColor Green
            node auto-save.js start
        }
    }
    
    "stop" {
        Write-Host "🛑 Останавливаем автоматическое сохранение..." -ForegroundColor Yellow
        node auto-save.js stop
    }
    
    "backup" {
        if ($Description) {
            Write-Host "💾 Создаем бэкап: $Description" -ForegroundColor Green
            node auto-save.js backup $Description
        } else {
            Write-Host "💾 Создаем бэкап..." -ForegroundColor Green
            node auto-save.js backup
        }
    }
    
    "list" {
        Write-Host "📋 Список бэкапов:" -ForegroundColor Cyan
        node auto-save.js list
    }
    
    "restore" {
        if ($BackupName) {
            Write-Host "🔄 Восстанавливаем из бэкапа: $BackupName" -ForegroundColor Yellow
            node auto-save.js restore $BackupName
        } else {
            Write-Host "❌ Укажите имя бэкапа для восстановления" -ForegroundColor Red
            Write-Host "Пример: .\backup-manager.ps1 restore backup-2025-10-19T18-30-00-000Z" -ForegroundColor White
        }
    }
    
    "status" {
        Write-Host "📊 Статус системы бэкапов:" -ForegroundColor Cyan
        
        # Проверяем директорию бэкапов
        $backupDir = ".\backups"
        if (Test-Path $backupDir) {
            $backupCount = (Get-ChildItem $backupDir -Directory).Count
            Write-Host "  📁 Директория бэкапов: $backupDir" -ForegroundColor Green
            Write-Host "  📊 Количество бэкапов: $backupCount" -ForegroundColor White
            
            # Показываем размер директории
            $size = (Get-ChildItem $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Host "  💾 Общий размер: $sizeMB MB" -ForegroundColor White
        } else {
            Write-Host "  ❌ Директория бэкапов не найдена" -ForegroundColor Red
        }
        
        # Проверяем Git статус
        try {
            $gitStatus = git status --porcelain 2>$null
            if ($LASTEXITCODE -eq 0) {
                $changes = ($gitStatus -split "`n").Count
                Write-Host "  🔄 Git изменений: $changes" -ForegroundColor White
            }
        } catch {
            Write-Host "  ⚠️ Git недоступен" -ForegroundColor Yellow
        }
    }
    
    "cleanup" {
        Write-Host "🧹 Очистка старых бэкапов..." -ForegroundColor Yellow
        node auto-save.js cleanup
    }
    
    "menu" {
        Write-Host "📋 Доступные команды:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  start [минуты] - Запустить автосохранение (по умолчанию 5 мин)" -ForegroundColor White
        Write-Host "  stop            - Остановить автосохранение" -ForegroundColor White
        Write-Host "  backup          - Создать бэкап вручную" -ForegroundColor White
        Write-Host "  list            - Показать список бэкапов" -ForegroundColor White
        Write-Host "  restore         - Восстановить из бэкапа" -ForegroundColor White
        Write-Host "  status          - Показать статус системы" -ForegroundColor White
        Write-Host "  cleanup         - Очистить старые бэкапы" -ForegroundColor White
        Write-Host ""
        Write-Host "Примеры использования:" -ForegroundColor Yellow
        Write-Host "  .\backup-manager.ps1 start           # каждые 5 минут" -ForegroundColor White
        Write-Host "  .\backup-manager.ps1 start -IntervalMinutes 10  # каждые 10 минут" -ForegroundColor White
        Write-Host "  .\backup-manager.ps1 start -IntervalMinutes 1   # каждую минуту" -ForegroundColor White
        Write-Host "  .\backup-manager.ps1 backup 'Описание бэкапа'" -ForegroundColor White
        Write-Host "  .\backup-manager.ps1 restore backup-2025-10-19T18-30-00-000Z" -ForegroundColor White
        Write-Host "  .\backup-manager.ps1 status" -ForegroundColor White
    }
    
    default {
        Write-Host "❌ Неизвестная команда: $Action" -ForegroundColor Red
        Write-Host "Используйте 'menu' для просмотра доступных команд" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎯 Система бэкапов готова к работе!" -ForegroundColor Green
