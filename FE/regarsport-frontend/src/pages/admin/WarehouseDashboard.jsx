/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Barcode,
  Layers,
  Search,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import { ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scanCode, setScanCode] = useState("");

  const [orderMetrics, setOrderMetrics] = useState({
    paidOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    recentPaid: [],
  });

  const [stockMetrics, setStockMetrics] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockList: [],
  });

  const fetchWarehouseOverview = async () => {
    try {
      setLoading(true);
      const [ordersRes, prodsRes] = await Promise.all([
        api.get("/orders", { params: { size: 100 } }).catch(() => ({ data: { data: [] } })),
        api.get("/products", { params: { size: 100 } }).catch(() => ({ data: { data: [] } })),
      ]);

      const orderList = ordersRes.data?.data?.content || ordersRes.data?.data || ordersRes.data || [];
      const prodList = prodsRes.data?.data?.content || prodsRes.data?.data || prodsRes.data || [];

      let paid = 0;
      let proc = 0;
      let ship = 0;
      let comp = 0;
      const recentPaid = [];

      orderList.forEach((o) => {
        const s = (o.status || "").toUpperCase();
        if (s === "PAID") {
          paid++;
          if (recentPaid.length < 5) recentPaid.push(o);
        } else if (s === "PROCESSING") proc++;
        else if (s === "SHIPPED") ship++;
        else if (s === "COMPLETED") comp++;
      });

      let low = 0;
      let out = 0;
      const lowList = [];

      prodList.forEach((p) => {
        const stk = Number(p.stock || 0);
        if (stk === 0) {
          out++;
          if (lowList.length < 5) lowList.push(p);
        } else if (stk <= 10) {
          low++;
          if (lowList.length < 5) lowList.push(p);
        }
      });

      setOrderMetrics({
        paidOrders: paid,
        processingOrders: proc,
        shippedOrders: ship,
        completedOrders: comp,
        recentPaid,
      });

      setStockMetrics({
        totalProducts: prodList.length,
        lowStockCount: low,
        outOfStockCount: out,
        lowStockList: lowList,
      });
    } catch (err) {
      console.error("Gagal memuat overview gudang:", err);
      toast.error("Gagal memuat ringkasan gudang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouseOverview();
  }, []);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    navigate(`/admin/orders?search=${encodeURIComponent(scanCode.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
            <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
              <Truck size={28} className="text-[#00BFA5]" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-[-1px]">
              DASHBOARD LOGISTIK GUDANG
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Pusat monitoring operasional pengemasan, cetak label thermal, dan stok fisik PT RegarSport Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchWarehouseOverview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Segarkan Status</span>
          </button>
        </div>
      </div>

      {/* QUICK BARCODE / RESI SCANNER INPUT */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14141E] via-[#1A1A28] to-[#14141E] border border-white/10 shadow-xl">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#00BFA5] uppercase tracking-wider mb-2">
            <Barcode size={16} />
            <span>Pencarian Cepat / Scan Barcode Resi Gudang</span>
          </div>
          <form onSubmit={handleScanSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Scan barcode nomor resi atau ketik kode order (contoh: REGAR-178...)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0D0D0D] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#00BFA5] text-black font-extrabold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#00BFA5]/25 transition-all shrink-0 cursor-pointer"
            >
              Lacak Paket
            </button>
          </form>
        </div>
      </div>

      {/* 4 OPERATIONAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paid / Packing Needed */}
        <Link
          to="/admin/orders"
          className="p-5 rounded-2xl bg-[#14141E] border border-emerald-500/30 hover:border-emerald-500/60 transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span>Perlu Dikemas</span>
            <Package size={18} />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">{orderMetrics.paidOrders} Paket</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Siap cetak label thermal</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Processing */}
        <Link
          to="/admin/orders"
          className="p-5 rounded-2xl bg-[#14141E] border border-blue-500/30 hover:border-blue-500/60 transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-wider">
            <span>Sedang Diproses</span>
            <Clock size={18} />
          </div>
          <div className="text-3xl font-black text-blue-400 mt-2">{orderMetrics.processingOrders} Paket</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Dalam antrean gudang</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Shipped */}
        <Link
          to="/admin/orders"
          className="p-5 rounded-2xl bg-[#14141E] border border-purple-500/30 hover:border-purple-500/60 transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider">
            <span>Diserahkan ke Kurir</span>
            <Truck size={18} />
          </div>
          <div className="text-3xl font-black text-purple-400 mt-2">{orderMetrics.shippedOrders} Paket</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Dalam perjalanan ekspedisi</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Low Stock Warning */}
        <Link
          to="/admin/inventory"
          className="p-5 rounded-2xl bg-[#14141E] border border-amber-500/30 hover:border-amber-500/60 transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>Peringatan Stok Menipis</span>
            <AlertTriangle size={18} />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {stockMetrics.lowStockCount + stockMetrics.outOfStockCount} Model
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Buka inventaris & restock</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 2 COLUMN CONTENT: ORDERS QUEUE & LOW STOCK HIGHLIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Antrean Paket Siap Kemas */}
        <div className="p-6 rounded-2xl bg-[#14141E] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-[#00BFA5]" />
              <h3 className="text-base font-bold text-white">Antrean Siap Kirim (Lunas)</h3>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-[#00BFA5] hover:underline flex items-center gap-1"
            >
              <span>Semua Antrean</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {orderMetrics.recentPaid.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Semua paket lunas telah dipacking dan diserahkan ke kurir!
            </div>
          ) : (
            <div className="space-y-3">
              {orderMetrics.recentPaid.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4 hover:bg-white/[0.05] transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{order.orderNumber}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Penerima: {order.recipientName || order.customerName} ({order.shippingCity || "-"})
                    </div>
                  </div>
                  <Link
                    to="/admin/orders"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-500/20"
                  >
                    Packing & Resi
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Peringatan Stok Menipis */}
        <div className="p-6 rounded-2xl bg-[#14141E] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h3 className="text-base font-bold text-white">Produk Stok Kritis / Kosong</h3>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-bold text-[#00BFA5] hover:underline flex items-center gap-1"
            >
              <span>Kelola Stok</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {stockMetrics.lowStockList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Seluruh stok fisik varian apparel dalam status aman!
            </div>
          ) : (
            <div className="space-y-3">
              {stockMetrics.lowStockList.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&q=80"}
                      alt={prod.name}
                      className="w-10 h-10 rounded-lg object-cover bg-black/40"
                    />
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{prod.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Kategori: {prod.category?.name || "Apparel"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs font-black ${prod.stock === 0 ? "text-rose-400" : "text-amber-400"}`}>
                      {prod.stock === 0 ? "Habis (0)" : `${prod.stock} pcs`}
                    </div>
                    <Link
                      to="/admin/inventory"
                      className="text-[10px] text-[#00BFA5] hover:underline font-bold mt-0.5 block"
                    >
                      + Tambah Stok
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
