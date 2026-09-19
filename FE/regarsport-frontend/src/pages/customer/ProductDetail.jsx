import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Ruler,
  Info,
  Shirt,
  Sparkles,
  Check,
  RotateCcw,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import JerseyPreviewMockup from "../../components/customer/JerseyPreviewMockup";

const getAvailableSizes = (prod) => {
  if (!prod) return ["L"];
  const catId = Number(prod.categoryId);
  const name = (prod.name || "").toLowerCase();
  const catName = (prod.categoryName || "").toLowerCase();

  // 1. Sepatu Olahraga (Cat 2 or name contains "sepatu")
  if (catId === 2 || catName.includes("sepatu") || name.includes("sepatu") || name.includes("shoes") || name.includes("boots")) {
    return ["39", "40", "41", "42", "43", "44", "45"];
  }

  // 2. Peralatan & Bola Olahraga (Cat 3)
  if (catId === 3 || name.includes("bola") || name.includes("ball") || name.includes("sarung") || name.includes("deker") || name.includes("guard")) {
    if (name.includes("basket")) {
      return ["Size 7 (Resmi)", "Size 6 (Remaja/Wanita)"];
    }
    if (name.includes("futsal")) {
      return ["Size 4 (Standar Futsal)"];
    }
    if (name.includes("bola") || name.includes("soccer")) {
      return ["Size 5 (Resmi FIFA)", "Size 4 (Junior)"];
    }
    if (name.includes("sarung") || name.includes("kiper") || name.includes("gloves")) {
      return ["Size 8", "Size 9", "Size 10", "Size 11"];
    }
    if (name.includes("deker") || name.includes("shin")) {
      return ["S", "M", "L"];
    }
    return ["Standar Resmi"];
  }

  // 3. Tas & Aksesoris Olahraga (Cat 5)
  if (catId === 5 || catName.includes("aksesoris") || catName.includes("tas") || name.includes("tas") || name.includes("botol") || name.includes("kaos kaki")) {
    if (name.includes("kaos kaki") || name.includes("socks")) {
      return ["All Size (39-44)"];
    }
    return ["All Size"];
  }

  // 4. Default: Jersey & Pakaian Olahraga (Cat 1 & 4)
  return ["S", "M", "L", "XL", "XXL", "3XL"];
};

const getDefaultSize = (sizes) => {
  if (!sizes || sizes.length === 0) return "L";
  if (sizes.includes("L")) return "L";
  if (sizes.includes("42")) return "42";
  return sizes[0];
};

