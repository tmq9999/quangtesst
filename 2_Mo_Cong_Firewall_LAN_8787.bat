@echo off
chcp 65001 >nul
title Mo Cong Firewall TCP 8787 Cho iPhone Ket Noi LAN

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Dang yeu cau quyen Administrator de mo cong Windows Firewall 8787...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

netsh advfirewall firewall delete rule name="G1 ACQ PC Dashboard (TCP 8787)" >nul 2>&1
netsh advfirewall firewall add rule name="G1 ACQ PC Dashboard (TCP 8787)" dir=in action=allow protocol=TCP localport=8787 profile=any

echo =====================================================================
echo  [THANH CONG] Da mo cong TCP 8787 tren Windows Firewall!
echo  Bay gio iPhone cung mang Wi-Fi co the ket noi truc tiep voi PC.
echo =====================================================================
pause
