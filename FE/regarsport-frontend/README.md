# RegarSport – Frontend

Frontend aplikasi e-commerce RegarSport untuk perlengkapan olahraga. Dibangun dengan React, Vite, Tailwind CSS, dan React Router.

## 🚀 Fitur Utama (Customer)

- **Autentikasi**: Register, Login, Logout dengan JWT di cookie
- **Dashboard Customer**: Lihat produk, search, filter kategori, pagination
- **Detail Produk**: Info lengkap + review & rating dari pembeli
- **Keranjang Belanja**: Tambah, update qty, hapus item, pilih item untuk checkout
- **Wishlist**: Simpan produk favorit
- **Checkout**: Integrasi Midtrans Snap (pembayaran)
- **Pesanan Saya**: Riwayat order, filter status, pagination
- **Profil**: Edit nama & upload avatar
- **Review Produk**: Hanya pembeli yang sudah membayar bisa mereview
- **Tentang Kami**: Halaman informasi statis

## 🛠 Tech Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React | 19.x | UI Library |
| Vite | 8.x | Build tool |
| React Router | 7.x | Routing |
| Tailwind CSS | 4.x | Styling |
| Axios | 1.x | HTTP client |
| Lucide React | 1.x | Icon library |
| Recharts | 2.x | Grafik dashboard admin |
| React Hot Toast | 2.x | Notifikasi |


Catatan
- Frontend mengandalkan cookie httpOnly untuk autentikasi, pastikan withCredentials: true di Axios.
- Midtrans Snap di-load dari CDN via index.html.

  
## 📦 Instalasi & Menjalankan

# Clone repo
git clone <repository-url>
cd FRONTEND/regar-sport

# Install dependencies (pakai pnpm)
pnpm install

# Buat file .env dari contoh
cp .env.example .env

# Jalankan development server
pnpm run dev

Author: Abu
License: MIT © 2026 RegarSport