const getProductType = (prod) => {
  if (!prod) return "clothing";
  const catId = Number(prod.categoryId);
  const name = (prod.name || "").toLowerCase();
  const catName = (prod.categoryName || "").toLowerCase();

  if (catId === 2 || catName.includes("sepatu") || name.includes("sepatu") || name.includes("shoes") || name.includes("boots")) {
    return "shoes";
  }
  if (catId === 3 || name.includes("bola") || name.includes("ball") || name.includes("sarung") || name.includes("deker") || name.includes("guard")) {
    return "equipment";
  }
  return "clothing";
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeWishlist, isWishlisted, getWishlistItemId } = useWishlist();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("L");
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState("clothing"); // clothing, shoes, equipment

  // Custom Jersey Sablon State
  const [isCustomJersey, setIsCustomJersey] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customCollar, setCustomCollar] = useState("O-Neck");
  const [customTeam, setCustomTeam] = useState("");
  const [jerseyPreviewView, setJerseyPreviewView] = useState("back"); // 'back' or 'front'

  const availableSizes = useMemo(() => {
    if (product?.sizeStocks && Object.keys(product.sizeStocks).length > 0) {
      return Object.keys(product.sizeStocks);
    }
    return getAvailableSizes(product);
  }, [product]);

  // Current stock for chosen size
  const currentSizeStock = useMemo(() => {
    if (product?.sizeStocks && selectedSize) {
      return Number(product.sizeStocks[selectedSize] ?? 0);
    }
    return Number(product?.stock ?? 0);
  }, [product, selectedSize]);

  const isCurrentSizeSoldOut = currentSizeStock <= 0;

  // Auto select size that has available stock
  useEffect(() => {
    if (product?.sizeStocks && Object.keys(product.sizeStocks).length > 0) {
      const entries = Object.entries(product.sizeStocks);
      const firstWithStock = entries.find(([_, s]) => Number(s) > 0);
      if (firstWithStock) {
        setSelectedSize(firstWithStock[0]);
      } else {
        setSelectedSize(entries[0][0]);
      }
    }
  }, [product]);

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error("Stok produk ini sedang habis");
      return;
    }
    if (isCurrentSizeSoldOut) {
      toast.error(`Ukuran ${selectedSize} sedang habis`);
      return;
    }
    if (qty > currentSizeStock) {
      toast.error(`Stok ukuran ${selectedSize} hanya tersisa ${currentSizeStock} buah`);
      return;
    }
    const customOptions = isCustomJersey ? {
      customName: customName.trim().toUpperCase() || null,
      customNumber: customNumber.trim() || null,
      customCollar: customCollar || "O-Neck",
      customTeam: customTeam.trim().toUpperCase() || null,
    } : null;

    addToCart(product, qty, selectedSize, customOptions);
  };

  const handleDirectBuy = () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk membeli");
      navigate("/login");
      return;
    }
    if (product.stock <= 0) {
      toast.error("Stok produk ini sedang habis");
      return;
    }
    if (isCurrentSizeSoldOut) {
      toast.error(`Ukuran ${selectedSize} sedang habis`);
      return;
    }
    if (qty > currentSizeStock) {
      toast.error(`Stok ukuran ${selectedSize} hanya tersisa ${currentSizeStock} buah`);
      return;
    }

    const directItem = {
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl || product.image_url || "",
      price: Number(product.price),
      quantity: Number(qty),
      size: selectedSize,
      customName: isCustomJersey && customName.trim() ? customName.trim().toUpperCase() : null,
      customNumber: isCustomJersey && customNumber.trim() ? customNumber.trim() : null,
      customCollar: isCustomJersey ? customCollar : null,
      customTeam: isCustomJersey && customTeam.trim() ? customTeam.trim().toUpperCase() : null,
    };

    navigate("/dashboard/checkout", {
      state: { directItem },
    });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null); // null = all, 'photos' = with photos, 1..5 = stars
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const getProduct = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/products/${id}`);
      const prodData = res.data?.data || res.data;
      setProduct(prodData);
      const sizes = getAvailableSizes(prodData);
      setSelectedSize(getDefaultSize(sizes));
      setActiveChartTab(getProductType(prodData));
    } catch (requestError) {
      console.log(requestError);
      setError("Produk tidak ditemukan atau gagal dimuat.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const getReviewSummary = async () => {
    try {
      const res = await api.get(`/products/${id}/reviews/summary`).catch(() => null);
      if (res?.data) {
        setReviewSummary(res.data?.data || res.data);
      }
    } catch {
      setReviewSummary(null);
    }
  };

  const getReviews = async (filter = selectedFilter) => {
    try {
      setReviewsLoading(true);
      const params = { size: 50 };
      if (filter === "photos") {
        params.withPhotos = true;
      } else if (typeof filter === "number") {
        params.rating = filter;
      }
      const res = await api.get(`/products/${id}/reviews`, { params }).catch(() => ({ data: { data: [] } }));
      const payload = res.data?.data;
      const list = Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload)
        ? payload
        : [];
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
    getReviewSummary();
  }, [id]);

  useEffect(() => {
    getReviews(selectedFilter);
  }, [id, selectedFilter]);

  // Lightbox keyboard shortcut listener
  useEffect(() => {
    if (!lightbox.open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightbox((l) => ({ ...l, open: false }));
      if (e.key === "ArrowRight") setLightbox((l) => ({ ...l, index: (l.index + 1) % l.images.length }));
      if (e.key === "ArrowLeft") setLightbox((l) => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox.open]);

  const averageRating = useMemo(() => {
    if (reviewSummary?.averageRating != null && Number(reviewSummary.averageRating) > 0) {
      return Number(reviewSummary.averageRating);
    }
    if (!reviews.length) {
      return 0;
    }
    return reviews.reduce((sum, item) => sum + Number(item.rating), 0) / reviews.length;
  }, [reviewSummary, reviews]);

  const totalReviewsCount = useMemo(() => {
    if (reviewSummary?.totalReviews != null) {
      return Number(reviewSummary.totalReviews);
    }
    return reviews.length;
  }, [reviewSummary, reviews]);

  const totalWithPhotos = useMemo(() => {
    if (reviewSummary?.totalWithPhotos != null) {
      return Number(reviewSummary.totalWithPhotos);
    }
    return reviews.filter((r) => r.images && r.images.length > 0).length;
  }, [reviewSummary, reviews]);

  const breakdown = useMemo(() => {
    const map = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviewSummary?.breakdown) {
      Object.entries(reviewSummary.breakdown).forEach(([k, v]) => {
        map[Number(k)] = Number(v) || 0;
      });
      return map;
    }
    reviews.forEach((r) => {
      const star = Number(r.rating) || 5;
      map[star] = (map[star] || 0) + 1;
    });
    return map;
  }, [reviewSummary, reviews]);

  const satisfactionRate = useMemo(() => {
    if (!totalReviewsCount) return 100;
    const satisfied = (breakdown[5] || 0) + (breakdown[4] || 0);
    return Math.min(100, Math.round((satisfied / totalReviewsCount) * 100));
  }, [breakdown, totalReviewsCount]);

  if (loading) {
    return <ScreenLoader label="Memuat detail produk..." />;
  }

  if (error) {
    return <EmptyState title="Detail produk gagal dimuat" description={error} />;
  }

  if (!product) {
    return <EmptyState title="Produk tidak tersedia" description="Produk yang Anda cari tidak ditemukan." />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="group aspect-square overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={product.imageUrl || product.image_url || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80"}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80";
              }}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={15} className="fill-current" />
                <span className="font-semibold text-slate-700">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-slate-300">•</span>
              <span>{totalReviewsCount} ulasan</span>
              {totalReviewsCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600 font-semibold">{satisfactionRate}% pembeli puas</span>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-bold text-emerald-600">
                Rp {Number(product.price).toLocaleString("id-ID")}
              </p>

              {product.stock === 0 ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Stok Habis
                </span>
              ) : product.stock <= 5 ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                  Sisa {product.stock}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  Stok Tersedia
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-slate-400">Stok: {product.stock}</p>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Deskripsi</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{product.description}</p>
            </div>

            {/* Size Selection Section */}
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pilihan Ukuran:
                  </span>
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-black shadow-xs ${
                    isCurrentSizeSoldOut ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {selectedSize} {isCurrentSizeSoldOut && '(Habis)'}
                  </span>
                </div>

                {/* Panduan Ukuran Button */}
                <button
                  type="button"
                  onClick={() => setShowSizeChart(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100/80 active:scale-95 shadow-2xs"
                >
                  <Ruler size={14} className="text-emerald-600" />
                  <span>Panduan Ukuran 📏</span>
                </button>
              </div>

              {/* Size Buttons with Dynamic Stock Indicators */}
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  const szStock = product?.sizeStocks ? Number(product.sizeStocks[sz] ?? 0) : (product?.stock ?? 0);
                  const isSzSoldOut = szStock <= 0;
                  const isSzLow = szStock > 0 && szStock < 5;

                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`relative h-11 min-w-12 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? isSzSoldOut
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500/20"
                            : "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20"
                          : isSzSoldOut
                          ? "bg-slate-100 text-slate-400 border border-dashed border-slate-300 opacity-60"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30"
                      }`}
                    >
                      <span className={isSzSoldOut ? "line-through" : ""}>{sz}</span>
                      {isSzSoldOut ? (
                        <span className="text-[9px] font-black text-rose-500 tracking-tighter uppercase leading-none mt-0.5">
                          Habis
                        </span>
                      ) : isSzLow ? (
                        <span className={`text-[8px] font-bold tracking-tighter leading-none mt-0.5 ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>
                          Sisa {szStock}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Size Stock Feedback Banner */}
              {isCurrentSizeSoldOut ? (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Ukuran <strong>{selectedSize}</strong> saat ini habis. Silakan pilih varian ukuran lain yang masih tersedia.</span>
                </div>
              ) : (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    Stok varian <strong>{selectedSize}</strong>: <strong>{currentSizeStock} pcs</strong> tersedia
                  </span>
                  {currentSizeStock < 5 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      Segera Habis!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Kustomisasi Jersey Builder (DNA Khas RegarSport) */}
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 p-4 sm:p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                    <Shirt size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        Kustomisasi Sablon Jersey
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                        FREE SUBLIMASI
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cetak nama punggung, nomor punggung, kerah, &amp; nama tim langsung dari pabrik Wonogiri.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={isCustomJersey}
                    onChange={(e) => {
                      setIsCustomJersey(e.target.checked);
                      if (e.target.checked && !customName && user?.fullName) {
                        setCustomName(user.fullName.split(" ")[0].toUpperCase());
                        setCustomNumber("10");
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {isCustomJersey && (
                <div className="mt-5 pt-4 border-t border-emerald-200/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {/* Kolom Form Input */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Nama Punggung (Nameset):
                        </label>
                        <input
                          type="text"
                          maxLength={14}
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                          placeholder="CONTOH: DUJANAH"
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Maksimal 14 karakter huruf kapital
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Nomor Punggung:
                          </label>
                          <input
                            type="text"
                            maxLength={2}
                            value={customNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setCustomNumber(val);
                            }}
                            placeholder="10"
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-center shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Model Kerah:
                          </label>
                          <select
                            value={customCollar}
                            onChange={(e) => setCustomCollar(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 shadow-2xs"
                          >
                            <option value="O-Neck">O-Neck (Bulat)</option>
                            <option value="V-Neck">V-Neck (Lancip)</option>
                            <option value="Kerah Polo">Kerah Polo</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Nama Tim / Komunitas (Opsional):
                        </label>
                        <input
                          type="text"
                          maxLength={24}
                          value={customTeam}
                          onChange={(e) => setCustomTeam(e.target.value.toUpperCase())}
                          placeholder="CONTOH: WONOGIRI UNITED"
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Kolom Live Photorealistic Jersey Mockup (Realistis Sesuai Produk) */}
                    <div className="w-full">
                      <JerseyPreviewMockup
                        productImage={product.imageUrl}
                        productName={product.name}
                        customName={customName}
                        customNumber={customNumber}
                        customCollar={customCollar}
                        customTeam={customTeam}
                        selectedSize={selectedSize}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Jumlah:
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => qty > 1 && setQty(qty - 1)}
                    disabled={qty <= 1 || isCurrentSizeSoldOut}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 cursor-pointer"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="min-w-12 text-center text-lg font-bold text-slate-900">{isCurrentSizeSoldOut ? 0 : qty}</span>

                  <button
                    type="button"
                    onClick={() => qty < currentSizeStock && setQty(qty + 1)}
                    disabled={qty >= currentSizeStock || isCurrentSizeSoldOut}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 cursor-pointer"
                    aria-label="Tambah jumlah"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {!isCurrentSizeSoldOut && currentSizeStock > 0 && (
                  <span className="text-xs text-slate-500">
                    Maks. {currentSizeStock} pcs
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (isWishlisted(product.id)) {
                    await removeWishlist(getWishlistItemId(product.id));
                  } else {
                    await addToWishlist(product);
                  }
                }}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              >
                <Heart
                  size={18}
                  className={isWishlisted(product.id) ? "fill-rose-500 text-rose-500" : ""}
                />
                {isWishlisted(product.id) ? "Hapus Wishlist" : "Wishlist"}
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || isCurrentSizeSoldOut}
                className={`flex items-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isCurrentSizeSoldOut
                    ? 'border-slate-300 bg-slate-100 text-slate-400'
                    : 'border-emerald-600 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                }`}
              >
                <ShoppingCart size={18} />
                {isCurrentSizeSoldOut ? `Ukuran ${selectedSize} Habis` : '+ Keranjang'}
              </button>

              <button
                type="button"
                onClick={handleDirectBuy}
                disabled={product.stock <= 0 || isCurrentSizeSoldOut}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40 cursor-pointer"
              >
                <Zap size={18} />
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200/60">
                  <Star size={18} className="fill-current" />
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  ULASAN & PENILAIAN PEMBELI
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Ulasan resmi dari pelanggan yang telah menerima dan menyelesaikan pesanan produk ini.
              </p>
            </div>

            {totalReviewsCount > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 px-4 py-2 text-xs font-bold text-emerald-800">
                <ThumbsUp size={15} className="text-emerald-600" />
                <span>{satisfactionRate}% Pembeli Puas</span>
              </div>
            )}
          </div>

          {/* Tokopedia/Shopee Style Rating Overview Card */}
          <div className="mb-8 grid gap-6 rounded-3xl border border-slate-100 bg-slate-50/60 p-6 md:grid-cols-12 md:items-center">
            {/* Left: Big Score & Stars */}
            <div className="flex flex-col items-center justify-center text-center border-b border-slate-200/70 pb-6 md:col-span-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900 tracking-tight">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-slate-400">/ 5.0</span>
              </div>

              <div className="mt-2.5 flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    size={20}
                    className={idx < Math.round(averageRating) ? "fill-amber-400" : "text-slate-200"}
                  />
                ))}
              </div>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                {totalReviewsCount > 0
                  ? `Berdasarkan ${totalReviewsCount} ulasan pembeli`
                  : "Belum ada penilaian ulasan"}
              </p>
            </div>

            {/* Right: Star Progress Bars */}
            <div className="space-y-2 md:col-span-8 md:pl-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                const isSelected = selectedFilter === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedFilter(isSelected ? null : star)}
                    className={`w-full flex items-center gap-3 text-xs font-semibold rounded-xl px-2.5 py-1.5 transition text-left ${
                      isSelected
                        ? "bg-emerald-100/70 ring-1 ring-emerald-500/40"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-1 w-16 text-slate-700 shrink-0">
                      <span>{star}</span>
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                    </div>

                    <div className="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-16 text-right text-slate-400 font-mono text-[11px] shrink-0">
                      {count} ({percentage}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedFilter(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                selectedFilter === null
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({totalReviewsCount})
            </button>

            {/* Pill Dengan Foto (Tokopedia / Shopee Style) */}
            <button
              type="button"
              onClick={() => setSelectedFilter(selectedFilter === "photos" ? null : "photos")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                selectedFilter === "photos"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Camera size={13} />
              <span>Dengan Foto ({totalWithPhotos})</span>
            </button>

            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedFilter(selectedFilter === star ? null : star)}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                  selectedFilter === star
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{star} Bintang</span>
                <span className="text-[10px] opacity-75">({breakdown[star] || 0})</span>
              </button>
            ))}
          </div>

          {/* Trust Banner (Verified Buyers Only) */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs text-emerald-950">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">Ulasan Terverifikasi Pembeli:</span>
                <span className="text-slate-600 ml-1">
                  Seluruh testimoni hanya dapat dibuat oleh pembeli resmi setelah menerima pesanan untuk memastikan keaslian ulasan.
                </span>
              </div>
            </div>
            <Link
              to="/dashboard/my-orders"
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 shrink-0 hover:underline"
            >
              <span>Pesanan Saya</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Review List */}
          {reviewsLoading ? (
            <ScreenLoader label="Memuat ulasan pembeli..." />
          ) : reviews.length === 0 ? (
            <EmptyState
              title={
                selectedFilter === "photos"
                  ? "Belum ada ulasan dengan foto"
                  : typeof selectedFilter === "number"
                  ? `Tidak ada ulasan ${selectedFilter} bintang`
                  : "Belum Ada Ulasan"
              }
              description={
                selectedFilter === "photos"
                  ? "Belum ada pembeli yang melampirkan foto produk untuk ulasan ini."
                  : typeof selectedFilter === "number"
                  ? "Belum ada pembeli yang memberikan rating bintang ini."
                  : "Jadilah yang pertama memesan dan memberikan ulasan untuk jersey ini!"
              }
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const customerName = review.customerName || review.users?.full_name || "Pelanggan RegarSport";
                const customerAvatar = review.customerAvatar || review.users?.avatar_url;
                const reviewDate = review.createdAt || review.created_at;
                const replies = review.review_replies || review.replies || [];
                const images = Array.isArray(review.images) ? review.images : [];

                return (
                  <div
                    key={review.id}
                    className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs transition hover:border-slate-200 hover:shadow-sm sm:p-6"
                  >
                    {/* Buyer Header */}
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200/80 shrink-0">
                          {customerAvatar ? (
                            <img
                              src={customerAvatar}
                              alt={customerName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            customerName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{customerName}</h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle2 size={11} />
                              Pembeli Terverifikasi
                            </span>
                          </div>

                          {reviewDate && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(reviewDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={15}
                            className={index < Number(review.rating) ? "fill-current" : "text-slate-200"}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment Body */}
                    <p className="leading-relaxed text-slate-700 text-sm pl-1">{review.comment}</p>

                    {/* Customer Photo Attachments (Cloudinary Thumbnails) */}
                    {images.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-2.5 pl-1">
                        {images.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() =>
                              setLightbox({
                                open: true,
                                images,
                                index: imgIdx,
                              })
                            }
                            className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition-all hover:scale-105 active:scale-95 group shadow-xs shrink-0"
                            title="Klik untuk memperbesar foto ulasan"
                          >
                            <img
                              src={imgUrl}
                              alt={`Foto ulasan ${imgIdx + 1}`}
                              className="h-full w-full object-cover group-hover:scale-110 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Official Seller Reply */}
                    {replies && replies.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <ShieldCheck size={15} className="text-emerald-600" />
                            <span>Respon Penjual: {replies[0].admin_name || "Admin RegarSport"}</span>
                          </div>
                          {replies[0].created_at && (
                            <span className="text-[10px] text-emerald-700/60 font-medium">
                              {new Date(replies[0].created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed pl-5">{replies[0].reply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lightbox / Fullscreen Image Zoom Modal */}
        {lightbox.open && lightbox.images.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setLightbox({ open: false, images: [], index: 0 })}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightbox({ open: false, images: [], index: 0 })}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
                title="Tutup (Esc)"
              >
                <X size={24} />
              </button>

              {/* Main Display Image */}
              <img
                src={lightbox.images[lightbox.index]}
                alt={`Foto Ulasan ${lightbox.index + 1}`}
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/15"
              />

              {/* Footer Controls */}
              <div className="mt-4 flex items-center justify-between w-full text-white/80 text-xs px-2">
                <span className="font-medium">
                  Foto {lightbox.index + 1} dari {lightbox.images.length}
                </span>

                {lightbox.images.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox((l) => ({
                          ...l,
                          index: (l.index - 1 + l.images.length) % l.images.length,
                        }))
                      }
                      className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition active:scale-95"
                      title="Foto Sebelumnya"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox((l) => ({
                          ...l,
                          index: (l.index + 1) % l.images.length,
                        }))
                      }
                      className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition active:scale-95"
                      title="Foto Berikutnya"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panduan Ukuran (Size Chart) Modal */}
        {showSizeChart && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowSizeChart(false)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs shrink-0">
                    <Ruler size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Panduan Ukuran (Size Chart) 📏
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Standar ukuran resmi RegarSport untuk performa dan kenyamanan optimal.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSizeChart(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Tutup (Esc)"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Category Tabs inside Modal */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setActiveChartTab("clothing")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeChartTab === "clothing"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👕 Jersey & Pakaian
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("shoes")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeChartTab === "shoes"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👟 Sepatu Olahraga
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("equipment")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeChartTab === "equipment"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⚽ Bola & Aksesoris
                </button>
              </div>

              {/* Tab 1: Clothing / Jersey */}
              {activeChartTab === "clothing" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Ukuran</th>
                          <th className="p-3.5">Lebar Dada (cm)</th>
                          <th className="p-3.5">Panjang Baju (cm)</th>
                          <th className="p-3.5">Rekomendasi TB (cm)</th>
                          <th className="p-3.5">Rekomendasi BB (kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {[
                          { size: "S", chest: "48", length: "68", tb: "155 - 165", bb: "50 - 60" },
                          { size: "M", chest: "50", length: "70", tb: "160 - 170", bb: "58 - 68" },
                          { size: "L", chest: "52", length: "72", tb: "168 - 178", bb: "65 - 78" },
                          { size: "XL", chest: "54", length: "74", tb: "175 - 185", bb: "75 - 88" },
                          { size: "XXL", chest: "56", length: "76", tb: "180 - 190", bb: "85 - 98" },
                          { size: "3XL", chest: "58", length: "78", tb: "185 - 195", bb: "95 - 110" },
                        ].map((row) => (
                          <tr
                            key={row.size}
                            className={`transition hover:bg-emerald-50/40 ${
                              selectedSize === row.size ? "bg-emerald-50/80 font-bold text-emerald-900" : ""
                            }`}
                          >
                            <td className="p-3.5 font-bold flex items-center gap-1.5">
                              <span>{row.size}</span>
                              {selectedSize === row.size && (
                                <span className="rounded-full bg-emerald-600 text-white text-[9px] px-1.5 py-0.5">
                                  Pilihan Anda
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">{row.chest} cm</td>
                            <td className="p-3.5">{row.length} cm</td>
                            <td className="p-3.5">{row.tb} cm</td>
                            <td className="p-3.5">{row.bb} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <Info size={14} className="text-amber-600" />
                      Tips Pengukuran Jersey & Pakaian:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Ukur <strong>Lebar Dada</strong> dari bawah ketiak kiri ke ketiak kanan secara mendatar pada baju yang pas Anda pakai.</li>
                      <li>Toleransi jahit manual sekitar <strong>&plusmn; 1-2 cm</strong>.</li>
                      <li>Untuk gaya <em>loose fit</em> atau bernapas lega saat berolahraga, Anda dapat memilih 1 tingkat di atas ukuran standar.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Shoes */}
              {activeChartTab === "shoes" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Size (EU)</th>
                          <th className="p-3.5">Panjang Kaki (cm)</th>
                          <th className="p-3.5">US Men</th>
                          <th className="p-3.5">UK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {[
                          { eu: "39", cm: "24.5", us: "6.5", uk: "5.5" },
                          { eu: "40", cm: "25.0", us: "7.0", uk: "6.0" },
                          { eu: "41", cm: "26.0", us: "8.0", uk: "7.0" },
                          { eu: "42", cm: "26.5", us: "8.5", uk: "7.5" },
                          { eu: "43", cm: "27.5", us: "9.5", uk: "8.5" },
                          { eu: "44", cm: "28.0", us: "10.0", uk: "9.0" },
                          { eu: "45", cm: "29.0", us: "11.0", uk: "10.0" },
                        ].map((row) => (
                          <tr
                            key={row.eu}
                            className={`transition hover:bg-emerald-50/40 ${
                              selectedSize === row.eu ? "bg-emerald-50/80 font-bold text-emerald-900" : ""
                            }`}
                          >
                            <td className="p-3.5 font-bold flex items-center gap-1.5">
                              <span>EU {row.eu}</span>
                              {selectedSize === row.eu && (
                                <span className="rounded-full bg-emerald-600 text-white text-[9px] px-1.5 py-0.5">
                                  Pilihan Anda
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">{row.cm} cm</td>
                            <td className="p-3.5">{row.us}</td>
                            <td className="p-3.5">{row.uk}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <Info size={14} className="text-amber-600" />
                      Tips Pengukuran Telapak Kaki:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Letakkan tumit merapat ke dinding di atas selembar kertas putih tegak lurus.</li>
                      <li>Tandai ujung jari kaki terpanjang Anda dengan pensil.</li>
                      <li>Ukur jaraknya dan tambahkan <strong>0.5 cm</strong> untuk kenyamanan saat menggunakan kaos kaki olahraga tebal.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 3: Equipment */}
              {activeChartTab === "equipment" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <span className="inline-block rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 mb-1.5">
                        Sepakbola Lapangan Besar
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Bola Size 5 (Resmi FIFA)</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Keliling 68-70 cm, berat 410-450 gr. Standar kompetisi usia 12 tahun ke atas hingga dewasa profesional.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <span className="inline-block rounded-lg bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 mb-1.5">
                        Futsal & Indoor
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Bola Size 4 (Standar Futsal)</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Keliling 62-64 cm, berat 400-440 gr. Pantulan rendah (low bounce) khusus lapangan indoor/sintetis.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <span className="inline-block rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 mb-1.5">
                        Bola Basket
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Size 7 (Pria) & Size 6 (Wanita)</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Size 7 standar resmi kompetisi pria SMA/kuliah/FIBA. Size 6 untuk wanita & remaja usia 12-14 tahun.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <span className="inline-block rounded-lg bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 mb-1.5">
                        Sarung Tangan Kiper & Deker
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Size 8 - 11 & Shin Guard M/L</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Size 8 (telapak 18cm), Size 9 (telapak 19cm), Size 10 (telapak 20cm). Deker M (&lt;170cm), L (&gt;170cm).
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 mb-1">Aksesoris & Tas Olahraga:</p>
                    <p className="text-[11px] leading-relaxed">
                      Kategori tas ransel gym, duffle bag, kaos kaki, dan botol minum RegarSport berukuran <strong>All Size</strong> yang dirancang universal dan ergonomis.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSizeChart(false)}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95"
                >
                  Tutup Panduan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}