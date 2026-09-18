@echo off
color 0B
echo ====================================================
echo.
echo     Starting StockVault Inventory API Backend...
echo.
echo ====================================================
call .\.venv\Scripts\activate.bat
uvicorn main:app --reload --host 0.0.0.0 --port 8000
