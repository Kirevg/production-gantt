# Фоновый автокоммит Git
Set-Location "C:\Projects\production-gantt"

Write-Host "Запуск автокоммита в фоне..."

while ($true) {
    try {
        git add .
        git commit -m "Auto-commit $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -m "Автоматический коммит"
        Write-Host "Коммит выполнен: $(Get-Date)"
    }
    catch {
        Write-Host "Ошибка коммита: $($_.Exception.Message)"
    }
    
    Start-Sleep -Seconds 300  # 5 минут
}
