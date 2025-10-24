# ========================================
#   ���������� �������� PRODUCTION GANTT
#   ������: 2.0 (����������)
# ========================================

Write-Host "?? ������������� ��� �������..." -ForegroundColor Yellow

# ������������� ��� �������� Node.js
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# ��������� ���� � ����������� "Backend Server" � "Frontend Server"
# �� ������� ���� � "Git Auto-Commit"
Get-Process | Where-Object {
    $_.MainWindowTitle -match "Backend Server|Frontend Server" -and 
    $_.MainWindowTitle -notmatch "Git Auto-Commit"
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# ���� 2 �������
Start-Sleep -Seconds 2

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
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\api && npm run dev" -WindowStyle Normal

Write-Host "?? ��������� Frontend ������..." -ForegroundColor Green  
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\web && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ? ������� ��������!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""