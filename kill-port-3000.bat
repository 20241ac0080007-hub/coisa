@echo off
REM Script para matar processos na porta 3000 do Windows
REM Use este script se o servidor ficar preso na porta 3000

echo.
echo 🔍 Procurando processos na porta 3000...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo ⏹️  Encontrado processo PID: %%a
    echo 🛑 Encerrando...
    taskkill /PID %%a /F
)

echo.
echo ✅ Feito! A porta 3000 está livre.
echo.
pause
