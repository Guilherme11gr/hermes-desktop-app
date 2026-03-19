@echo off
chcp 65001 >nul
title Hermes Desktop - Build Local

echo.
echo ========================================
echo     HERMES DESKTOP - Build Local
echo ========================================
echo.

:: Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo OK: Node.js instalado

:: Verificar Rust
echo Verificando Rust...
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Rust nao encontrado!
    echo Instale em: https://rustup.rs/
    echo.
    pause
    exit /b 1
)
echo OK: Rust instalado

:: Instalar dependencias se necessario
if not exist "node_modules" (
    echo Instalando dependencias npm...
    call npm install
    if %errorlevel% neq 0 (
        echo ERRO ao instalar dependencias
        pause
        exit /b 1
    )
)
echo OK: Dependencias prontas

:: Criar .env se nao existir
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo OK: .env criado
    )
)

:: Build
echo.
echo ========================================
echo     BUILD TAURI - AGUARDE...
echo   Primeira vez pode demorar 10+ min
echo ========================================
echo.

call npm run tauri build

if %errorlevel% neq 0 (
    echo.
    echo ERRO no build!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo     BUILD CONCLUIDO!
echo ========================================
echo.
echo Executaveis em:
echo %cd%\src-tauri\target\release\bundle\
echo.

:: Abrir pasta do bundle
explorer "src-tauri\target\release\bundle"

echo.
pause
