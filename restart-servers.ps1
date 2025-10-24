# ========================================
#   ПЕРЕЗАПУСК СЕРВЕРОВ PRODUCTION GANTT
#   Версия: 2.0 (улучшенная)
# ========================================

Write-Host "?? Останавливаем все серверы..." -ForegroundColor Yellow

# Останавливаем все процессы Node.js
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Закрываем окна с заголовками "Backend Server" и "Frontend Server"
# НЕ трогаем окна с "Git Auto-Commit"
Get-Process | Where-Object {
    $_.MainWindowTitle -match "Backend Server|Frontend Server" -and 
    $_.MainWindowTitle -notmatch "Git Auto-Commit"
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Ждем 2 секунды
Start-Sleep -Seconds 2

# Проверяем доступность портов
Write-Host "?? Проверяем доступность портов..." -ForegroundColor Cyan
$apiPort = 4000
$frontendPort = 5173

# Функция проверки порта
function Test-Port {
    param($Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        # Тестовое изменение для снапшота
        return $false
    }
}

if (Test-Port $apiPort) {
    Write-Host "??  Порт $apiPort уже занят!" -ForegroundColor Red
} else {
    Write-Host "? Порт $apiPort свободен" -ForegroundColor Green
}

if (Test-Port $frontendPort) {
    Write-Host "??  Порт $frontendPort уже занят!" -ForegroundColor Red
} else {
    Write-Host "? Порт $frontendPort свободен" -ForegroundColor Green
}

Write-Host "?? Запускаем API сервер..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\api && npm run dev" -WindowStyle Normal

Write-Host "?? Запускаем Frontend сервер..." -ForegroundColor Green  
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\web && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ? СЕРВЕРЫ ЗАПУЩЕНЫ!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""