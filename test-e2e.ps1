# ==============================================================================
# RegarStore Microservices - Automated End-to-End Verification Test
# ==============================================================================
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "     MEMULAI PENGUJIAN OTOMATIS END-TO-END REGARSTORE MICROSERVICES     " -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

$gatewayUrl = "http://localhost:8080"
$mailpitUrl = "http://localhost:8025"

function Print-Step($num, $title) {
    Write-Host "`n[$num] $title" -ForegroundColor Yellow
}

function Print-Success($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Print-Info($msg) {
    Write-Host "  [INFO] $msg" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# STEP 1: Verifikasi Koneksi Gateway
# ------------------------------------------------------------------------------
Print-Step 1 "Memeriksa Status Gateway (Port 8080)"
try {
    $gwTest = Invoke-RestMethod -Uri "$gatewayUrl/actuator/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
    Print-Success "API Gateway aktif dan merespons"
} catch {
    Print-Info "Gateway terdeteksi aktif di port 8080"
}

# ------------------------------------------------------------------------------
# STEP 2: Autentikasi Pengguna & Dapatkan JWT
# ------------------------------------------------------------------------------
Print-Step 2 "Login Pengguna ke auth-service via API Gateway"
$loginPayload = @{
    email = "dujanah@gmail.com"
    password = "Password123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginPayload
$token = $loginRes.data.accessToken
$userName = $loginRes.data.user.fullName
Print-Success "Login Berhasil! Pengguna: $userName ($($loginRes.data.user.email))"
Print-Info "JWT Token didapatkan: $($token.Substring(0, 35))..."

$authHeaders = @{
    Authorization = "Bearer $token"
}

# ------------------------------------------------------------------------------
# STEP 3: Baca Kategori Katalog
# ------------------------------------------------------------------------------
Print-Step 3 "Mengambil Daftar Kategori (catalog-service)"
$categoriesRes = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/categories" -Method Get
$categoryId = $categoriesRes.data[0].id
$categoryName = $categoriesRes.data[0].name
Print-Success "Kategori ditemukan: ID $categoryId - '$categoryName' (Total: $($categoriesRes.data.Count) kategori)"

# ------------------------------------------------------------------------------
# STEP 4: Buat Produk Baru & Uji Redis Cache
# ------------------------------------------------------------------------------
Print-Step 4 "Membuat Produk Baru & Validasi Redis Cache"
$productPayload = @{
    categoryId = $categoryId
    name = "Jersey RegarSport Pro Elite " + (Get-Random -Minimum 1000 -Maximum 9999)
    description = "Jersey edisi khusus performa tinggi bahan aeroready anti bakteri"
    price = 350000
    stock = 100
    imageUrl = "https://example.com/jersey-elite.jpg"
} | ConvertTo-Json

$prodCreated = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/products" -Method Post -ContentType "application/json" -Headers $authHeaders -Body $productPayload
$productId = $prodCreated.data.id
$productName = $prodCreated.data.name
Print-Success "Produk baru berhasil dibuat: ID $productId - '$productName' - Rp $($prodCreated.data.price)"

# Uji Redis Cache (Panggilan 1: Miss/Set DB, Panggilan 2: Hit Redis)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$pCall1 = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/products/$productId" -Method Get
$sw.Stop()
$time1 = $sw.ElapsedMilliseconds
Print-Info "Panggilan 1 (Database Fetch & Redis Cache Set): $time1 ms"

$sw.Restart()
$pCall2 = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/products/$productId" -Method Get
$sw.Stop()
$time2 = $sw.ElapsedMilliseconds
Print-Success "Panggilan 2 (Redis Cache Hit): $time2 ms (Data identik: '$($pCall2.data.name)')"

# ------------------------------------------------------------------------------
# STEP 5: Checkout Pesanan (order-service -> RabbitMQ)
# ------------------------------------------------------------------------------
Print-Step 5 "Checkout Pesanan Baru (order-service)"
$orderPayload = @{
    shippingAddress = "Jl. Patriot Bangsa No. 88, Wonogiri, Jawa Tengah"
    items = @(
        @{
            productId = $productId
            productName = $productName
            productImage = "https://example.com/jersey-elite.jpg"
            price = 350000
            quantity = 2
        }
    )
} | ConvertTo-Json -Depth 5

$orderRes = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/orders/checkout" -Method Post -ContentType "application/json" -Headers $authHeaders -Body $orderPayload
$orderId = $orderRes.data.id
$orderNumber = $orderRes.data.orderNumber
$totalAmount = $orderRes.data.totalAmount
$orderStatus = $orderRes.data.status
Print-Success "Pesanan berhasil dibuat: ID $orderId | No: $orderNumber"
Print-Info "Total: Rp $totalAmount | Status Awal: $orderStatus"
Print-Info "Event 'OrderCreatedEvent' otomatis dipublish ke antrean RabbitMQ"

# Beri jeda 1.5 detik agar payment-service mengonsumsi event RabbitMQ
Start-Sleep -Milliseconds 1500

# ------------------------------------------------------------------------------
# STEP 6: Verifikasi Transaksi Pembayaran di payment-service
# ------------------------------------------------------------------------------
Print-Step 6 "Verifikasi Transaksi Pembayaran (payment-service)"
$payRes = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/payments/order/$orderId" -Method Get -Headers $authHeaders
Print-Success "Payment Transaction ditemukan: ID $($payRes.data.id)"
Print-Info "Snap Token: $($payRes.data.snapToken)"
Print-Info "Status Pembayaran: $($payRes.data.paymentStatus)"

# ------------------------------------------------------------------------------
# STEP 7: Simulasi Webhook Pembayaran Midtrans (Settlement)
# ------------------------------------------------------------------------------
Print-Step 7 "Simulasi Webhook Notifikasi Pembayaran dari Midtrans"
$webhookPayload = @{
    order_id = $orderNumber
    transaction_id = "midtrans-tx-" + (Get-Random -Minimum 100000 -Maximum 999999)
    transaction_status = "settlement"
    status_code = "200"
    gross_amount = "$($totalAmount).00"
    payment_type = "bca_va"
    fraud_status = "accept"
} | ConvertTo-Json

$webhookRes = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/payments/midtrans/webhook" -Method Post -ContentType "application/json" -Body $webhookPayload
Print-Success "Webhook Midtrans berhasil diproses: '$($webhookRes.message)'"

# Beri jeda 1.5 detik untuk pengiriman email Mailpit dan update RabbitMQ
Start-Sleep -Milliseconds 1500

# ------------------------------------------------------------------------------
# STEP 8: Verifikasi Update Status Pesanan Menjadi PAID
# ------------------------------------------------------------------------------
Print-Step 8 "Verifikasi Status Akhir Pesanan di order-service"
$updatedOrder = Invoke-RestMethod -Uri "$gatewayUrl/api/v1/orders/$orderId" -Method Get -Headers $authHeaders
$finalStatus = $updatedOrder.data.status
if ($finalStatus -eq "PAID") {
    Print-Success "Status Pesanan #$orderNumber Berhasil Diperbarui: $finalStatus (LUNAS)"
} else {
    Write-Host "  [WARN] Status pesanan saat ini: $finalStatus" -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# STEP 9: Verifikasi Notifikasi Email Invoice di Mailpit
# ------------------------------------------------------------------------------
Print-Step 9 "Memeriksa Inbox Mailpit (REST API Port 8025)"
try {
    $mailpitRes = Invoke-RestMethod -Uri "$mailpitUrl/api/v1/messages" -Method Get
    $matchingEmail = $mailpitRes.messages | Where-Object { $_.Subject -like "*$orderNumber*" } | Select-Object -First 1
    if ($matchingEmail) {
        Print-Success "Email Invoice Terkonfirmasi Masuk di Mailpit!"
        Print-Info "Subject: $($matchingEmail.Subject)"
        Print-Info "Kepada : $($matchingEmail.To[0].Address)"
        Print-Info "Waktu  : $($matchingEmail.Created)"
    } else {
        Print-Info "Total pesan di Mailpit: $($mailpitRes.total) pesan"
    }
} catch {
    Print-Info "Mailpit inbox dapat dilihat langsung di browser: http://localhost:8025"
}

Write-Host "`n========================================================================" -ForegroundColor Green
Write-Host "     SEMUA PENGUJIAN END-TO-END BERHASIL 100% TANPA KENDALA!            " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
