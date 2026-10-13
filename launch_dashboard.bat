@echo off
title Tactical Void Dashboard Launcher
echo ========================================================
echo  Starting Tactical Void & Drop-In Replacement Engine...
echo ========================================================
python serve_engine.py
if errorlevel 1 (
    echo Python not found in PATH, trying workspace virtualenv...
    "..\.venv\Scripts\python.exe" serve_engine.py
)
pause
