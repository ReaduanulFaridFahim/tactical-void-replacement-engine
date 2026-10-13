@echo off
title Tactical Replacement Engine CLI Explorer
echo ========================================================
echo  Tactical Void & Drop-In Replacement CLI Explorer
echo ========================================================
python cli_explorer.py
if errorlevel 1 (
    "..\.venv\Scripts\python.exe" cli_explorer.py
)
echo.
set /p player="Enter player name to inspect (or press Enter for Bellingham): "
if "%player%"=="" set player=Bellingham
python cli_explorer.py -p %player%
if errorlevel 1 (
    "..\.venv\Scripts\python.exe" cli_explorer.py -p %player%
)
pause
