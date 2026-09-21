/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutGrid,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  X,
} from "lucide-react";

import api from "../../services/api";
import {
  EmptyState,
  SectionSkeletonGrid,
} from "../../components/common/UiStates";

const ProductCard = memo(function ProductCard({ product }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl || product.image_url || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80"}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
          }}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {product.stock === 0 ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-white">
            Stok Habis
          </span>
        ) : product.stock <= 5 ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            Sisa {product.stock}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="line-clamp-2 font-semibold text-slate-900">{product.name}</h2>

        <p className="mt-2 text-lg font-bold text-emerald-600">
          Rp {Number(product.price).toLocaleString("id-ID")}
        </p>

        <p className="mt-1 text-sm text-slate-400">Stok: {product.stock}</p>

        <Link
          to={`/dashboard/product/${product.id}`}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-950 py-2.5 text-sm font-semibold text-white transition group-hover:gap-2.5 hover:bg-emerald-900"
        >
          Lihat Detail
          <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
});

export default function Home() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("categoryId") || searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const searchTimerRef = useRef(null);
  const shopSectionRef = useRef(null);


  const getProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/products", {
        params: {
          search: debouncedSearch,
          categoryId: categoryId || undefined,
          category_id: categoryId || undefined,
          page,
          size: 12,
          limit: 12,
        },
      });

      const raw = res.data?.data;
      const productList = Array.isArray(raw) ? raw : (raw?.content || []);
      setProducts(productList);
      setTotalPages(raw?.totalPages || res.data?.meta?.totalPages || 1);
    } catch (requestError) {
      console.log(requestError);
      setError("Gagal memuat produk. Silakan coba lagi.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  useEffect(() => {
    getProducts();
  }, [debouncedSearch, categoryId, page]);

  useEffect(() => {
    const cat = searchParams.get("categoryId") || searchParams.get("category") || "";
    const q = searchParams.get("search") || "";
    if (cat !== categoryId) {
      setCategoryId(cat);
      setPage(1);
    }
    if (q !== search) {
      setSearch(q);
      setDebouncedSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await api.get("/categories");
        const categoryList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCategories(categoryList);
      } catch (categoryError) {
        console.log(categoryError);
      }
    };

    getCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    );

    // Filter Rentang Harga
    if (priceRange === "under_100k") {
      list = list.filter((p) => Number(p.price) < 100000);
    } else if (priceRange === "100k_250k") {
      list = list.filter((p) => Number(p.price) >= 100000 && Number(p.price) <= 250000);
    } else if (priceRange === "above_250k") {
      list = list.filter((p) => Number(p.price) > 250000);
    }

    // Pengurutan (Sorting)
    if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "name_asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    }

    return list;
  }, [products, search, priceRange, sortBy]);


  const scrollToShop = () => {
    shopSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden bg-emerald-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-emerald-100">
                <TrendingUp size={13} className="text-emerald-300" />
                Belanja Online Terpercaya
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-emerald-100">
                <Sparkles size={13} className="text-emerald-300" />
                Produk Pilihan Berkualitas
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Lengkapi Kebutuhan Olahraga Anda
              <span className="block text-emerald-400">dengan Produk Pilihan Terbaik</span>
            </h1>

            <p className="mt-5 max-w-xl leading-relaxed text-emerald-50/70">
              Temukan peralatan, pakaian, dan aksesori olahraga berkualitas tinggi untuk
              menunjang performa terbaik Anda setiap hari.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-2.5 text-sm text-emerald-50/90">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Truck size={16} className="text-emerald-300" />
                </span>
                Pengiriman ke seluruh Indonesia
              </div>

              <div className="flex items-center gap-2.5 text-sm text-emerald-50/90">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <ShieldCheck size={16} className="text-emerald-300" />
                </span>
                Garansi resmi setiap produk
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToShop}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-50"
              >
                Belanja Sekarang
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={scrollToShop}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Lihat Kategori
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" />

            <div className="relative space-y-5 rounded-2xl border border-white/10 bg-white/4 p-6 backdrop-blur sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Package size={22} className="text-emerald-300" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white">500+</p>
                  <p className="text-sm text-emerald-50/60">Produk tersedia</p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Users size={22} className="text-emerald-300" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white">10rb+</p>
                  <p className="text-sm text-emerald-50/60">Pelanggan puas</p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                  <ShieldCheck size={22} className="text-emerald-300" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-sm text-emerald-50/60">Produk original</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
        {/* Floating search & filter card */}
        <div
          ref={shopSectionRef}
          className="relative -mt-10 mb-10 scroll-mt-24 rounded-2xl bg-white p-5 shadow-xl shadow-emerald-950/10 ring-1 ring-slate-900/5 sm:-mt-14 sm:p-6"
        >
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk olahraga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setCategoryId("");
              }}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                categoryId === ""
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              <LayoutGrid size={14} />
              Semua Kategori
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setPage(1);
                  setCategoryId(category.id);
                }}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                  categoryId === category.id
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <Truck size={18} className="text-emerald-600" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Pengiriman Cepat</p>
              <p className="mt-0.5 text-sm text-slate-500">Dikirim ke seluruh Indonesia tepat waktu.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <ShieldCheck size={18} className="text-emerald-600" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Garansi Resmi</p>
              <p className="mt-0.5 text-sm text-slate-500">Setiap produk bergaransi resmi.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CreditCard size={18} className="text-emerald-600" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Pembayaran Aman</p>
              <p className="mt-0.5 text-sm text-slate-500">Berbagai metode pembayaran terpercaya.</p>
            </div>
          </div>
        </div>

        {/* Product section header & toolbar */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Koleksi Produk</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Memuat produk..."
                : error
                ? "Terjadi kendala saat memuat produk"
                : `${filteredProducts.length} produk siap dipesan`}
            </p>
          </div>

          {/* Filter & Sort Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Price Range Pills */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs">
              {[
                { id: "all", label: "Semua Harga" },
                { id: "under_100k", label: "< 100rb" },
                { id: "100k_250k", label: "100rb - 250rb" },
                { id: "above_250k", label: "> 250rb" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setPriceRange(pill.id)}
                  className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                    priceRange === pill.id
                      ? "bg-white text-emerald-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs">
              <SlidersHorizontal size={13} className="text-slate-400" />
              <span className="font-medium text-slate-500">Urut:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="default">Paling Sesuai</option>
                <option value="price_asc">Harga: Termurah</option>
                <option value="price_desc">Harga: Termahal</option>
                <option value="name_asc">Nama: A - Z</option>
                <option value="name_desc">Nama: Z - A</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(priceRange !== "all" || sortBy !== "default" || search) && (
              <button
                type="button"
                onClick={() => {
                  setPriceRange("all");
                  setSortBy("default");
                  setSearch("");
                }}
                className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                title="Reset Semua Filter"
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {error ? (
          <EmptyState
            title="Data produk gagal dimuat"
            description={error}
            action={
              <button
                type="button"
                onClick={getProducts}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <RotateCcw size={16} />
                Coba Lagi
              </button>
            }
          />
        ) : loading ? (
          <SectionSkeletonGrid />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description={
              search
                ? "Coba ubah kata kunci pencarian Anda."
                : "Belum ada produk yang tersedia saat ini."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 ? (
          <div className="mt-12 flex items-center justify-center gap-3 sm:mt-16">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="rounded-full bg-emerald-950 px-5 py-2 text-sm font-semibold text-white">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((currentPage) => Math.min(currentPage + 1, totalPages))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}