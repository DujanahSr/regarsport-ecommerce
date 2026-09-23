@echo off
title Cloudflare Tunnel - RegarStore Gateway (Port 8080)
echo ======================================================================
echo   CLOUDFLARE TUNNEL - REGARSTORE PUBLIC ENTRYPOINT (PORT 8080)
echo ======================================================================
echo.
echo Menghubungkan API Gateway (localhost:8080) ke Internet Global...
echo.
echo URL publik HTTPS gratis Anda akan muncul di dalam kotak di bawah ini.
echo Salin URL tersebut dan pasang di Vercel (VITE_API_BASE_URL).
echo.
echo Tekan Ctrl + C jika ingin menutup tunnel ini.
echo ======================================================================
echo.

"%~dp0tools\cloudflared.exe" tunnel --url http://localhost:8080
pause
