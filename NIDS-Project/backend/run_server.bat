@echo off
setlocal
cd /d "%~dp0"
if not exist "env\Scripts\python.exe" (
  echo Missing venv. From this folder run:  python -m venv env
  echo Then:  env\Scripts\pip install -r requirements.txt
  exit /b 1
)
"env\Scripts\python.exe" -m uvicorn main:app --reload --port 8000
