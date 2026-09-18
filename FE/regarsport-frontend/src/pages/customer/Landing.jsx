/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Star,
  Users,
  Award,
  ChevronRight,
  ShoppingBag,
  Heart,
  Phone,
  CheckCircle2,
  Package,
  Layers,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get("/products", { params: { page: 1, size: 4, sortBy: "id", sortOrder: "desc" } }).catch(() => ({ data: { data: { content: [] } } })),
          api.get("/categories").catch(() => ({ data: { data: [] } })),
        ]);

        const prodList = prodRes.data?.data?.content || prodRes.data?.content || [];
        setProducts(prodList);

        const catList = Array.isArray(catRes.data?.data) ? catRes.data.data : Array.isArray(catRes.data) ? catRes.data : [];
        setCategories(catList.slice(0, 5));
      } catch (err) {
        console.error("Gagal memuat data landing page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  const handleCustomJerseyClick = () => {
    const msg = encodeURIComponent(
      "Halo Tim Desain RegarSport, saya ingin konsultasi pembuatan custom jersey tim olahraga kami. Mohon info pricelist dan katalog bahan."
    );
    window.open(`https://wa.me/6281234567890?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-slate-100 font-sans selection:bg-[#00BFA5] selection:text-black">
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-gradient-to-r from-emerald-600 via-[#00BFA5] to-teal-700 text-black py-2 px-4 text-xs font-bold tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-black text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-black tracking-widest">
              PROMO SPESIAL
            </span>
            <span>Gunakan kode kupon <span className="underline decoration-2 font-black">REGARJUARA</span> saat checkout untuk potongan harga ekstra!</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold">
            <span>🛡️ Garansi 100% Produk Original</span>
            <span>•</span>
            <span>🚚 Pengiriman Seluruh Indonesia</span>
          </div>
        </div>
      </div>

      {/* 2. MODERN PUBLIC NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#0A0A0E]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-[#00BFA5] p-2.5 rounded-xl shadow-lg shadow-[#00BFA5]/25 group-hover:scale-105 transition-transform">
              <Zap size={22} className="text-black" strokeWidth={3} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-[3px] uppercase text-white">RegarSport</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#00BFA5]/10 text-[#00BFA5] border border-[#00BFA5]/30">
                  ORIGINAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">OFFICIAL ATHLETIC APPAREL</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#kategori" className="hover:text-[#00BFA5] transition-colors">Kategori</a>
            <a href="#koleksi" className="hover:text-[#00BFA5] transition-colors">Koleksi Terlaris</a>
            <a href="#keunggulan" className="hover:text-[#00BFA5] transition-colors">Keunggulan Pabrik</a>
            <a href="#testimoni" className="hover:text-[#00BFA5] transition-colors">Testimoni Tim</a>
            <Link to="/dashboard/about" className="hover:text-[#00BFA5] transition-colors">Tentang Kami</Link>
          </nav>

          {/* Action / Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === "admin" ? "/admin" : user.role === "logistics" ? "/admin/warehouse" : "/dashboard"}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00BFA5] to-teal-400 text-black font-extrabold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-[#00BFA5]/30 hover:scale-[1.02] transition-all"
              >
                <ShoppingBag size={16} />
                <span>Buka Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-[#00BFA5] text-black font-extrabold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-[#00BFA5]/30 hover:scale-[1.02] transition-all"
                >
                  Daftar Akun
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00BFA5]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00BFA5]">
                <Sparkles size={14} />
                <span>Teknologi Sublimasi Full-Print Presisi Tinggi</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                PERFORMA JUARA, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BFA5] via-teal-300 to-emerald-400">
                  APPAREL KELAS DUNIA.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed">
                Pusat apparel & jersey olahraga custom nomor satu di Indonesia. Dibuat langsung di pabrik PT RegarSport Indonesia (Wonogiri) dengan bahan Dry-Fit Microfiber berpori sirkulasi aktif, ringan, dan bebas custom nama & nomor tim.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#00BFA5] text-black font-black text-sm tracking-wider uppercase hover:shadow-xl hover:shadow-[#00BFA5]/30 hover:scale-[1.02] transition-all"
                >
                  <ShoppingBag size={18} />
                  <span>Jelajahi Koleksi Toko</span>
                  <ArrowRight size={18} />
                </Link>

                <button
                  type="button"
                  onClick={handleCustomJerseyClick}
                  className="flex items-center gap-2.5 px-7 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm hover:border-[#00BFA5]/50 transition-all cursor-pointer"
                >
                  <Phone size={18} className="text-[#00BFA5]" />
                  <span>Konsultasi Jersey Tim</span>
                </button>
              </div>

              {/* Trust Metric Counters */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">10.000+</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Tim Olahraga Juara</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#00BFA5]">100%</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Garansi Ukuran & Cacat</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">4.9 / 5.0</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Rating Kepuasan Atlet</div>
                </div>
              </div>
            </div>

            {/* Right Visual Card Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 p-1 border border-white/10 shadow-2xl shadow-black/80 group">
                <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden bg-[#14141E]">
                  <img
                    src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80"
                    alt="RegarSport Athletic Showcase"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Floating Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white">
                    <Award size={14} className="text-amber-400" />
                    <span>RegarSport Pro Elite Series</span>
                  </div>

                  {/* Bottom Card Info */}
                  <div className="absolute bottom-6 left-6 right-6 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#00BFA5]">
                      Direct From Factory • Wonogiri
                    </span>
                    <h3 className="text-xl font-black text-white">
                      Jersey Sublimasi Premium Dry-Fit Anti Luntur
                    </h3>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div>
                        <div className="text-[10px] text-slate-400">Mulai dari</div>
                        <div className="text-lg font-black text-[#00BFA5]">Rp 185.000</div>
                      </div>
                      <Link
                        to="/dashboard"
                        className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-[#00BFA5] transition-colors"
                      >
                        Beli Sekarang
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 4 PILAR KEUNGGULAN PABRIK */}
      <section id="keunggulan" className="py-16 bg-[#0E0E14] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#00BFA5]">
              STANDAR KUALITAS REGARSPORT
            </span>
            <h2 className="text-3xl font-black text-white mt-2">
              Mengapa Ribuan Tim Memilih RegarSport?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Layers,
                title: "Pabrikasi Sendiri",
                desc: "Seluruh proses mulai dari desain, potong kain, printing sublimasi Jepang, hingga jahit dilakukan terpusat di Wonogiri.",
              },
              {
                icon: Sparkles,
                title: "Warna Tajam & Anti Luntur",
                desc: "Tinta sublimasi bersertifikasi OEKO-TEX ramah lingkungan dengan daya rekat serat kain permanen tahan cuci berkali-kali.",
              },
              {
                icon: ShieldCheck,
                title: "100% Garansi Resmi",
                desc: "Komitmen garansi tanpa ribet. Jika ukuran salah kirim atau jahitan cacat, kami perbaiki atau ganti baru secara cuma-cuma.",
              },
              {
                icon: Truck,
                title: "Midtrans & Ekspedisi Resmi",
                desc: "Pembayaran instan otomatis lewat Midtrans Sandbox/Production dan kirim via J&T, JNE, SiCepat dengan nomor resi terverifikasi.",
              },
            ].map((pilar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#00BFA5]/30 hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00BFA5]/10 border border-[#00BFA5]/20 flex items-center justify-center text-[#00BFA5] mb-4 group-hover:scale-110 transition-transform">
                  <pilar.icon size={22} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{pilar.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{pilar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. KATEGORI OLAHRAGA UNGGULAN */}
      <section id="kategori" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#00BFA5]">
                PILIHAN KATEGORI
              </span>
              <h2 className="text-3xl font-black text-white mt-2">
                Pilihan Cabang Olahraga Favorit
              </h2>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#00BFA5] hover:underline"
            >
              <span>Lihat Semua Kategori di Toko</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/dashboard`}
                  className="group relative p-5 rounded-2xl bg-[#14141E] border border-white/5 hover:border-[#00BFA5]/40 text-center flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Package size={28} className="text-[#00BFA5]" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))
            ) : (
              [
                "Jersey & Tim Olahraga",
                "Sepatu Olahraga",
                "Bola Pertandingan",
                "Jaket & Training",
                "Aksesoris Olahraga",
              ].map((name, i) => (
                <Link
                  key={i}
                  to="/dashboard"
                  className="group p-5 rounded-2xl bg-[#14141E] border border-white/5 hover:border-[#00BFA5]/40 text-center flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-full bg-[#00BFA5]/10 text-[#00BFA5] flex items-center justify-center">
                    <Package size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-200">{name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. KOLEKSI PRODUK TERLARIS */}
      <section id="koleksi" className="py-20 bg-[#0E0E14] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#00BFA5]">
                REKOMENDASI ATLET
              </span>
              <h2 className="text-3xl font-black text-white mt-2">
                Koleksi Paling Dicari Pekan Ini
              </h2>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors"
            >
              <span>Buka Katalog Lengkap</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((prod) => (
                <div
                  key={prod.id}
                  className="group rounded-2xl bg-[#14141E] border border-white/5 overflow-hidden flex flex-col hover:border-[#00BFA5]/40 hover:-translate-y-1 transition-all shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-black/40">
                    <img
                      src={prod.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80"}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#00BFA5] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                      ORIGINAL
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {prod.category?.name || "Apparel RegarSport"}
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#00BFA5] transition-colors mt-1">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-[#00BFA5]">
                          Rp {Number(prod.price || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-slate-500">Stok: {prod.stock || 0} pcs</div>
                      </div>
                      <Link
                        to={`/dashboard/product/${prod.id}`}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#00BFA5] hover:text-black text-white text-xs font-bold transition-all"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-12 text-slate-400 text-sm">
                Sedang memuat koleksi terbaru dari pabrik...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONI TIM & ATLET */}
      <section id="testimoni" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#00BFA5]">
              TESTIMONI NYATA
            </span>
            <h2 className="text-3xl font-black text-white mt-2">
              Dipercaya Oleh Kapten Tim Se-Indonesia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                team: "Garuda FC Wonogiri",
                quote:
                  "Jersey tim kami sudah dicuci puluhan kali untuk turnamen regional, warna sublimasi dan nama punggung tetap tajam tanpa retak. Bahan super adem!",
                name: "Rian Saputra",
                role: "Kapten Tim",
              },
              {
                team: "Bandung Runners Club",
                quote:
                  "Order 45 pcs jersey running custom, pengerjaan tepat waktu dan garansi ukuran benar-benar ditepati. Recommended seller untuk komunitas!",
                name: "Dian Permana",
                role: "Koordinator Tim",
              },
              {
                team: "Rajawali Futsal Solo",
                quote:
                  "Pelayanan responsif, invoice PDF langsung terunduh resmi, dan pembayaran Midtrans sangat praktis. Pasti reorder untuk turnamen musim depan.",
                name: "Fikri Maulana",
                role: "Manajer Tim",
              },
            ].map((testi, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#14141E] border border-white/5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{testi.quote}"
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <div className="text-xs font-bold text-white">{testi.name}</div>
                  <div className="text-[10px] text-[#00BFA5] font-semibold">{testi.role} • {testi.team}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-r from-emerald-900 via-teal-900 to-black relative overflow-hidden border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Siap Bawa Tim Anda Tampil Percaya Diri & Juara?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Dapatkan apparel olahraga berstandar atletik profesional langsung dari pabrik PT RegarSport Indonesia.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="px-8 py-3.5 rounded-xl bg-[#00BFA5] text-black font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform"
            >
              Belanja Sekarang di Toko
            </Link>
            <button
              type="button"
              onClick={handleCustomJerseyClick}
              className="px-8 py-3.5 rounded-xl bg-black/60 text-white font-bold text-xs border border-white/20 hover:bg-black transition-colors cursor-pointer"
            >
              Buat Jersey Tim (WhatsApp)
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER KORPORAT */}
      <footer className="bg-[#07070A] py-14 border-t border-white/5 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="bg-[#00BFA5] p-1.5 rounded-lg">
                <Zap size={16} className="text-black" strokeWidth={3} />
              </div>
              <span className="text-white font-black tracking-widest text-sm uppercase">PT REGARSPORT INDONESIA</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Perusahaan manufaktur & apparel olahraga modern berbasis teknologi digital, berpusat di Wonogiri, Jawa Tengah.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">
              NPWP: 01.345.678.9-521.000
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Layanan Toko</h5>
            <ul className="space-y-2 text-[11px]">
              <li><Link to="/dashboard" className="hover:text-white">Katalog Ready Stock</Link></li>
              <li><a href="#kategori" className="hover:text-white">Kategori Produk</a></li>
              <li><a href="#keunggulan" className="hover:text-white">Garansi & Retur Ukuran</a></li>
              <li><Link to="/dashboard/cart" className="hover:text-white">Keranjang Belanja</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Kontak Pabrik & CS</h5>
            <ul className="space-y-2 text-[11px]">
              <li>Jl. Jenderal Sudirman No. 45, Wonogiri, Jawa Tengah 57612</li>
              <li>WhatsApp CS: +62 812-3456-7890</li>
              <li>Email: cs@regarsport.com</li>
              <li>Senin - Sabtu: 08.00 - 17.00 WIB</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Partner Pembayaran & Kurir</h5>
            <p className="text-[11px] mb-3">
              Didukung sistem pembayaran Midtrans (BCA, Mandiri, BRI, BNI, QRIS, GoPay) serta kurir ekspedisi J&T Express, JNE, SiCepat, Anteraja.
            </p>
            <div className="text-[10px] text-[#00BFA5] font-semibold">
              ✓ Verified SSL 256-bit Security
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px]">
          <div>© {new Date().getFullYear()} PT RegarSport Indonesia. Hak Cipta Dilindungi.</div>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <Link to="/dashboard/about" className="hover:text-white">Tentang Perusahaan</Link>
            <span>•</span>
            <span className="hover:text-white">Syarat & Ketentuan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
