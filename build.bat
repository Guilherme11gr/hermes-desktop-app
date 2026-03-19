@echo off
chcp 65001 >nul
title Hermes Desktop - Build

:: ==========================================
:: Hermes Desktop - Script de Build Windows
:: ==========================================

echo.
echo ╔════════════════════════════════════════╗
echo ║     HERMES DESKTOP - Build Windows     ║
echo ╚════════════════════════════════════════╝
echo.

:: Configurações
set BUILD_DIR=%USERPROFILE%\hermes-desktop-build
set WSL_PATH=\\wsl.localhost\Ubuntu\home\guilh\hermes-desktop-app
set WSL_PATH_ALT=\\wsl$\Ubuntu\home\guilh\hermes-desktop-app

:: Verificar Node.js
echo → Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node.js nao encontrado!
    echo Instale em: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo ✓ Node.js %NODE_VER%

:: Verificar Rust
echo → Verificando Rust...
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Rust nao encontrado!
    echo Instale em: https://rustup.rs/
    echo.
    echo Execute no PowerShell:
    echo   winget install Rustlang.Rustup
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('cargo --version') do set RUST_VER=%%i
echo ✓ %RUST_VER%

:: Verificar Visual Studio Build Tools (necessário para Rust no Windows)
echo → Verificando MSVC Build Tools...
where cl.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ MSVC não encontrado no PATH
    echo   Isso pode ser normal se o Rust usar o linker correto
)

:: Detectar pasta do WSL
echo → Detectando arquivos do WSL...
if exist "%WSL_PATH%" (
    set SOURCE_PATH=%WSL_PATH%
    echo ✓ Encontrado: %WSL_PATH%
) else if exist "%WSL_PATH_ALT%" (
    set SOURCE_PATH=%WSL_PATH_ALT%
    echo ✓ Encontrado: %WSL_PATH_ALT%
) else (
    echo ✗ Nao consegui encontrar os arquivos no WSL
    echo.
    echo Opcoes:
    echo   1. Copie manualmente a pasta hermes-desktop-app para:
    echo      %BUILD_DIR%
    echo.
    echo   2. Verifique se o WSL esta rodando:
    echo      wsl -l -v
    echo.
    pause
    exit /b 1
)

:: Criar pasta de build
echo.
echo → Preparando pasta de build...
if not exist "%BUILD_DIR%" (
    mkdir "%BUILD_DIR%"
    echo ✓ Criado: %BUILD_DIR%
) else (
    echo ✓ Pasta existe: %BUILD_DIR%
)

:: Copiar arquivos (exceto node_modules e target)
echo → Copiando arquivos do WSL...
echo   Isso pode demorar um pouco...
xcopy "%SOURCE_PATH%\*" "%BUILD_DIR%\" /E /I /Y /Q /EXCLUDE:%~dp0exclude.txt >nul 2>&1
if %errorlevel% neq 0 (
    :: Se falhar com exclude, copia tudo e remove depois
    xcopy "%SOURCE_PATH%\*" "%BUILD_DIR%\" /E /I /Y /Q >nul 2>&1
)
echo ✓ Arquivos copiados

:: Remover pastas pesadas que nao precisam ser copiadas
if exist "%BUILD_DIR%\node_modules" (
    echo → Limpando node_modules antigo...
    rmdir /s /q "%BUILD_DIR%\node_modules" 2>nul
)
if exist "%BUILD_DIR%\src-tauri\target" (
    echo → Limpando target antigo...
    rmdir /s /q "%BUILD_DIR%\src-tauri\target" 2>nul
)

:: Navegar para pasta de build
cd /d "%BUILD_DIR%"

:: Criar .env se nao existir
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo ✓ .env criado
    )
)

:: Instalar dependencias
echo.
echo → Instalando dependencias npm...
call npm install --silent
if %errorlevel% neq 0 (
    echo ✗ Erro ao instalar dependencias
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

:: Build do frontend
echo.
echo → Compilando frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ✗ Erro no build do frontend
    pause
    exit /b 1
)
echo ✓ Frontend compilado

:: Build do Tauri
echo.
echo ╔════════════════════════════════════════╗
echo ║     BUILD TAURI - AGUARDE...           ║
echo ║   Primeira vez pode demorar 10+ min    ║
echo ╚════════════════════════════════════════╝
echo.

call npm run tauri build
if %errorlevel% neq 0 (
    echo ✗ Erro no build do Tauri
    pause
    exit /b 1
)

:: Sucesso!
echo.
echo ╔════════════════════════════════════════╗
echo ║        BUILD CONCLUÍDO! 🎉             ║
echo ╚════════════════════════════════════════╝
echo.
echo Executáveis gerados em:
echo   %BUILD_DIR%\src-tauri\target\release\bundle\
echo.
echo Procurar por:
echo   • .msi  (instalador)
echo   • .exe  (executável portátil)
echo.

:: Abrir pasta do bundle
explorer "%BUILD_DIR%\src-tauri\target\release\bundle"

echo.
echo Pressione qualquer tecla para sair...
pause >nul
