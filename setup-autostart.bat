@echo off
echo Setting up auto-start for Production Gantt System...

REM Создаем задачу в планировщике Windows
schtasks /create /tn "Production Gantt System" /tr "C:\Projects\production-gantt\start-system.bat" /sc onstart /ru "SYSTEM" /f

echo Auto-start task created successfully!
echo The system will start automatically when Windows boots.
echo.
echo To remove auto-start, run: schtasks /delete /tn "Production Gantt System" /f
echo.
pause