# ========================================
#   ���������� �������� PRODUCTION GANTT
#   ������: 2.0 (����������)
# ========================================

Write-Host "?? ������������� ��� �������..." -ForegroundColor Yellow

# ��������� ����� ��������������
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "??  ��������: ������ ������� ��� ���� ��������������!" -ForegroundColor Red
    Write-Host "   ��������� �������� ����� �� ���������." -ForegroundColor Yellow
    Write-Host "   ������������� ��������� PowerShell �� ����� ��������������." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "?? ������� ����������� � ������� ��������������..." -ForegroundColor Cyan
    
    # �������� ������������� ������ � ������� ��������������
    try {
        Start-Process PowerShell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
        exit
    } catch {
        Write-Host "? �� ������� ������������� � ������� ��������������" -ForegroundColor Red
        Write-Host "   ���������� ���������� ��� ���� ��������������..." -ForegroundColor Yellow
    }
} else {
    Write-Host "? ������ ������� � ������� ��������������" -ForegroundColor Green
}

# ������� ��������� ��� cmd ����, ��������� � ��������
Write-Host "?? ��������� cmd ���� �������..." -ForegroundColor Yellow

# ������� ��� cmd ��������
$allCmdProcesses = Get-Process -Name "cmd" -ErrorAction SilentlyContinue
Write-Host "   ������� cmd ���������: $($allCmdProcesses.Count)" -ForegroundColor Gray

# ���������� ��� cmd �������� ��� �����������
$allCmdProcesses | ForEach-Object {
    Write-Host "   Cmd �������: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor DarkGray
}

# ��������� cmd ��������, ��������� � ��������
$cmdProcesses = $allCmdProcesses | Where-Object {
    $_.MainWindowTitle -match "PRODUCTION-GANTT-API|PRODUCTION-GANTT-FRONTEND|production-gantt|localhost:4000|localhost:5173|npm|node|Backend Server|Frontend Server|�������������.*cmd"
}

if ($cmdProcesses.Count -gt 0) {
    Write-Host "   ������� ��������� � ��������: $($cmdProcesses.Count)" -ForegroundColor Gray
    $cmdProcesses | ForEach-Object {
        Write-Host "   ��������� cmd: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor Gray
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            Write-Host "   ? ������: '$($_.MainWindowTitle)'" -ForegroundColor Green
        } catch {
            Write-Host "   ? �� ������� �������: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ? Cmd ���� ������� �� �������" -ForegroundColor Green
}

# ������������� ��������� ��� cmd ����, ������� ����� ���� ������� � npm
Write-Host "?? ������������� ��������� cmd � npm..." -ForegroundColor Yellow
$npmCmdProcesses = $allCmdProcesses | Where-Object {
    $_.MainWindowTitle -match "PRODUCTION-GANTT-API|PRODUCTION-GANTT-FRONTEND|npm|node|�������������.*cmd"
}

if ($npmCmdProcesses.Count -gt 0) {
    Write-Host "   ������� cmd � npm: $($npmCmdProcesses.Count)" -ForegroundColor Gray
    $npmCmdProcesses | ForEach-Object {
        Write-Host "   ��������� npm cmd: '$($_.MainWindowTitle)' (PID: $($_.Id))" -ForegroundColor Gray
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            Write-Host "   ? ������ npm cmd: '$($_.MainWindowTitle)'" -ForegroundColor Green
        } catch {
            Write-Host "   ? �� ������� ������� npm cmd: '$($_.MainWindowTitle)'" -ForegroundColor Red
        }
    }
}

# ������������� ��������� ��� cmd �������� � ������� ����������� (�������� ������ �������)
Write-Host "?? ������������� ��������� cmd � ������� �����������..." -ForegroundColor Yellow
$emptyCmdProcesses = $allCmdProcesses | Where-Object {
    $_.MainWindowTitle -eq "" -and $_.Id -ne $PID
}

if ($emptyCmdProcesses.Count -gt 0) {
    Write-Host "   ������� cmd � ������� �����������: $($emptyCmdProcesses.Count)" -ForegroundColor Gray
    $emptyCmdProcesses | ForEach-Object {
        Write-Host "   ��������� ������ cmd: (PID: $($_.Id))" -ForegroundColor Gray
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            Write-Host "   ? ������ ������ cmd: (PID: $($_.Id))" -ForegroundColor Green
        } catch {
            Write-Host "   ? �� ������� ������� ������ cmd: (PID: $($_.Id))" -ForegroundColor Red
        }
    }
}

# ��������� ���� � ����������� "Backend Server" � "Frontend Server"
# �� ������� ���� � "Git Auto-Commit"
Write-Host "?? ��������� ���� ��������..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.MainWindowTitle -match "Backend Server|Frontend Server|npm run dev|node.*production-gantt|localhost:4000|localhost:5173" -and 
    $_.MainWindowTitle -notmatch "Git Auto-Commit"
} | ForEach-Object {
    Write-Host "   ��������� ����: $($_.MainWindowTitle)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# ����� ������������� ��� �������� Node.js
Write-Host "?? ������������� �������� Node.js..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# ��������� �������� cmd � npm
Write-Host "?? ��������� �������� npm..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.ProcessName -eq "cmd" -and 
    $_.CommandLine -match "npm run dev"
} | ForEach-Object {
    Write-Host "   ��������� npm �������: $($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# ���� 2 �������
Start-Sleep -Seconds 2

# ������� ��� �������� � �������� ����������� ���������
function Close-DuplicateProcesses {
    param($ProcessName, $CommandPattern)
    
    $processes = Get-Process | Where-Object {
        $_.ProcessName -eq $ProcessName -and 
        $_.CommandLine -match $CommandPattern
    }
    
    if ($processes.Count -gt 1) {
        Write-Host "?? ������� $($processes.Count) ����������� ��������� $ProcessName" -ForegroundColor Yellow
        $processes | ForEach-Object {
            Write-Host "   ��������� ����������� �������: $($_.Id)" -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

# ��������� ����������� ��������
Close-DuplicateProcesses "cmd" "npm run dev"
Close-DuplicateProcesses "node" "production-gantt"


# ��������� ����������� ������
Write-Host "?? ��������� ����������� ������..." -ForegroundColor Cyan
$apiPort = 4000
$frontendPort = 5173

# ������� �������� �����
function Test-Port {
    param($Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        # �������� ��������� ��� ��������
        return $false
    }
}

if (Test-Port $apiPort) {
    Write-Host "??  ���� $apiPort ��� �����!" -ForegroundColor Red
} else {
    Write-Host "? ���� $apiPort ��������" -ForegroundColor Green
}

if (Test-Port $frontendPort) {
    Write-Host "??  ���� $frontendPort ��� �����!" -ForegroundColor Red
} else {
    Write-Host "? ���� $frontendPort ��������" -ForegroundColor Green
}

Write-Host "?? ��������� API ������..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "title PRODUCTION-GANTT-API && cd /d C:\Projects\production-gantt\api && npm run dev" -WindowStyle Minimized

Write-Host "?? ��������� Frontend ������..." -ForegroundColor Green  
Start-Process -FilePath "cmd" -ArgumentList "/k", "title PRODUCTION-GANTT-FRONTEND && cd /d C:\Projects\production-gantt\web && npm run dev" -WindowStyle Minimized

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ? ������� ��������!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""