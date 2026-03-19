@echo off
chcp 65001 >nul
title Hermes Desktop - Start

:: ==========================================
:: Hermes Desktop - Script de Inicio Rapido
:: ==========================================

echo.
echo ╔════════════════════════════════════════╗
echo ║     HERMES DESKTOP - Start Script      ║
echo ╚════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo → Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node.js nao encontrado!
    echo Instale em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js instalado

:: Verificar Rust
echo → Verificando Rust...
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ Rust nao encontrado!
    echo Instalando Rust...
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o rustup-init.exe
    rustup-init.exe -y
    del rustup-init.exe
    refreshenv
)
echo ✓ Rust instalado

:: Verificar Hermes
echo → Verificando Hermes Agent...
hermes --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Hermes nao encontrado!
    echo Instale com: pip install hermes-agent
    pause
    exit /b 1
)
echo ✓ Hermes instalado

:: Verificar Gateway
echo → Verificando Hermes Gateway...
curl -s http://localhost:8642/health | findstr "status" >nul
if %errorlevel% neq 0 (
    echo ⚠ Hermes Gateway OFFLINE
    echo.
    echo Para iniciar, abra outro terminal e execute:
    echo   hermes gateway
    echo.
    echo Ou configure ~/.hermes/.env:
    echo   API_SERVER_ENABLED=true
    echo.
    choice /C SN /N /M "Deseja continuar mesmo assim? (S/N)"
    if %errorlevel% neq 1 exit /b 1
)

:: Instalar dependencias
echo.
echo → Preparando ambiente...
if not exist "node_modules" (
    npm install
    echo ✓ Dependencias instaladas
) else (
    echo ✓ Dependencias ja instaladas
)

:: Criar .env se nao existir
if not exist ".env" (
    copy .env.example .env >nul
    echo ✓ .env criado
)

echo.
echo ✓ Tudo pronto! Iniciando Hermes Desktop...
echo.
echo Aguarde, a primeira compilacao pode demorar alguns minutos...
echo.

:: Iniciar
npm run tauri dev

pause
