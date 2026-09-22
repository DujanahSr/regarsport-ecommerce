# Panduan Deployment Produksi RegarSport (Railway & Cloud)

Dokumen ini berisi panduan terstruktur dan praktis untuk mendeploy ekosistem **RegarSport** (Backend Microservices Spring Boot, Database PostgreSQL, Redis, RabbitMQ, dan Frontend React Vite) ke platform cloud seperti **Railway**, VPS, atau penyedia cloud lainnya.

---

## 1. Arsitektur Komponen Produksi

| Layanan | Teknologi | Port Default Internal | Deskripsi |
|---|---|---|---|
| **API Gateway** | Spring Cloud Gateway (Java 21) | `8080` | Satu-satunya titik masuk publik (Entrypoint) ke backend |
| **Auth Service** | Spring Boot 3 (Java 21) | `8086` | Manajemen user, JWT authentication, registrasi |
| **Catalog Service** | Spring Boot 3 + Redis Cache | `8087` | Inventaris produk, kategori, Cloudinary upload |
| **Order Service** | Spring Boot 3 + RabbitMQ | `8088` | Keranjang belanja, checkout pesanan, klaim garansi |
| **Payment Service** | Spring Boot 3 + Midtrans | `8089` | Transaksi Midtrans Snap, Webhook callback pembayaran |
| **Notification Service** | Spring Boot 3 + RabbitMQ | `8090` | Notifikasi email asinkron pelanggan |
| **PostgreSQL** | PostgreSQL 16 | `5432` | Basis data relasional (multi-database / multi-schema) |
| **Redis** | Redis 7 Alpine | `6379` | Caching performa tinggi untuk katalog produk |
| **RabbitMQ** | RabbitMQ 3 Management | `5672` | Message broker event-driven order & payment |
| **Frontend Web** | React 19 + Vite + Tailwind CSS | `5173` (Dev) / `80` (Prod) | UI Pelanggan, Dashboard Admin, dan Gudang |

---

## 2. Persiapan di Railway

### Langkah A: Buat Proyek Baru di Railway
1. Login ke [Railway.app](https://railway.app).
2. Klik **New Project**.
3. Tambahkan Database & Message Broker terlebih dahulu dari template Railway (1 klik):
   - **PostgreSQL**: Tambahkan layanan Postgres. Catat `DATABASE_URL` atau Host, Port, User, Password.
   - **Redis**: Tambahkan layanan Redis. Catat `REDIS_HOST` dan `REDIS_PORT`.
   - **RabbitMQ**: Buat layanan menggunakan image Docker `rabbitmq:3-management-alpine`.

### Inisialisasi Database
Jalankan skrip inisialisasi dari file `docker/init-db/01-init-databases.sql` ke PostgreSQL Railway untuk membuat database:
- `regarsport_auth`
- `regarsport_catalog`
- `regarsport_order`
- `regarsport_payment`

---

## 3. Deployment Backend Microservices

Di Railway, sambungkan repositori GitHub Anda: `DujanahSr/regarsport-ecommerce`.

### Variabel Lingkungan Bersama (Shared Environment Variables):
```env
# Database PostgreSQL Railway
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Redis Railway
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}

# RabbitMQ
RABBITMQ_HOST=${{RabbitMQ.RAILWAY_PRIVATE_DOMAIN}}
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# JWT Secret (Gunakan 64-karakter hex acak)
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

# Cloudinary (Media Foto Produk)
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=Mid-server-your-server-key
MIDTRANS_CLIENT_KEY=Mid-client-your-client-key
MIDTRANS_IS_PRODUCTION=true
```

### Konfigurasi Service di Railway:
1. **API Gateway**:
   - Root Directory: `backend`
   - Build Command: `mvn clean package -pl api-gateway -am -DskipTests`
   - Start Command: `java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar`
   - Buka Domain Publik di Railway (misal: `https://api-regarsport.up.railway.app`).

2. **Auth Service**:
   - Build: `mvn clean package -pl auth-service -am -DskipTests`
   - Start: `java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar auth-service/target/auth-service-1.0.0-SNAPSHOT.jar`

3. **Catalog Service**:
   - Build: `mvn clean package -pl catalog-service -am -DskipTests`
   - Start: `java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar catalog-service/target/catalog-service-1.0.0-SNAPSHOT.jar`

4. **Order Service**:
   - Build: `mvn clean package -pl order-service -am -DskipTests`
   - Start: `java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar order-service/target/order-service-1.0.0-SNAPSHOT.jar`

5. **Payment Service**:
   - Build: `mvn clean package -pl payment-service -am -DskipTests`
   - Start: `java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar payment-service/target/payment-service-1.0.0-SNAPSHOT.jar`

6. **Notification Service**:
   - Build: `mvn clean package -pl notification-service -am -DskipTests`
   - Start: `java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar notification-service/target/notification-service-1.0.0-SNAPSHOT.jar`

---

## 4. Deployment Frontend (React + Vite)

Frontend dapat dideploy ke **Vercel**, **Netlify**, atau layanan static **Railway**:

1. **Root Directory**: `FE/regarsport-frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://api-regarsport.up.railway.app/api/v1
   VITE_MIDTRANS_CLIENT_KEY=Mid-client-your-production-client-key
   ```

---

## 5. Pemeriksaan Kebersihan & Keamanan File (Production-Ready)

Proyek ini telah dibersihkan secara teliti untuk produksi:
1. **Tidak Ada File Log**: Seluruh file dump Java HotSpot (`hs_err_pid*.log` dan `replay_pid*.log`) telah dihapus secara menyeluruh.
2. **Aturan `.gitignore` Komprehensif**: Mengabaikan secara rekursif seluruh format log (`**/*.log`, `**/hs_err_pid*.log`), file `.env` lokal berisikan credential, dan folder output build (`dist/`, `target/`).
3. **Dokumentasi `.env.example`**: Tersedia di root dan folder frontend untuk memudahkan setup environment tanpa mengekspos secret key.
