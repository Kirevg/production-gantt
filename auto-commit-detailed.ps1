# Автоматическое протоколирование изменений в Git
# Использование: powershell -ExecutionPolicy Bypass -File auto-commit-detailed.ps1

param(
    [int]$IntervalSeconds = 300  # Интервал проверки (по умолчанию 5 минут)
)

Write-Host "=== Автоматическое протоколирование Git ===" -ForegroundColor Green
Write-Host "Интервал проверки: $IntervalSeconds секунд" -ForegroundColor Yellow
Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

$logFile = "git-auto-commit.log"

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # Проверяем наличие изменений
    $status = git status --porcelain
    
    if ($status) {
        # Есть изменения - коммитим
        git add .
        
        # Получаем список измененных файлов
        $changedFiles = git diff --cached --name-only
        $fileCount = ($changedFiles | Measure-Object).Count
        
        $commitMessage = "Auto-commit: $timestamp - $fileCount файл(ов) изменено"
        
        git commit -m "$commitMessage" | Out-Null
        
        $logMessage = "[$timestamp] COMMIT: $fileCount файл(ов)"
        Write-Host $logMessage -ForegroundColor Green
        Add-Content -Path $logFile -Value $logMessage
        
        # Логируем измененные файлы
        foreach ($file in $changedFiles) {
            $fileLog = "  - $file"
            Write-Host $fileLog -ForegroundColor Gray
            Add-Content -Path $logFile -Value $fileLog
        }
    } else {
        $logMessage = "[$timestamp] Нет изменений"
        Write-Host $logMessage -ForegroundColor DarkGray
    }
    
    Start-Sleep -Seconds $IntervalSeconds
}

