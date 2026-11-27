@echo off
chcp 65001 >nul
title G1 ACQ PC Control Center - Server Dieu Khien SKU iPhone
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo =====================================================================
  echo  [LOI] May tinh nay chua cai dat Node.js!
  echo  Vui long tai va cai dat ban Node.js LTS tai: https://nodejs.org
  echo  Cai xong hay bam dup lai file 1_Chay_Dashboard_PC.bat nay.
  echo =====================================================================
  pause
  exit /b 1
)

echo Dang khoi dong G1 ACQ PC Control Center tren cong 8787...
start "" cmd /c "timeout /t 2 >nul && start http://localhost:8787"
node pc-server.cjs
pause
