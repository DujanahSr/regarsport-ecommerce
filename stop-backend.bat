@echo off
echo Menghentikan seluruh proses Java Microservices...
taskkill /F /IM java.exe 2>nul
echo Seluruh service Java telah dihentikan.
