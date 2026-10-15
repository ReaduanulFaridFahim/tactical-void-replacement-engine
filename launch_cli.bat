@echo off
setlocal enabledelayedexpansion
title Tactical Replacement Engine CLI Explorer
echo ======================================================================
echo   ⚡ TACTICAL VOID & DROP-IN REPLACEMENT CLI EXPLORER (2026/27)
echo ======================================================================

set "PY_CMD="
if exist "..\.venv\Scripts\python.exe" (
    set "PY_CMD=..\.venv\Scripts\python.exe"
) else if exist ".\.venv\Scripts\python.exe" (
    set "PY_CMD=.\.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if !errorlevel! equ 0 set "PY_CMD=python"
)

if "%PY_CMD%"=="" (
    echo [ERROR] Python environment not found! Please check .venv.
    pause
    exit /b 1
)

%PY_CMD% cli_explorer.py --list
echo.
set /p query="Enter player or coach name to inspect (or press Enter for Klopp): "
if "%query%"=="" set query=Klopp
echo.
%PY_CMD% cli_explorer.py -q "%query%"
echo.
pause
