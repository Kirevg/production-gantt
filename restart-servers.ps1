# ========================================
#   ���������� �������� PRODUCTION GANTT
# ========================================

Write-Host "������������� ������ ��������..." -ForegroundColor Yellow

# ������������� ��� �������� Node.js
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# ������� � ��������� ���� � ����������� "Backend Server" � "Frontend Server"
# �� ������� ���� � "Git Auto-Commit"
Get-Process | Where-Object {
    $_.MainWindowTitle -match "Backend Server|Frontend Server" -and 
    $_.MainWindowTitle -notmatch "Git Auto-Commit"
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# ����� 2 �������
Start-Sleep -Seconds 2

Write-Host "��������� API ������..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\api && npm run dev" -WindowStyle Normal

Write-Host "��������� Frontend ������..." -ForegroundColor Green  
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Projects\production-gantt\web && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ������� ��������!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Pause
