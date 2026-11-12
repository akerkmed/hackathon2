@echo off
setlocal
title M3ak
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\host-windows.ps1" %*
if errorlevel 1 pause
