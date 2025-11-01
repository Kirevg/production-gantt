Write-Host ========================================
Write-Host   ПЕРЕЗАПУСК СЕРВЕРОВ PRODUCTION GANTT
Write-Host ========================================

# Закрываем все процессы Node.js и CMD
Write-Host "Закрываем старые процессы..." -ForegroundColor Yellow

taskkill /f /im node.exe 2>$null

# Закрываем cmd окна с PRODUCTION в заголовке
Get-Process cmd -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match 'PRODUCTION' } | Stop-Process -Force -ErrorAction SilentlyContinue

# Пауза 2 секунды
Start-Sleep -Seconds 2

Write-Host "Запускаем API сервер (порт 4000)..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "title PRODUCTION-GANTT-API && cd /d C:\Projects\production-gantt\api && npm run dev" -WindowStyle Minimized

Write-Host "Запускаем Frontend сервер (порт 5173)..." -ForegroundColor Green  
Start-Process -FilePath "cmd" -ArgumentList "/k", "title PRODUCTION-GANTT-FRONTEND && cd /d C:\Projects\production-gantt\web && npm run dev" -WindowStyle Minimized

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   СЕРВЕРЫ ЗАПУЩЕНЫ!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""

