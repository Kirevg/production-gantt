# PowerShell скрипт для перезапуска серверов Production Gantt
# Автоматически настраивает политику выполнения для текущего пользователя

# Настройка политики выполнения (если нужно)
try {
    $currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
    if ($currentPolicy -eq "Restricted") {
        Write-Host "Настраиваем политику выполнения..." -ForegroundColor Yellow
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    }
} catch {
    Write-Host "Политика выполнения уже настроена" -ForegroundColor Green
}

Write-Host "Перезапуск серверов Production Gantt..." -ForegroundColor Green

# Останавливаем Node.js
Write-Host "Останавливаем Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Ждем
Start-Sleep -Seconds 2

# Запускаем API
Write-Host "Запускаем API..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k", "cd /d C:\Projects\production-gantt\api && npm run dev"

# Запускаем Frontend  
Write-Host "Запускаем Frontend..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k", "cd /d C:\Projects\production-gantt\web && npm run dev"

Write-Host "Готово! Серверы запущены!" -ForegroundColor Green
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
