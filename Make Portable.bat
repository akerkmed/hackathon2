@echo off
setlocal
title M3ak - make portable Windows bundle
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\package-windows.ps1" %*
echo.
pause
