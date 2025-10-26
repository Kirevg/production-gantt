# ========================================
#   ПЕРЕЗАПУСК СЕРВЕРОВ PRODUCTION GANTT
#   Версия: 2.0 (улучшенная)
# ========================================

Write-Host "?? Останавливаем все серверы..." -ForegroundColor Yellow

# Проверяем права администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "??  ВНИМАНИЕ: Скрипт запущен БЕЗ прав администратора!" -ForegroundColor Red
    Write-Host "   Некоторые процессы могут не закрыться." -ForegroundColor Yellow
    Write-Host "   Рекомендуется запустить PowerShell от имени администратора." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "?? Попытка перезапуска с правами администратора..." -ForegroundColor Cyan
    
    # Пытаемся перезапустить скрипт с правами администратора
    try {
        Start-Process PowerShell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
        exit
    } catch {
        Write-Host "? Не удалось перезапустить с правами администратора" -ForegroundColor Red
        Write-Host "   Продолжаем выполнение без прав администратора..." -ForegroundColor Yellow
    }
} else {
    Write-Host "? Скрипт запущен с правами администратора" -ForegroundColor Green
}

# СНАЧАЛА закрываем все cmd окна, связанные с проектом
Write-Host "?? Закрываем cmd окна проекта..." -ForegroundColor Yellow

# Находим ВСЕ cmd процессы
$allCmdProcesses = Get-Process -Name "cmd" -ErrorAction SilentlyContinue
Write-Host "   Найдено cmd процессов: $($allCmdProcesses.Count)" -ForegroundColor Gray

# Показываем все cmd процессы для диагностики
$allCmdProcesses | ForEach-Object {
    Write-Host "   Cmd процесс: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor DarkGray
}

# Закрываем cmd процессы, связанные с проектом
$cmdProcesses = $allCmdProcesses | Where-Object {
    $_.MainWindowTitle -match "PRODUCTION-GANTT-API|PRODUCTION-GANTT-FRONTEND|production-gantt|localhost:4000|localhost:5173|npm|node|Backend Server|Frontend Server|Администратор.*cmd"
}

if ($cmdProcesses.Count -gt 0) {
    Write-Host "   Найдено связанных с проектом: $($cmdProcesses.Count)" -ForegroundColor Gray
    $cmdProcesses | ForEach-Object {
        Write-Host "   Закрываем cmd: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor Gray
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            Write-Host "   ? Закрыт: '$($_.MainWindowTitle)'" -ForegroundColor Green
        } catch {
            Write-Host "   ? Не удалось закрыть: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ? Cmd окна проекта не найдены" -ForegroundColor Green
}

# Дополнительно закрываем ВСЕ cmd окна, которые могут быть связаны с npm
Write-Host "?? Дополнительно закрываем cmd с npm..." -ForegroundColor Yellow
$npmCmdProcesses = $allCmdProcesses | Where-Object {
    $_.MainWindowTitle -match "PRODUCTION-GANTT-API|PRODUCTION-GANTT-FRONTEND|npm|node|Администратор.*cmd"
}

if ($npmCmdProcesses.Count -gt 0) {
    Write-Host "   Найдено cmd с npm: $($npmCmdProcesses.Count)" -ForegroundColor Gray
    $npmCmdProcesses | ForEach-Object {
        Write-Host "   Закрываем npm cmd: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor Gray
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            Write-Host "   ? Закрыт npm cmd: '$($_.MainWindowTitle)'" -ForegroundColor Green
        } catch {
            Write-Host "   ? Не удалось закрыть npm cmd: '$($_.MainWindowTitle)'" -ForegroundColor Red
        }
    }
}

# Принудительно закрываем ВСЕ cmd процессы с пустыми заголовками (вероятно старые серверы)
Write-Host "?? Принудительно закрываем cmd с пустыми заголовками..." -ForegroundColor Yellow
$emptyCmdProcesses = $allCmdProcesses | Where-Object {
    $_.MainWindowTitle -eq "" -and $_.Id -ne $PID
}

if ($emptyCmdProcesses.Count -gt 0) {
    Write-Host "   Найдено cmd с пустыми заголовками: $($emptyCmdProcesses.Count)" -ForegroundColor Gray
    $emptyCmdProcesses | ForEach-Object {
        Write-Host "   Закрываем пустой cmd: (PID: $($_.Id))" -ForegroundColor Gray
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            Write-Host "   ? Закрыт пустой cmd: (PID: $($_.Id))" -ForegroundColor Green
        } catch {
            Write-Host "   ? Не удалось закрыть пустой cmd: (PID: $($_.Id))" -ForegroundColor Red
        }
    }
}

# Закрываем окна с заголовками "Backend Server" и "Frontend Server"
# НЕ трогаем окна с "Git Auto-Commit"
Write-Host "?? Закрываем окна серверов..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.MainWindowTitle -match "Backend Server|Frontend Server|npm run dev|node.*production-gantt|localhost:4000|localhost:5173" -and 
    $_.MainWindowTitle -notmatch "Git Auto-Commit"
} | ForEach-Object {
    Write-Host "   Закрываем окно: $($_.MainWindowTitle)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# ПОТОМ останавливаем все процессы Node.js
Write-Host "?? Останавливаем процессы Node.js..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Закрываем процессы cmd с npm
Write-Host "?? Закрываем процессы npm..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.ProcessName -eq "cmd" -and 
    $_.CommandLine -match "npm run dev"
} | ForEach-Object {
    Write-Host "   Закрываем npm процесс: $($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Ждем 2 секунды
Start-Sleep -Seconds 2

# Функция для проверки и закрытия дублирующих процессов
function Close-DuplicateProcesses {
    param($ProcessName, $CommandPattern)
    
    $processes = Get-Process | Where-Object {
        $_.ProcessName -eq $ProcessName -and 
        $_.CommandLine -match $CommandPattern
    }
    
    if ($processes.Count -gt 1) {
        Write-Host "?? Найдено $($processes.Count) дублирующих процессов $ProcessName" -ForegroundColor Yellow
        $processes | ForEach-Object {
            Write-Host "   Закрываем дублирующий процесс: $($_.Id)" -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

# Закрываем дублирующие процессы
Close-DuplicateProcesses "cmd" "npm run dev"
Close-DuplicateProcesses "node" "production-gantt"


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
Start-Process -FilePath "cmd" -ArgumentList "/k", "title PRODUCTION-GANTT-API && cd /d C:\Projects\production-gantt\api && npm run dev" -WindowStyle Minimized

Write-Host "?? Запускаем Frontend сервер..." -ForegroundColor Green  
Start-Process -FilePath "cmd" -ArgumentList "/k", "title PRODUCTION-GANTT-FRONTEND && cd /d C:\Projects\production-gantt\web && npm run dev" -WindowStyle Minimized

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ? СЕРВЕРЫ ЗАПУЩЕНЫ!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""