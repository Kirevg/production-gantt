# ========================================
#   ПЕРЕЗАПУСК СЕРВЕРОВ PRODUCTION GANTT
# ========================================

Write-Host "Останавливаем старые процессы..." -ForegroundColor Yellow

# Останавливаем все процессы Node.js
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Закрываем все CMD окна, кроме тех, что содержат "Git Auto-Commit"
Get-Process -Name "cmd" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -notmatch "Git Auto-Commit" -and
    $_.MainWindowTitle -notmatch "Администратор.*cmd.exe" -and
    $_.MainWindowTitle -ne ""
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Дополнительно закрываем все CMD окна с пустыми заголовками (старые серверы)
Get-Process -Name "cmd" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -eq "" -or
    $_.MainWindowTitle -match "C:\\Projects\\production-gantt"
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Пауза 2 секунды
Start-Sleep -Seconds 2

Write-Host "Запускаем API сервер..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\api && npm run dev" -WindowStyle Normal

Write-Host "Запускаем Frontend сервер..." -ForegroundColor Green  
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\web && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   СЕРВЕРЫ ЗАПУЩЕНЫ!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
