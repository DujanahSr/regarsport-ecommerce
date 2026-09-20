@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Menjalankan 6 Microservices RegarStore...
echo ===================================================

if exist .env (
    for /f "usebackq tokens=1* delims==" %%A in (".env") do (
        set "%%A=%%B"
    )
)

echo [1/6] Menjalankan Auth Service (8086)...
start "Auth Service - Port 8086" java -XX:CICompilerCount=2 -Xss256k -Xms32m -Xmx192m -jar backend\auth-service\target\auth-service-1.0.0-SNAPSHOT.jar

timeout /t 3 /nobreak >nul

echo [2/6] Menjalankan Catalog Service (8087)...
start "Catalog Service - Port 8087" java -XX:CICompilerCount=2 -Xss256k -Xms32m -Xmx192m -jar backend\catalog-service\target\catalog-service-1.0.0-SNAPSHOT.jar

timeout /t 3 /nobreak >nul

echo [3/6] Menjalankan Order Service (8088)...
start "Order Service - Port 8088" java -XX:CICompilerCount=2 -Xss256k -Xms32m -Xmx192m -jar backend\order-service\target\order-service-1.0.0-SNAPSHOT.jar

timeout /t 3 /nobreak >nul

echo [4/6] Menjalankan Payment Service (8089)...
start "Payment Service - Port 8089" java -XX:CICompilerCount=2 -Xss256k -Xms32m -Xmx192m -DMIDTRANS_SERVER_KEY=!MIDTRANS_SERVER_KEY! -DMIDTRANS_CLIENT_KEY=!MIDTRANS_CLIENT_KEY! -jar backend\payment-service\target\payment-service-1.0.0-SNAPSHOT.jar

timeout /t 3 /nobreak >nul

echo [5/6] Menjalankan Notification Service (8090)...
start "Notification Service - Port 8090" java -XX:CICompilerCount=2 -Xss256k -Xms32m -Xmx192m -jar backend\notification-service\target\notification-service-1.0.0-SNAPSHOT.jar

timeout /t 3 /nobreak >nul

echo [6/6] Menjalankan API Gateway (8080)...
start "API Gateway - Port 8080" java -XX:CICompilerCount=2 -Xss256k -Xms32m -Xmx192m -jar backend\api-gateway\target\api-gateway-1.0.0-SNAPSHOT.jar

echo ===================================================
echo   Semua 6 Microservices berhasil dijalankan!
echo ===================================================
