@echo off
chcp 65001 >nul
title Hermes Desktop - Dev Mode

echo.
echo ========================================
echo     HERMES DESKTOP - Dev Mode
echo ========================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    pause
    exit /b 1
)

:: Instalar dependencias se necessario
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

:: Criar .env se nao existir
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    )
)

echo.
echo Verificando TypeScript...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo AVISO: Erros de TypeScript detectados!
    echo Continuando mesmo assim...
    echo.
)

echo.
echo Iniciando Vite + Tauri em dev...
echo.

call npm run tauri dev

pause
