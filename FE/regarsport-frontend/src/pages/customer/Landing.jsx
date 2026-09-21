import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Menu,
  ShoppingBag,
  Heart,
  User,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Star,
  CheckCircle2,
  Phone,
  Layers,
  Award,
  Plus,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

import NavDrawer from "../../components/customer/NavDrawer";
import CartSlideOver from "../../components/customer/CartSlideOver";
import QuickSearchModal from "../../components/customer/QuickSearchModal";

export default function Landing() {
  const { user } = useAuth();
  const { cartItems = [], addToCart = () => {} } = useCart() || {};
  const wishlist = useWishlist() || {};
  const wishlistItems = wishlist.wishlistItems || [];
  const toggleWishlist = wishlist.toggleWishlist || (() => {});
  const isWishlisted = wishlist.isWishlisted || wishlist.isInWishlist || (() => false);

  // Drawer and Modal States
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Products and Categories Data
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  // Total cart count
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cartItems]
  );

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const prodRes = await api
          .get("/products", {
            params: { page: 1, size: 8, sortBy: "id", sortOrder: "desc" },
          })
          .catch(() => ({ data: { data: { content: [] } } }));

        const prodList =
          prodRes.data?.data?.content || prodRes.data?.content || [];
        setProducts(prodList);
      } catch (err) {
        console.error("Gagal memuat data katalog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  const handleCustomWhatsApp = () => {
    const msg = encodeURIComponent(
      "Halo Tim Desain RegarSport Cicendo Bandung, saya ingin konsultasi pembuatan custom jersey tim olahraga kami. Mohon info katalog bahan dry-fit dan pricelist."
    );
    window.open(`https://wa.me/6281234567890?text=${msg}`, "_blank");
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSent(true);
      setTimeout(() => setNewsletterSent(false), 4000);
      setNewsletterEmail("");
    }
  };

  // Filtered products for showcase section
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "ALL") return products;
    return products.filter((p) => {
      const catName = p.category?.name?.toUpperCase() || "";
      const prodName = p.name?.toUpperCase() || "";
      return catName.includes(selectedCategory) || prodName.includes(selectedCategory);
    });
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111613] font-sans-body antialiased selection:bg-[#B9382B] selection:text-white">
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-[#111613] text-[#FAF8F4] py-2 px-4 text-[11px] font-semibold border-b border-white/10 tracking-wider">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
            <span className="bg-[#B9382B] text-white text-[9px] uppercase px-2 py-0.5 rounded-full font-black tracking-widest">
              OFFICIAL LAUNCH
            </span>
            <span className="text-slate-300">
              Koleksi Pro Elite 2026 Tersedia • Gunakan kupon{" "}
              <span className="text-white font-extrabold underline decoration-1 underline-offset-2">
                REGARJUARA
              </span>{" "}
              untuk diskon ekstra
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-5 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Garansi Tukar Ukuran 100%
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-emerald-400" />
              Bebas Ongkir Seluruh Indonesia
            </span>
          </div>
        </div>
      </div>

      {/* 2. TACTICAL HEADER / NAVBAR (BRIGADE OVERLAND AESTHETIC) */}
      <header className="sticky top-0 z-40 bg-[#162018]/95 backdrop-blur-md text-white border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Menu Hamburger & Search Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsNavOpen(true)}
              className="flex items-center gap-2 py-2 px-3 rounded-full hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              title="Buka Menu Kategori"
            >
              <Menu size={18} />
              <span className="hidden sm:inline">MENU</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 py-2 px-3 rounded-full hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Cari Jersey & Produk"
            >
              <Search size={17} />
              <span className="hidden md:inline">CARI</span>
            </button>
          </div>

          {/* Center: Shield Crest Brand Emblem */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Tactical Crest SVG Emblem */}
            <div className="relative w-9 h-10 bg-[#B9382B] rounded-b-xl flex items-center justify-center shadow-lg shadow-[#B9382B]/20 group-hover:scale-105 transition-transform">
              <div className="w-5 h-5 border-2 border-white transform rotate-45 flex items-center justify-center">
                <span className="text-[10px] font-black transform -rotate-45 text-white">
                  R
                </span>
              </div>
            </div>

            <div className="text-left">
              <span className="font-condensed text-2xl sm:text-3xl font-extrabold tracking-tight uppercase text-white block leading-none">
                REGARSPORT
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[2px] text-emerald-400/90 block">
                APPAREL • CICENDO BANDUNG
              </span>
            </div>
          </Link>

          {/* Right: Auth, Wishlist & Cart Drawer Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                to={
                  user.role === "admin"
                    ? "/admin"
                    : user.role === "logistics"
                    ? "/admin/warehouse"
                    : "/dashboard"
                }
                className="hidden sm:flex items-center gap-2 py-2 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition-colors"
              >
                <User size={15} />
                <span>{user.fullName ? user.fullName.split(" ")[0] : "Akun"}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-block py-2 px-4 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                MASUK
              </Link>
            )}

            {/* Wishlist Link */}
            <Link
              to="/dashboard/favorites"
              className="relative p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Koleksi Favorit"
            >
              <Heart size={19} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#B9382B] text-[9px] font-black flex items-center justify-center text-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart Slide-Over Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 py-2 px-3 sm:px-4 rounded-full bg-[#FAF8F4] text-[#111613] hover:bg-white font-extrabold text-xs tracking-wider uppercase transition-all hover:scale-105 shadow-md cursor-pointer"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">KERANJANG</span>
              <span className="w-5 h-5 rounded-full bg-[#111613] text-white text-[10px] font-black flex items-center justify-center ml-0.5">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. SPLIT HERO SECTION (DARK TACTICAL OLIVE + TOPOGRAPHY TEXTURE) */}
      <section className="relative bg-[#18221B] text-white overflow-hidden border-b border-white/10">
        {/* Topographic Contour Texture Overlay */}
        <div className="absolute inset-0 bg-topography opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Editorial Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>KOLEKSI ATLETIK 2026 • ATELIER CICENDO BANDUNG</span>
              </div>

              <h1 className="font-condensed text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.95]">
                PERFORMA TANPA BATAS. <br />
                <span className="text-[#FAF8F4] opacity-90">
                  DIBUAT UNTUK JUARA.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Pusat apparel & jersey olahraga custom berstandar profesional.
                Dibuat langsung di atelier PT RegarSport Indonesia (Cicendo, Kota Bandung) dengan
                bahan Dry-Fit Microfiber berpori aktif, sublimasi permanen anti-luntur,
                dan komitmen garansi tukar ukuran 100%.
              </p>

              {/* Action Buttons (Pill CTAs) */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-xl"
                >
                  <span>JELAJAHI KOLEKSI TOKO</span>
                  <ArrowRight size={16} />
                </Link>

                <button
                  type="button"
                  onClick={handleCustomWhatsApp}
                  className="flex items-center gap-2 px-7 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer"
                >
                  <Phone size={15} className="text-emerald-400" />
                  <span>KONSULTASI JERSEY TIM</span>
                </button>
              </div>

              {/* 3 Metric Counters */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="font-condensed text-3xl sm:text-4xl font-extrabold text-white">
                    10.000+
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">
                    Tim Juara
                  </div>
                </div>
                <div>
                  <div className="font-condensed text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    100%
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">
                    Garansi Resmi
                  </div>
                </div>
                <div>
                  <div className="font-condensed text-3xl sm:text-4xl font-extrabold text-white">
                    4.9 / 5.0
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">
                    Rating Atlet
                  </div>
                </div>
              </div>
            </div>

            {/* Right Athlete Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden bg-black/40 border border-white/15 shadow-2xl group">
                <div className="relative aspect-4/5 overflow-hidden">
                  <img
                    src="/images/hero-athlete.jpg"
                    alt="RegarSport Pro Athlete"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#162018] via-transparent to-black/30" />

                  {/* Floating Crest Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-bold text-white uppercase tracking-wider">
                    <Award size={14} className="text-[#B9382B]" />
                    <span>REGARSPORT PRO ELITE SERIES</span>
                  </div>

                  {/* Bottom Card Information */}
                  <div className="absolute bottom-5 left-5 right-5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      OFFICIAL DRY-FIT MICROFIBER
                    </span>
                    <h3 className="font-condensed text-2xl font-bold uppercase text-white leading-tight">
                      JERSEY SUBLIMASI PREMIER ANTI-LUNTUR
                    </h3>
                    <div className="flex items-center justify-between pt-2 border-t border-white/15">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Mulai Dari</div>
                        <div className="font-condensed text-xl font-bold text-white">
                          Rp 175.000
                        </div>
                      </div>
                      <Link
                        to="/dashboard"
                        className="px-5 py-2 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-black text-xs uppercase tracking-wider transition-all hover:scale-105"
                      >
                        Pesan Sekarang
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISUAL CATEGORY SHOWCASE (CAROUSEL / GRID WITH CIRCULAR ARROWS) */}
      <section id="kategori" className="py-16 sm:py-24 bg-[#F3EFE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                PILIHAN KATEGORI OLAHRAGA
              </span>
              <h2 className="font-condensed text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
                DIRANCANG UNTUK SETIAP CABANG
              </h2>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-black hover:underline"
            >
              <span>LIHAT SEMUA KATEGORI</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                id: 1,
                name: "SEPAKBOLA & FUTSAL",
                image: "/images/cat-football.jpg",
                tag: "TERLARIS",
                subtitle: "Dry-Fit Microfiber • Anti-UV",
              },
              {
                id: 2,
                name: "BOLA VOLI PRO",
                image: "/images/cat-volleyball.jpg",
                tag: "PRO LIGA",
                subtitle: "Kerah V-Neck • Elastis Tinggi",
              },
              {
                id: 3,
                name: "BADMINTON ELITE",
                image: "/images/cat-badminton.jpg",
                tag: "RINGAN",
                subtitle: "Ventilasi Aktif • Cepat Kering",
              },
              {
                id: 4,
                name: "KOMUNITAS & ESPORTS",
                image: "/images/cat-esports.jpg",
                tag: "CUSTOM",
                subtitle: "Full-Print Sublimasi Tanpa Batas",
              },
            ].map((cat) => (
              <Link
                key={cat.id}
                to={`/dashboard?categoryId=${cat.id}`}
                className="group relative aspect-4/5 rounded-3xl overflow-hidden bg-black/5 shadow-md border border-black/5 flex flex-col justify-between p-5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-[#B9382B] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                    {cat.tag}
                  </span>
                </div>

                {/* Bottom Title & Circular Arrow Button */}
                <div className="relative z-10 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-condensed text-2xl font-bold uppercase text-white leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>

                  {/* Circular Arrow Button (Brigade Overland signature) */}
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-black transition-all shadow">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. KOLEKSI UNGGULAN & MULTI-BADGE PRODUCTS GRID */}
      <section id="koleksi" className="py-16 sm:py-24 bg-[#FAF8F4] border-t border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                KATALOG UNGGULAN
              </span>
              <h2 className="font-condensed text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
                REKOMENDASI ATLET PEKAN INI
              </h2>
            </div>

            {/* Category Filter Pills (Brigade Overland Pill Style) */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "SEMUA", value: "ALL" },
                { label: "SEPAKBOLA", value: "SEPAKBOLA" },
                { label: "BOLA VOLI", value: "VOLI" },
                { label: "BADMINTON", value: "BADMINTON" },
                { label: "ESPORTS & KOMUNITAS", value: "ESPORT" },
                { label: "BASKET", value: "BASKET" },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setSelectedCategory(pill.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === pill.value
                      ? "bg-[#111613] text-white shadow-md scale-105"
                      : "bg-white hover:bg-slate-200 text-slate-700 border border-black/10"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 text-center py-16 text-slate-500 text-sm">
                Sedang memuat katalog jersey dari atelier Cicendo Bandung...
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.slice(0, 8).map((prod) => {
                const isFav = isWishlisted(prod.id);
                const discountPercent = 15;
                const originalPrice = Math.round(Number(prod.price || 185000) * 1.18);

                return (
                  <div
                    key={prod.id}
                    className="group rounded-3xl bg-white border border-black/5 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image & Multi-Badge Container */}
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={
                          prod.imageUrl ||
                          prod.image_url ||
                          "/images/hero-athlete.jpg"
                        }
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/hero-athlete.jpg";
                        }}
                      />

                      {/* Side-by-Side Multi-Badges (Brigade Overland Style) */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        <span className="bg-white/95 backdrop-blur-sm text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                          DISKON {discountPercent}%
                        </span>
                        <span className="bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full">
                          GARANSI 100%
                        </span>
                      </div>

                      {/* Wishlist Toggle Button */}
                      <button
                        onClick={() => toggleWishlist(prod)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
                          isFav
                            ? "bg-[#B9382B] text-white shadow"
                            : "bg-white/80 hover:bg-white text-slate-700 hover:text-black shadow-sm"
                        }`}
                        title="Favorit"
                      >
                        <Heart size={15} fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {prod.category?.name || "RegarSport Apparel"}
                        </div>
                        <h4 className="font-condensed text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors mt-0.5">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400 line-through">
                            Rp {originalPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="font-condensed text-xl font-black text-[#111613]">
                            Rp {Number(prod.price || 0).toLocaleString("id-ID")}
                          </div>
                        </div>

                        {/* Add to Cart Quick Pill Button */}
                        <button
                          onClick={async () => {
                            await addToCart(prod, 1, "L");
                            setIsCartOpen(true);
                          }}
                          className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#111613] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow"
                          title="Tambah ke Keranjang"
                        >
                          <Plus size={14} />
                          <span>BELI</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 text-center py-16 text-slate-500 text-sm">
                Tidak ada produk dalam kategori ini saat ini.
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#111613] hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-xl"
            >
              <span>LIHAT SELURUH READY STOCK ({products.length} PRODUK)</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL STORY BANNER ("DIPRODUKSI SENDIRI & TERUJI DI LAPANGAN") */}
      <section className="py-20 bg-[#18221B] text-white relative overflow-hidden border-y border-white/10">
        {/* Topographic Background Texture */}
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Factory Craftsmanship Photo */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/15 aspect-16/10">
                <img
                  src="/images/story-factory.jpg"
                  alt="Atelier RegarSport Cicendo Bandung"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider">
                  CICENDO APPAREL STUDIO • KOTA BANDUNG
                </div>
              </div>
            </div>

            {/* Right Editorial Story Copy */}
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                FILOSOFI & DEDIKASI KAMI
              </span>

              <h2 className="font-condensed text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                DIPRODUKSI SENDIRI & <br />
                TERUJI DI SETIAP LAPANGAN.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Di RegarSport, kami tidak sekadar menjual jersey. Kami mengoperasikan
                fasilitas manufaktur & atelier tekstil terpadu di Cicendo, Kota Bandung. Mulai
                dari riset kain Dry-Fit berpori aktif, pencetakan tinta sublimasi
                standar OEKO-TEX ramah lingkungan, hingga penjahitan presisi tinggi
                yang dirancang untuk tahan bergesekan dalam kompetisi terberat.
              </p>

              <p className="text-sm text-slate-300 leading-relaxed">
                Itulah alasan kami berani memberikan <b>100% Garansi Tukar Ukuran</b>.
                Jika ukuran jersey tim Anda tidak pas saat sampai di tangan, kami
                perbaiki atau ganti baru secara cuma-cuma.
              </p>

              <div className="pt-2">
                <Link
                  to="/dashboard/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 hover:border-white bg-white/5 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105"
                >
                  <span>BACA KISAH PABRIK KAMI</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 4 PILAR KEUNGGULAN BRAND */}
      <section id="keunggulan" className="py-16 sm:py-20 bg-[#F3EFE7] border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              STANDAR MUTU UTAMA
            </span>
            <h2 className="font-condensed text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
              MENGAPA 10.000+ TIM MEMILIH REGARSPORT?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "100% GARANSI TUKAR UKURAN",
                desc: "Klaim garansi tanpa ribet dalam 7 hari. Salah ukuran atau jahitan cacat langsung diproses tim admin & gudang kami.",
              },
              {
                icon: Sparkles,
                title: "SUBLIMASI WARNA PERMANEN",
                desc: "Tinta bersertifikat OEKO-TEX standar Eropa. Warna tidak akan pudar atau mengelupas meski dicuci ratusan kali.",
              },
              {
                icon: Layers,
                title: "DRY-FIT PORI SIRKULASI AKTIF",
                desc: "Bahan microfiber dengan sirkulasi mikroaktif menyerap keringat seketika, ringan, dan sejuk di lapangan.",
              },
              {
                icon: Truck,
                title: "TRANSAKSI & RESI OTOMATIS",
                desc: "Pembayaran terverifikasi otomatis via Midtrans serta pelacakan resi ekspedisi real-time hingga pesanan tiba.",
              },
            ].map((pilar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#18221B] text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <pilar.icon size={22} />
                </div>
                <h3 className="font-condensed text-lg font-bold uppercase text-[#111613] mb-2">
                  {pilar.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pilar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONI ATLET & KAPTEN TIM */}
      <section id="testimoni" className="py-20 bg-[#FAF8F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              BUKTI KEPUASAN TIM
            </span>
            <h2 className="font-condensed text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#111613] mt-1">
              DIPERCAYA OLEH KAPTEEN TIM SE-INDONESIA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Jersey tim kami sudah dipakai lebih dari 30 pertandingan regional. Warna sublimasi dan sablon nomor punggung tetap tajam tanpa retak. Bahan sangat adem!",
                name: "Rian Saputra",
                role: "Kapten Bandung Juara FC",
                team: "Turnamen Liga 3 Regional",
              },
              {
                quote:
                  "Order 45 pcs untuk running komunitas kami. Garansi ukuran benar-benar ditepati, saat ada 2 jersey anggota kekecilan langsung diganti baru dalam 3 hari!",
                name: "Dian Permana",
                role: "Koordinator Bandung Runners",
                team: "Marathon Community",
              },
              {
                quote:
                  "Proses checkout Midtrans cepat, invoice PDF langsung terunduh resmi untuk klaim sponsor, dan resi J&T terverifikasi otomatis. Mantap sekali!",
                name: "Fikri Maulana",
                role: "Manajer Rajawali Futsal Solo",
                team: "Futsal Championship",
              },
            ].map((testi, idx) => (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white border border-black/5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-xl transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{testi.quote}&quot;
                  </p>
                </div>
                <div className="pt-4 border-t border-black/5">
                  <div className="font-condensed text-base font-bold uppercase text-[#111613]">
                    {testi.name}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    {testi.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TACTICAL DARK FOOTER (TOPOGRAPHIC THEME) */}
      <footer className="bg-[#121A14] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
        {/* Topographic Texture */}
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          {/* Newsletter Section with Embedded Pill Input */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#18221B] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1 text-center lg:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                KUPON EKSKLUSIF & RILIS SERI BARU
              </span>
              <h3 className="font-condensed text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                GABUNG DENGAN KOMUNITAS ATLET REGARSPORT
              </h3>
              <p className="text-xs text-slate-400 max-w-lg">
                Dapatkan promo awal musim, undangan turnamen, dan diskon grosir jersey tim langsung ke email Anda.
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="w-full lg:w-auto flex-1 max-w-md flex items-center bg-white/10 rounded-full p-1.5 border border-white/15 focus-within:border-emerald-400 transition-colors"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Masukkan email kapten / manajer..."
                className="w-full bg-transparent px-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#FAF8F4] hover:bg-white text-[#111613] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105 cursor-pointer shadow"
              >
                <span>GABUNG</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          {newsletterSent && (
            <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs text-center animate-fade-in">
              Terima kasih! Email Anda telah terdaftar untuk voucher eksklusif RegarSport.
            </div>
          )}

          {/* 4 Multi-Column Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-slate-400">
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-8 bg-[#B9382B] rounded-b-lg flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">R</span>
                </div>
                <span className="font-condensed text-xl font-bold uppercase tracking-wider text-white">
                  PT REGARSPORT INDONESIA
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Pabrik manufaktur apparel olahraga digital modern pertama di Indonesia dengan jaminan garansi tukar ukuran resmi.
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                NPWP: 01.345.678.9-521.000 • Cicendo, Kota Bandung
              </div>
            </div>

            {/* Column 2: Katalog */}
            <div>
              <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white mb-3">
                KATALOG OLAHRAGA
              </h5>
              <ul className="space-y-2 text-[11px]">
                <li><Link to="/dashboard?categoryId=1" className="hover:text-white transition-colors">Jersey Sepakbola & Futsal</Link></li>
                <li><Link to="/dashboard?categoryId=2" className="hover:text-white transition-colors">Jersey Bola Voli Pro Liga</Link></li>
                <li><Link to="/dashboard?categoryId=3" className="hover:text-white transition-colors">Jersey Badminton Elite</Link></li>
                <li><Link to="/dashboard?categoryId=4" className="hover:text-white transition-colors">Custom Jersey Komunitas & Esport</Link></li>
                <li><Link to="/dashboard?categoryId=5" className="hover:text-white transition-colors">Jersey Basket & Streetball</Link></li>
              </ul>
            </div>

            {/* Column 3: Garansi & CS */}
            <div>
              <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white mb-3">
                GARANSI & LAYANAN
              </h5>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#keunggulan" className="hover:text-white transition-colors">Ketentuan Garansi Tukar Ukuran</a></li>
                <li><Link to="/dashboard/cart" className="hover:text-white transition-colors">Status Keranjang Belanja</Link></li>
                <li><Link to="/dashboard/my-orders" className="hover:text-white transition-colors">Lacak Pesanan & Resi</Link></li>
                <li><a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Customer Service</a></li>
                <li><Link to="/dashboard/about" className="hover:text-white transition-colors">Tentang Atelier Cicendo</Link></li>
              </ul>
            </div>

            {/* Column 4: Keamanan & Pembayaran */}
            <div className="space-y-3">
              <h5 className="font-condensed text-sm font-bold uppercase tracking-wider text-white">
                PEMBAYARAN & EKSPEDISI
              </h5>
              <p className="text-[11px] leading-relaxed">
                Didukung Midtrans Payment Gateway (QRIS, BCA, Mandiri, BRI, GoPay) serta kurir J&T Express, JNE, SiCepat dengan nomor resi terverifikasi.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Verified SSL 256-bit Secure Checkout</span>
              </div>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © {new Date().getFullYear()} PT RegarSport Indonesia. Hak Cipta Dilindungi Undang-Undang.
            </div>
            <div className="flex gap-4">
              <Link to="/dashboard/about" className="hover:text-white transition-colors">Tentang Perusahaan</Link>
              <span>•</span>
              <a href="#keunggulan" className="hover:text-white transition-colors">Kebijakan Retur & Garansi</a>
              <span>•</span>
              <span className="text-slate-600">Cicendo, Kota Bandung • Indonesia</span>
            </div>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE DRAWERS & MODALS */}
      {/* 1. Left Nav Drawer with Topographic Backdrop */}
      <NavDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Right Cart Slide-Over Drawer */}
      <CartSlideOver
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* 3. Visual Search Overlay Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
