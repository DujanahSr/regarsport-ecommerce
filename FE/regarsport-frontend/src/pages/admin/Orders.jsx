/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// FRONTEND/src/pages/admin/Orders.jsx

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Download,
  Filter,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Truck,
  X,
  PackageCheck,
  Printer,
  Search,
  Scan,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";
import ShippingLabelModal from "../../components/admin/ShippingLabelModal";
import BulkShippingLabelModal from "../../components/admin/BulkShippingLabelModal";
import { useAuth } from "../../context/AuthContext";

const orderStatuses = ["pending", "paid", "processing", "shipped", "completed", "cancelled"];

const courierList = [
  "J&T Express",
  "JNE Reguler",
  "SiCepat Ekspres",
  "Anteraja",
  "Pos Indonesia",
  "ID Express",
  "Ninja Xpress"
];

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function Orders() {
  const { user } = useAuth();
  const isLogistics = user?.role === "logistics";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Search & Barcode Scan State
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk Selection & Print State
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Ship Modal State
  const [shippingOrder, setShippingOrder] = useState(null);
  const [courier, setCourier] = useState(courierList[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingSubmitting, setShippingSubmitting] = useState(false);

  // Label Thermal Modal State
  const [labelOrder, setLabelOrder] = useState(null);

  const getOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        params: {
          status: statusFilter ? statusFilter.toUpperCase() : undefined,
          page,
          size: 10,
        },
      });
      const pageData = res.data?.data || res.data;
      const list = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData)
        ? pageData
        : [];
      setOrders(list);
      setTotalPages(pageData?.totalPages || 1);
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    getOrders();
    setSelectedOrderIds([]);
  }, [getOrders]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      const orderNum = (order.orderNumber || `#${order.id}`).toLowerCase();
      const tracking = (order.trackingNumber || "").toLowerCase();
      const recipient = (
        order.recipientName ||
        order.customerName ||
        order.users?.full_name ||
        ""
      ).toLowerCase();
      const phone = (order.customerPhone || order.shippingPhone || "").toLowerCase();
      const courierName = (order.shippingCourier || "").toLowerCase();
      const city = (order.shippingCity || "").toLowerCase();
      return (
        orderNum.includes(q) ||
        tracking.includes(q) ||
        recipient.includes(q) ||
        phone.includes(q) ||
        courierName.includes(q) ||
        city.includes(q)
      );
    });
  }, [orders, searchQuery]);

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: status.toUpperCase() });
      toast.success("Status pesanan berhasil diperbarui");
      getOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memperbarui status");
    }
  };

  const handleOpenShipModal = (order) => {
    setShippingOrder(order);
    setCourier(order.shippingCourier || courierList[0]);
    setTrackingNumber(order.trackingNumber || "");
  };

  const handleShipSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error("Nomor resi wajib diisi");
      return;
    }

    try {
      setShippingSubmitting(true);
      await api.patch(`/orders/${shippingOrder.id}/ship`, {
        courier: courier.trim(),
        trackingNumber: trackingNumber.trim(),
      });
      toast.success(`Pesanan #${shippingOrder.orderNumber} berhasil dikirim!`);
      setShippingOrder(null);
      getOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim pesanan");
    } finally {
      setShippingSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await api.get("/admin/orders/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Data pesanan berhasil diekspor");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
          <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
            <ShoppingCart size={28} className="text-[#00BFA5]" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-[-1px]">
            {isLogistics ? "LOGISTIK & PENGIRIMAN" : "ORDERS"}
          </h1>
          <p className="text-[#2a3a3a] text-sm">
            {isLogistics
              ? "Operasional packing gudang, cetak label resi thermal A6, dan update kurir"
              : "Kelola semua pesanan pelanggan RegarSport"}
          </p>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {[
          { label: "Semua Pesanan", value: "" },
          { label: "Perlu Dikemas", value: "PAID", badge: "Siap Kirim", badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
          { label: "Sedang Diproses", value: "PROCESSING", badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
          { label: "Dalam Pengiriman", value: "SHIPPED", badgeColor: "bg-purple-500/20 text-purple-400 border border-purple-500/30" },
          { label: "Selesai", value: "COMPLETED", badgeColor: "bg-green-500/20 text-green-400 border border-green-500/30" },
          { label: "Dibatalkan", value: "CANCELLED", badgeColor: "bg-red-500/20 text-red-400 border border-red-500/30" },
        ].map((tab) => {
          const isActive = (statusFilter || "").toUpperCase() === (tab.value || "").toUpperCase();
          return (
            <button
              key={tab.value}
              onClick={() => {
                setPage(1);
                setStatusFilter(tab.value);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#00BFA5] text-black shadow-lg shadow-[#00BFA5]/25"
                  : "bg-[#14141E] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-black/20 text-black font-black" : tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Barcode & Text Search */}
        <div className="flex-1 max-w-lg">
          <div className="flex items-center bg-[#14141E] border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-[#00BFA5]/60 focus-within:bg-[#00BFA5]/5 transition-all shadow-inner">
            <Scan size={18} className="text-[#00BFA5] mr-2.5 shrink-0 animate-pulse" />
            <input
              type="text"
              placeholder="Cari No. Order, Scan Barcode Resi, Nama, Kota, atau HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white text-xs sm:text-sm outline-none placeholder:text-white/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-white/40 hover:text-white ml-2 p-1"
                title="Hapus pencarian"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {filteredOrders.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-semibold transition cursor-pointer"
            >
              {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                <>
                  <CheckSquare size={16} className="text-[#00BFA5]" />
                  <span>Batal Pilih Semua</span>
                </>
              ) : (
                <>
                  <Square size={16} />
                  <span>Pilih Semua ({filteredOrders.length})</span>
                </>
              )}
            </button>
          )}

          {!isLogistics && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2.5 bg-[#00BFA5]/10 hover:bg-[#00BFA5]/20 text-[#00BFA5] hover:text-white px-5 py-2.5 rounded-2xl border border-[#00BFA5]/20 transition-all font-semibold text-xs disabled:opacity-50 cursor-pointer"
            >
              <Download size={16} />
              {exporting ? "Mengekspor..." : "Export CSV"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <ScreenLoader label="Memuat daftar pesanan..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title={searchQuery ? "Tidak ditemukan pesanan" : "Belum ada pesanan"}
          description={
            searchQuery
              ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchQuery}".`
              : "Pesanan dari pelanggan akan muncul di sini."
          }
        />
      ) : (
        <div className="bg-[#14141E] border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-5 pl-6 text-center w-12">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title="Pilih semua pesanan"
                    >
                      {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                        <CheckSquare size={18} className="text-[#00BFA5]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pelanggan</th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Item & Ukuran</th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pengiriman & Resi</th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Label Logistik</th>
                  <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => {
                  const s = (order.status || "").toLowerCase();
                  const hasShipping = order.shippingCourier || order.trackingNumber;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-white/5 transition-all duration-200 group ${
                        selectedOrderIds.includes(order.id) ? "bg-[#00BFA5]/5" : ""
                      }`}
                    >
                      <td className="p-5 pl-6 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded accent-[#00BFA5] cursor-pointer"
                        />
                      </td>
                      <td className="p-5 text-white/60 font-mono text-sm">
                        {order.orderNumber || `#${order.id}`}
                      </td>
                      <td className="p-6">
                        <div className="font-medium text-white">
                          {order.recipientName || order.customerName || order.users?.full_name || "Customer"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {order.customerPhone || order.customerEmail || order.users?.email || "-"}
                        </div>
                        {order.shippingCity && (
                          <div className="text-[11px] text-[#00BFA5]/80 mt-0.5">
                            📍 {order.shippingCity}
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        <div className="space-y-1.5 min-w-44 max-w-xs">
                          {(order.items || []).map((it, itIdx) => (
                            <div key={itIdx} className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-medium text-white/90 truncate max-w-36">
                                {it.productName}
                              </span>
                              <span className="text-white/40 font-mono text-[11px]">
                                {it.quantity}x
                              </span>
                              {it.size && (
                                <span className="px-1.5 py-0.5 rounded-md bg-[#00BFA5]/15 text-[#00BFA5] border border-[#00BFA5]/30 font-bold text-[10px]">
                                  {it.size}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-lg font-bold text-white">
                          Rp {Number(order.totalAmount || order.total_amount).toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="p-6">
                        <span
                          className={`inline-block text-xs font-bold px-4 py-1.5 rounded-2xl border ${statusColors[s] || "bg-white/10 text-white/70"}`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      </td>
                      <td className="p-6">
                        {hasShipping ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-[#00BFA5] flex items-center gap-1">
                              <Truck size={12} /> {order.shippingCourier || "Ekspedisi"}
                            </span>
                            <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded border border-white/10 w-fit">
                              {order.trackingNumber}
                            </span>
                          </div>
                        ) : s === "paid" || s === "processing" ? (
                          <button
                            onClick={() => handleOpenShipModal(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00BFA5]/10 hover:bg-[#00BFA5]/20 text-[#00BFA5] border border-[#00BFA5]/30 text-xs font-semibold transition active:scale-95"
                          >
                            <Truck size={14} /> Input Resi
                          </button>
                        ) : (
                          <span className="text-xs text-white/30 italic">-</span>
                        )}
                      </td>
                      <td className="p-6">
                        <button
                          onClick={() => setLabelOrder(order)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition active:scale-95 whitespace-nowrap cursor-pointer hover:shadow-lg hover:shadow-purple-500/10"
                          title="Cetak Label Pengiriman Thermal A6 & Packing Slip"
                        >
                          <Printer size={14} /> Cetak Label A6
                        </button>
                      </td>
                      <td className="p-6">
                        <select
                          value={s}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="bg-[#0D0D0D] border border-white/10 hover:border-[#00BFA5]/40 focus:border-[#00BFA5] rounded-2xl px-4 py-2.5 text-sm text-white outline-none transition-all cursor-pointer"
                        >
                          {orderStatuses.map((stat) => (
                            <option key={stat} value={stat}>
                              {stat.charAt(0).toUpperCase() + stat.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-2 px-5 py-3 bg-[#14141E] border border-white/5 hover:border-white/20 rounded-2xl text-white/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:text-white"
          >
            <ChevronLeft size={18} />
            Sebelumnya
          </button>

          <div className="px-6 py-3 bg-[#14141E] border border-white/5 rounded-2xl text-sm text-white/70 font-medium">
            Halaman <span className="text-white font-bold">{page}</span> dari {totalPages}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-2 px-5 py-3 bg-[#14141E] border border-white/5 hover:border-white/20 rounded-2xl text-white/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:text-white"
          >
            Berikutnya
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal Input Resi / Kirim Pesanan */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#14141E] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00BFA5]/10 text-[#00BFA5] border border-[#00BFA5]/20">
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Kirim Pesanan</h3>
                  <p className="text-xs text-white/40 font-mono">#{shippingOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShippingOrder(null)}
                className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Destination Preview */}
            <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-1">
              <p>
                <span className="text-white/40">Penerima:</span>{" "}
                <strong className="text-white">
                  {shippingOrder.recipientName || shippingOrder.customerName || "Customer"}
                </strong>
                {(shippingOrder.customerPhone || shippingOrder.shippingPhone) && (
                  <span className="font-mono text-white/60 ml-1.5">
                    ({shippingOrder.customerPhone || shippingOrder.shippingPhone})
                  </span>
                )}
              </p>
              <p className="text-white/70">
                <span className="text-white/40">Alamat:</span>{" "}
                {[
                  shippingOrder.shippingAddress || shippingOrder.shipping_address,
                  shippingOrder.shippingCity,
                  shippingOrder.shippingPostalCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "Alamat tidak tercantum"}
              </p>
              {shippingOrder.shippingNotes && (
                <p className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20 text-[11px] mt-1">
                  <span className="font-bold">Catatan:</span> {shippingOrder.shippingNotes}
                </p>
              )}
            </div>

            <form onSubmit={handleShipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Pilih Kurir / Ekspedisi</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#00BFA5] transition"
                >
                  {courierList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Nomor Resi Pengiriman</label>
                <input
                  type="text"
                  placeholder="Contoh: JP8829104812"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#00BFA5] transition font-mono placeholder:text-white/20"
                  required
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={shippingSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-black font-bold text-sm transition active:scale-95 disabled:opacity-50"
                >
                  <PackageCheck size={18} />
                  {shippingSubmitting ? "Mengirim..." : "Kirim Pesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Bar untuk Cetak Massal */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#14141E] border border-[#00BFA5]/40 rounded-2xl px-5 py-3 shadow-2xl shadow-black/80 flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-medium">
            <span className="w-6 h-6 rounded-full bg-[#00BFA5] text-black font-black text-xs flex items-center justify-center">
              {selectedOrderIds.length}
            </span>
            <span className="hidden sm:inline">Pesanan terpilih</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-black text-xs font-black transition cursor-pointer shadow-lg shadow-[#00BFA5]/20 active:scale-95"
          >
            <Printer size={15} />
            Cetak {selectedOrderIds.length} Label Thermal (A6)
          </button>

          <button
            onClick={() => setSelectedOrderIds([])}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer"
          >
            Batal
          </button>
        </div>
      )}

      {/* Modal Cetak Label Thermal Pengiriman Satuan */}
      <ShippingLabelModal
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
      />

      {/* Modal Cetak Massal Label Thermal Pengiriman */}
      <BulkShippingLabelModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        orders={filteredOrders.filter((o) => selectedOrderIds.includes(o.id))}
      />
    </div>
  );
}