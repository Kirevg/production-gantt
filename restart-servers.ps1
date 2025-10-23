# ========================================
#   ���������� �������� PRODUCTION GANTT
# ========================================

# ��������� ��� �������� Node.js � CMD
Write-Host "��������� ������ ��������..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null
taskkill /f /im cmd.exe 2>$null

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
