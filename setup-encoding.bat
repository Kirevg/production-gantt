@echo off
REM Настройка кодировки для правильной работы с русским текстом
echo Настройка кодировки Git и PowerShell...

REM Настройки Git
echo Применяем настройки Git...
git config --global core.autocrlf false
git config --global core.quotepath false
git config --global i18n.filesencoding utf-8
git config --global i18n.commitencoding utf-8

REM Локальные настройки для проекта
git config core.autocrlf false
git config core.quotepath false
git config i18n.filesencoding utf-8
git config i18n.commitencoding utf-8

REM Настройки PowerShell
echo Настройка PowerShell...
powershell -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8"
chcp 65001

echo.
echo ========================================
echo   НАСТРОЙКИ ПРИМЕНЕНЫ!
echo ========================================
echo.
echo Проверьте настройки командой:
echo git config --global --list ^| findstr -i "autocrlf\|quotepath\|encoding"
echo.
pause
