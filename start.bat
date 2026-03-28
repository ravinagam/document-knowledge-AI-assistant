@echo off
echo ================================================
echo  Document Knowledge Assistant - Setup
echo ================================================
echo.

:: Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop is not running.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo [OK] Docker is running.

:: Check Ollama
where ollama >nul 2>&1
if errorlevel 1 (
    echo [SETUP] Ollama not found. Downloading installer...
    curl -L https://ollama.com/download/OllamaSetup.exe -o "%TEMP%\OllamaSetup.exe"
    echo [SETUP] Installing Ollama. Follow the installer then re-run this script.
    start /wait "%TEMP%\OllamaSetup.exe"
    timeout /t 5 >nul
)
echo [OK] Ollama is installed.

:: Pull model if not already present
ollama list 2>nul | findstr /C:"llama3.2:1b" >nul
if errorlevel 1 (
    echo [SETUP] Downloading llama3.2:1b model. This is a one-time 1.3 GB download...
    ollama pull llama3.2:1b
) else (
    echo [OK] llama3.2:1b model already present.
)

:: Start app
echo.
echo [START] Starting backend and frontend...
docker compose up --build -d

echo.
echo ================================================
echo  App ready:  http://localhost:3001
echo  API docs:   http://localhost:8000/docs
echo ================================================
echo.
echo To stop:      docker compose down
echo To view logs: docker compose logs -f
echo.
pause
