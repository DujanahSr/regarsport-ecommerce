/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// FRONTEND/src/pages/admin/Orders.jsx

import { useCallback, useEffect, useState } from "react";
import { Download, Filter, ShoppingCart, ChevronLeft, ChevronRight, Truck, X, PackageCheck, Printer } from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";
import ShippingLabelModal from "../../components/admin/ShippingLabelModal";

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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

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
  }, [getOrders]);

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
          <h1 className="text-4xl font-black text-white tracking-[-1px]">ORDERS</h1>
          <p className="text-[#2a3a3a] text-sm">Kelola semua pesanan pelanggan RegarSport</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#14141E] border border-white/5 rounded-2xl px-4 py-2.5">
            <Filter size={18} className="text-white/40 mr-3" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="bg-transparent text-white text-sm outline-none cursor-pointer"
            >
              <option value="">Semua Status</option>
              {orderStatuses.map((s) => (
                <option key={s} value={s} className="bg-[#0C0C16]">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2.5 bg-[#00BFA5]/10 hover:bg-[#00BFA5]/20 text-[#00BFA5] hover:text-white px-5 py-3 rounded-2xl border border-[#00BFA5]/20 transition-all font-medium disabled:opacity-50"
        >
          <Download size={18} />
          {exporting ? "Mengekspor..." : "Export CSV"}
        </button>
      </div>

      {loading ? (
        <ScreenLoader label="Memuat daftar pesanan..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          description="Pesanan dari pelanggan akan muncul di sini."
        />
      ) : (
        <div className="bg-[#14141E] border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pelanggan</th>
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Item & Ukuran</th>
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pengiriman & Resi</th>
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Label Logistik</th>
                  <th className="p-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const s = (order.status || "").toLowerCase();
                  const hasShipping = order.shippingCourier || order.trackingNumber;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-white/5 transition-all duration-200 group"
                    >
                      <td className="p-6 text-white/60 font-mono text-sm">
                        {order.orderNumber || `#${order.id}`}
                      </td>
                      <td className="p-6">
                        <div className="font-medium text-white">
                          {order.customerName || order.users?.full_name || "Customer"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {order.customerEmail || order.users?.email || "-"}
                        </div>
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

      {/* Modal Cetak Label Thermal Pengiriman & Packing Slip */}
      <ShippingLabelModal
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
      />
    </div>
  );
}