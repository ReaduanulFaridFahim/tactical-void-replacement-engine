@echo off
setlocal enabledelayedexpansion
title Tactical Void Dashboard Launcher
echo ======================================================================
echo   ⚡ STARTING TACTICAL VOID & DROP-IN REPLACEMENT ENGINE (LIVE ML)
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
    echo [ERROR] Python not found in PATH or virtualenv!
    pause
    exit /b 1
)

%PY_CMD% serve_engine.py
pause
