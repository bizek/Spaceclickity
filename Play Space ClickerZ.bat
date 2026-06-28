@echo off
cd /d "%~dp0"
title Space ClickerZ
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org then run this again.
  pause
  exit /b 1
)
if not exist node_modules\ (
  echo First-time setup: installing dependencies. This may take a minute...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency install failed. See the messages above.
    pause
    exit /b 1
  )
)
echo.
echo ============================================
echo   Space ClickerZ is starting...
echo   A browser tab will open automatically.
echo.
echo   Keep THIS window open while you play.
echo   Close it ^(or press Ctrl+C^) to stop the game.
echo ============================================
echo.
call npm run dev -- --open
echo.
echo Server stopped.
pause
