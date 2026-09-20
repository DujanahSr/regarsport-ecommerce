# 🏆 RegarStore — Enterprise Microservices E-Commerce & RMA Warranty Platform

> **Platform E-Commerce & Manajemen Garansi (RMA) Skala Enterprise berbasis Arsitektur Microservices terdistribusi, dibangun menggunakan Java 21, Spring Boot 3, Spring Cloud Gateway, PostgreSQL (Database-per-Service), RabbitMQ Event-Driven, Redis Caching, Prometheus & Grafana Observability, serta React 19.**

---

### 🛡️ Tech Stack & Badges

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Cloud Gateway](https://img.shields.io/badge/Spring%20Cloud-Gateway-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud-gateway)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Observability-F46800?style=for-the-badge&logo=grafana&logoColor=white)](https://grafana.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![React 19](https://img.shields.io/badge/React-19%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Midtrans](https://img.shields.io/badge/Payment-Midtrans%20Snap-002B49?style=for-the-badge)](https://midtrans.com/)
[![JUnit 5](https://img.shields.io/badge/Testing-JUnit%205%20%2B%20Mockito-25A162?style=for-the-badge&logo=junit5&logoColor=white)](#-pengujian-otomatis-automated-testing)

---

## 📌 Ringkasan Eksekutif Projek

**RegarStore** adalah aplikasi e-commerce apparel dan jersey olahraga terdistribusi yang dirancang untuk menjawab tantangan industri nyata: **pemisahan domain layanan (*domain-driven design*)**, **keandalan transaksi tinggi (*high throughput & low latency*)**, **pemrosesan asinkron nir-hambatan (*non-blocking event-driven*)**, serta **siklus hidup purna jual transparan (*RMA - Return Merchandise Authorization & 3 Pilar Garansi 100%*)**.

Seluruh arsitektur backend dibangun dengan standar rekayasa perangkat lunak modern:
- **Zero Tight-Coupling**: Tidak ada SQL `JOIN` antar-database layanan.
- **Microservices Independen**: Setiap domain memiliki skema database mandiri (*Database-per-Service*).
- **Asynchronous Reliability**: Transaksi pembayaran dan notifikasi dikomunikasikan melalui message broker RabbitMQ dengan mekanisme *auto-retry*.
- **Full Observability**: Monitoring real-time metrik JVM (Memory heap, GC pause, live threads) dan indikator bisnis via Prometheus dan Grafana.

---

## 📐 Arsitektur Sistem (System Architecture)

### 1. Topologi Layanan Terdistribusi

```mermaid
flowchart TB
    Client["🌐 Client Apps: Web / Mobile (React 19 + Tailwind CSS)"]
    
    subgraph EdgeLayer["Edge & Security Layer"]
        Gateway["🚪 API Gateway (Spring Cloud Gateway :8080)\n• JWT AuthenticationFilter\n• Global CORS & Rate Limiting\n• Swagger Aggregator"]
    end

    Client -->|HTTP REST Requests| Gateway

    subgraph CoreServices["Microservices Ecosystem (Java 21 + Spring Boot 3)"]
        AuthSvc["🔐 Auth Service (:8086)\n• Spring Security 6\n• Stateless JWT & RBAC"]
        CatSvc["📦 Catalog Service (:8087)\n• Redis Cache-Aside\n• Cloudinary CDN Upload"]
        OrdSvc["🛒 Order Service (:8088)\n• Cart & Checkout Engine\n• 3 Pilar Garansi & RMA"]
        PaySvc["💳 Payment Service (:8089)\n• Midtrans Snap Gateway\n• Webhook Idempotency"]
        NotifSvc["📬 Notification Service (:8090)\n• Async Mail Worker\n• Mailpit / SMTP"]
    end

    Gateway --> AuthSvc
    Gateway --> CatSvc
    Gateway --> OrdSvc
    Gateway --> PaySvc

    subgraph DataLayer["Database-per-Service (PostgreSQL 16)"]
        DB_Auth[(regarsport_auth)]
        DB_Cat[(regarsport_catalog)]
        DB_Ord[(regarsport_order)]
        DB_Pay[(regarsport_payment)]
    end

    AuthSvc --- DB_Auth
    CatSvc --- DB_Cat
    OrdSvc --- DB_Ord
    PaySvc --- DB_Pay

    subgraph CacheBroker["Cache, Storage & Messaging"]
        Redis[("⚡ Redis 7\nCatalog Cache")]
        RabbitMQ{{"🐇 RabbitMQ 3\nAMQP Event Exchange"}}
        Cloudinary[("☁️ Cloudinary CDN\nMedia Storage")]
    end

    CatSvc <--> Redis
    CatSvc --> Cloudinary
    OrdSvc -->|Publish OrderCreatedEvent| RabbitMQ
    RabbitMQ -->|Consume Event| PaySvc
    PaySvc -->|Publish PaymentStatusUpdatedEvent| RabbitMQ
    RabbitMQ -->|Consume Event| OrdSvc
    RabbitMQ -->|Consume NotificationEvent| NotifSvc

    subgraph ObservabilityLayer["Observability & Monitoring Stack"]
        Prometheus["🔥 Prometheus (:9090)\nTime-Series Scraper"]
        Grafana["📊 Grafana Dashboard (:3000)\nJVM & Business Monitoring"]
    end

    CoreServices -.->|/actuator/prometheus| Prometheus
    Prometheus --> Grafana
```

---

### 2. Alur Transaksi Event-Driven (RabbitMQ Pipeline)

```mermaid
sequenceDiagram
    autonumber
    actor C as Pelanggan
    participant GW as API Gateway
    participant OS as Order Service
    participant MQ as RabbitMQ Broker
    participant PS as Payment Service
    participant MT as Midtrans Gateway
    participant NS as Notification Service

    C->>GW: Checkout Keranjang (POST /api/v1/orders/checkout)
    GW->>OS: Forward dengan X-User-Id
    OS->>OS: Validasi Stok & Buat Order (Status: PENDING)
    OS->>MQ: Publish OrderCreatedEvent
    OS-->>C: Order Dibuat (No. Order: REGAR-...)
    
    MQ->>PS: Consume OrderCreatedEvent
    PS->>MT: Request Snap Token (Midtrans API)
    MT-->>PS: Snap Token & Redirect URL
    
    C->>MT: Bayar Tagihan (QRIS / VA / Kartu Kredit)
    MT->>PS: Webhook HTTP Notification (settlement)
    PS->>PS: Validasi Signature & Idempotency Key
    PS->>MQ: Publish PaymentStatusUpdatedEvent (PAID)
    
    MQ->>OS: Update Status Order -> PAID (Siap Dikemas)
    MQ->>NS: Kirim Email Invoice ke Pelanggan (Async)
```

---

### 3. Siklus Hidup Klaim Garansi & Retur (RMA State Machine)

```mermaid
stateDiagram-v2
    [*] --> PENDING: 1. Pelanggan Mengajukan Klaim (#CLM-...)
    
    state "Review oleh Admin / CS" as CSReview {
        PENDING --> APPROVED: CS Setujui Bukti Foto & Ukuran Baru
        PENDING --> REJECTED: CS Tolak (Alasan Resmi Tercatat)
    }
    
    state "Operasional Fisik oleh Tim Gudang" as WarehouseOps {
        APPROVED --> PROCESSING: Paket Retur Diterima di Gudang
        APPROVED --> RESOLVED: Gudang Langsung Kirim Pengganti + Resi Baru
        PROCESSING --> RESOLVED: Selesai Produksi + Input Resi Pengganti
    }
    
    REJECTED --> [*]: Tiket Ditutup (Alasan Tampil di Portal Pelanggan)
    RESOLVED --> [*]: Selesai (Resi Pengganti Tampil Real-time ke Pelanggan)
```

---

## 🌟 Keunggulan Rekayasa Perangkat Lunak (Key Engineering Highlights)

### 1. Pola *Database-per-Service*
Mencegah dependensi antar-skema. Setiap microservice memiliki kredensial dan database terisolasi di PostgreSQL:
- `regarsport_auth`: Tabel `users`, otorisasi peran (`ROLE_ADMIN`, `ROLE_CUSTOMER`, `ROLE_LOGISTICS`).
- `regarsport_catalog`: Tabel `categories`, `products`, ulasan produk.
- `regarsport_order`: Tabel `orders`, `order_items`, `cart_items`, `vouchers`, `warranty_claims`.
- `regarsport_payment`: Tabel `payments`, histori transaksi, idempotency logs.

### 2. Java 21 Virtual Threads (Project Loom)
Seluruh microservice mengaktifkan konkurensi modern melalui konfigurasi:
```yaml
spring:
  threads:
    virtual:
      enabled: true
```
Memberikan efisiensi memori tinggi saat menangani lonjakan ribuan koneksi I/O pemesanan secara bersamaan tanpa kehabisan *OS thread pool*.

### 3. Observability Penuh dengan Prometheus & Grafana
- Microservices mengekspos metrik sistem via **Spring Boot Actuator** di `/actuator/prometheus`.
- **Prometheus** melakukan scraping berkala terhadap CPU, JVM memory pools (Eden, Survivor, Old Gen), garbage collection pause time, dan throughput HTTP.
- **Grafana** dikonfigurasi dengan *automated provisioning* (`datasources.yml` & `regarstore-overview.json`) untuk visualisasi instan metrik performa dan bisnis (volume transaksi & klaim garansi).

### 4. Perlindungan Idempotensi Webhook (*Strict Idempotency*)
Untuk mencegah pengiriman ganda saldo atau duplikasi status akibat *retry* dari payment gateway Midtrans, sistem menerapkan kunci idempotensi komposit:
```java
String idempotencyKey = orderNumber + "_" + transactionStatus;
```
Transaksi yang sudah diproses tidak akan pernah diproses ulang (*idempotent execution*).

### 5. Multi-Role RBAC (Role-Based Access Control)
- **Pelanggan (`ROLE_CUSTOMER`)**: Eksplorasi katalog, checkout, pelacakan pesanan, pengajuan klaim garansi 7 hari, submit review.
- **Admin / CS (`ROLE_ADMIN`)**: Analisis omset/keuangan, manajemen katalog & promo voucher, persetujuan klaim tiket `#CLM-...`.
- **Gudang / Logistik (`ROLE_LOGISTICS`)**: Antrean packing lunas (`PAID`), cetak label thermal A6, input nomor resi pengiriman utama & resi produk pengganti retur.

---

## 📸 Bukti Nyata Implementasi (Live Screenshots)

Berikut adalah bukti dokumentasi visual langsung dari sistem yang telah aktif berjalan:

### 1. Monitoring Server & JVM di Grafana Dashboard
> Visualisasi real-time performa sistem, memori heap JVM G1GC, penggunaan CPU, metrik klaim garansi, dan aktivitas thread.

![Grafana JVM & Business Dashboard](docs/images/grafana-dashboard.png)

---

### 2. Panel Admin: Manajemen Klaim Garansi & Retur
> Pusat kendali CS/Admin dalam memverifikasi pengajuan kendala pembeli dengan kartu KPI, filter status, dan tabel tiket terpadu.

![Admin Warranty Claims Management](docs/images/admin-warranty-dashboard.png)

---

### 3. Modal Tinjau Klaim CS: Validasi Bukti Foto Cloudinary
> CS dapat memeriksa foto bukti dari CDN, membaca keluhan ukuran pembeli, serta memberikan catatan persetujuan atau penolakan resmi.

![CS Claim Verification Modal](docs/images/admin-claim-verification.png)

---

### 4. Operasional Gudang: Input Resi Produk Pengganti
> Tim logistik memproses pengiriman produk pengganti, memilih ekspedisi kurir, dan mencatat nomor resi baru.

![Warehouse Replacement Fulfillment](docs/images/warehouse-replacement-dispatch.png)

---

### 5. Portal Pelanggan: Transparansi Garansi & Resi Pengganti Real-time
> Pelanggan dapat memantau countdown garansi 7 hari, status tiket, catatan CS/Gudang, dan menyalin nomor resi pengganti secara langsung.

![Customer Order Warranty & Tracking](docs/images/customer-order-warranty.png)

---

## 📁 Struktur Multi-Module Proyek

```text
RegarStore/
├── backend/
│   ├── pom.xml                                   # Master Parent POM (Spring Boot 3.3.4, Java 21)
│   ├── common-dto/                               # Shared DTOs, Event Models & ApiResponse Wrapper
│   ├── api-gateway/            (Port 8080)       # Spring Cloud Gateway & Edge JWT Filter
│   ├── auth-service/           (Port 8086)       # Spring Security 6, JWT & Manajemen Akun
│   ├── catalog-service/        (Port 8087)       # Produk, Kategori, Redis Cache & Upload CDN
│   ├── order-service/          (Port 8088)       # Checkout, Keranjang, Kupon, RMA & Garansi
│   ├── payment-service/        (Port 8089)       # Midtrans Snap, Webhook Idempotency & Events
│   └── notification-service/   (Port 8090)       # Consumer Email Asinkron & Mailpit
├── docker/
│   ├── docker-compose.yml                        # Stack Infrastruktur (Postgres, Redis, RabbitMQ, Mailpit, Prometheus, Grafana)
│   └── grafana/
│       └── provisioning/                         # Auto-provisioning Datasource & Dashboard
├── docs/
│   └── images/                                   # Dokumentasi visual & screenshot sistem
├── FE/
│   └── regarsport-frontend/    (Port 5173)       # React 19 + TypeScript + Tailwind CSS (Vite)
├── run-backend.bat                               # Script otomatisasi startup microservices (lean JVM)
└── stop-backend.bat                              # Script graceful shutdown port
```

---

## 🧪 Pengujian Otomatis (Automated Testing)

Proyek ini dilengkapi dengan rangkaian pengujian otomatis (*unit & integration tests*) menggunakan **JUnit 5**, **Mockito**, dan **AssertJ**:

```bash
# Menjalankan seluruh test suite di backend
cd backend
mvn clean test
```

### Ringkasan Cakupan Pengujian:
```text
Modul Layanan             Komponen yang Diuji                       Hasil
---------------------------------------------------------------------------------
order-service             WarrantyClaimServiceTest (Alur RMA)        7 Passed
order-service             OrderServiceTest (Checkout & Payment)      5 Passed
order-service             CartServiceTest (Shopping Cart Logic)      4 Passed
catalog-service           ProductServiceTest & CategoryTest          15 Passed
auth-service              AuthServiceTest & Token Verification       10 Passed
payment-service           WebhookServiceTest & PaymentService        8 Passed
api-gateway               AuthenticationFilterTest & JwtUtil         7 Passed
---------------------------------------------------------------------------------
Total Pengujian Otomatis                                             56 Passed (100%)
```

---

## ⚡ Panduan Menjalankan Sistem (Local Setup)

### 1. Prasyarat Sistem
- **Java 21 LTS** (JDK 21)
- **Apache Maven 3.9+**
- **Docker Desktop** (untuk PostgreSQL, Redis, RabbitMQ, Mailpit, Prometheus, Grafana)
- **Node.js 20+** & **npm**

### 2. Jalankan Infrastruktur Docker
```bash
cd docker
docker compose up -d
```
Layanan yang aktif:
- **PostgreSQL**: `localhost:5433` (atau `5432`)
- **Redis**: `localhost:6379`
- **RabbitMQ Dashboard**: `http://localhost:15672` (Kredensial: `guest` / `guest`)
- **Mailpit Web UI**: `http://localhost:8025`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (Kredensial: `admin` / `admin`)

### 3. Jalankan Seluruh Microservices
Gunakan script otomatis yang telah disiapkan (sudah dioptimalkan dengan flag alokasi memori hemat JVM):
```cmd
run-backend.bat
```
*Atau jalankan secara manual per modul via Maven:*
```bash
mvn -pl backend/auth-service spring-boot:run
mvn -pl backend/catalog-service spring-boot:run
mvn -pl backend/order-service spring-boot:run
mvn -pl backend/payment-service spring-boot:run
mvn -pl backend/notification-service spring-boot:run
mvn -pl backend/api-gateway spring-boot:run
```

### 4. Jalankan Antarmuka Web (Frontend)
```bash
cd FE/regarsport-frontend
npm install
npm run dev
```
Buka browser di: **`http://localhost:5173`**

### 5. Akses Dokumentasi API (OpenAPI / Swagger)
Buka dokumentasi interaktif seluruh endpoint microservices melalui API Gateway:
```
http://localhost:8080/swagger-ui.html
```

---

## 👤 Profil Pengembang (Author)

**Abu Dujanah Siregar**
- **Keahlian Utama**: Java Enterprise, Spring Boot, Microservices Architecture, Event-Driven Systems, Distributed Databases.
- **LinkedIn / Portofolio**: [linkedin.com/in/abudujanahsiregar](https://linkedin.com)
- **Email**: abudujanahsiregar@gmail.com
- **GitHub**: [@DujanahSr](https://github.com/DujanahSr)
