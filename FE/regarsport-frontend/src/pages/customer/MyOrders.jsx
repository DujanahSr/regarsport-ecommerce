/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  ShoppingBag,
  CreditCard,
  Eye,
  RotateCcw,
  Search,
  MessageCircle,
  Clock,
  CheckCircle2,
  Truck,
  Box,
  XCircle,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { CardSkeletonList, EmptyState } from "../../components/common/UiStates";
import MidtransModal from "../../components/common/MidtransModal";
import { useCart } from "../../context/CartContext";

const STATUS_TABS = [
  { id: "", label: "Semua", icon: Package },
  { id: "pending", label: "Belum Bayar", icon: Clock },
  { id: "paid", label: "Lunas", icon: CreditCard },
  { id: "processing", label: "Diproses", icon: Box },
  { id: "shipped", label: "Dikirim", icon: Truck },
  { id: "completed", label: "Selesai", icon: CheckCircle2 },
  { id: "cancelled", label: "Dibatalkan", icon: XCircle },
];

export default function MyOrders() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [payingOrder, setPayingOrder] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  const getOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/my-orders", {
        params: {
          page,
          size: 20,
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

      // Auto-sync any pending orders in background with Midtrans
      list.forEach((ord) => {
        if ((ord.status || "").toUpperCase() === "PENDING" && ord.orderNumber) {
          api
            .get(`/payments/sync/${ord.orderNumber}`)
            .then((syncRes) => {
              const status = (
                syncRes.data?.data?.paymentStatus || ""
              ).toUpperCase();
              if (status === "SETTLEMENT" || status === "CAPTURE") {
                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === ord.id ? { ...o, status: "PAID" } : o
                  )
                );
              }
            })
            .catch(() => {});
        }
      });
    } catch (error) {
      console.log(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, [page]);

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "paid":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "shipped":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "completed":
        return "bg-green-50 text-green-700 border border-green-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Filter orders by active status tab and search keyword
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus =
        !statusFilter ||
        (o.status || "").toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q));

      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Tab counter helper
  const countForStatus = (statusKey) => {
    if (!statusKey) return orders.length;
    return orders.filter(
      (o) => (o.status || "").toLowerCase() === statusKey.toLowerCase()
    ).length;
  };

  // Instant Reorder Action
  const handleReorder = async (order) => {
    try {
      setReorderingId(order.id);
      let items = order.items || [];
      if (!items.length) {
        const res = await api.get(`/orders/${order.id}`);
        const full = res.data?.data || res.data;
        items = full?.items || [];
      }

      if (!items.length) {
        toast.error("Rincian produk tidak dapat dimuat untuk pesan ulang");
        return;
      }

      for (const it of items) {
        await addToCart(
          {
            id: it.productId,
            name: it.productName,
            price: it.price,
            imageUrl: it.productImage,
          },
          it.quantity || 1,
          it.size || "L",
          {
            customName: it.customName || null,
            customNumber: it.customNumber || null,
            customCollar: it.customCollar || null,
            customTeam: it.customTeam || null,
          }
        );
      }

      toast.success(
        `${items.length} item berhasil dimasukkan kembali ke keranjang!`
      );
      navigate("/dashboard/cart");
    } catch (err) {
      console.error(err);
      toast.error("Gagal melakukan pemesanan ulang");
    } finally {
      setReorderingId(null);
    }
  };

  // WhatsApp CS Direct Assistance
  const handleContactCS = (order) => {
    const orderNo = order.orderNumber || `Order #${order.id}`;
    const text = `Halo Admin RegarSport, saya ingin menanyakan informasi pesanan saya dengan nomor: *${orderNo}*. Mohon bantuannya ya min 🙏`;
    const url = `https://api.whatsapp.com/send?phone=6282133445566&text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Pesanan Saya
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Kelola, pantau proses produksi/pengiriman, dan pesan ulang jersey favorit Anda.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari no. pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Horizontal Status Filter Tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const count = countForStatus(tab.id);
          const isActive = statusFilter === tab.id;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-emerald-950 text-white shadow-md shadow-emerald-950/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              <TabIcon size={14} className={isActive ? "text-emerald-400" : "text-slate-400"} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    isActive
                      ? "bg-emerald-500/30 text-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <CardSkeletonList count={3} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title={searchQuery ? "Pesanan tidak ditemukan" : "Belum ada pesanan"}
          description={
            searchQuery
              ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchQuery}".`
              : "Pesanan yang Anda buat akan muncul di sini."
          }
          action={
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/30"
            >
              <ShoppingBag size={18} />
              Belanja Sekarang
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isPending =
                (order.status || "").toUpperCase() === "PENDING";
              const isCompleted =
                (order.status || "").toUpperCase() === "COMPLETED";
              const isPaid =
                (order.status || "").toUpperCase() === "PAID";
              const createdAtDate = new Date(
                order.createdAt || order.created_at
              );
              const isExpired =
                isPending &&
                !isNaN(createdAtDate.getTime()) &&
                Date.now() - createdAtDate.getTime() > 24 * 60 * 60 * 1000;
              const isReordering = reorderingId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="flex items-center gap-2 font-bold text-slate-900 text-base">
                        <Package size={17} className="text-emerald-600" />
                        {order.orderNumber || `Order #${order.id}`}
                      </h2>
                      {order.createdAt || order.created_at ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={13} />
                          {new Date(
                            order.createdAt || order.created_at
                          ).toLocaleString("id-ID")}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        isExpired
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : getStatusColor(order.status)
                      }`}
                    >
                      {isExpired ? "KEDALUWARSA" : order.status}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-slate-600 text-sm">
                      Total Tagihan:{" "}
                      <span className="ml-1 font-extrabold text-emerald-600 text-base">
                        Rp{" "}
                        {Number(
                          order.totalAmount || order.total_amount
                        ).toLocaleString("id-ID")}
                      </span>
                    </p>

                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin
                        size={14}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      {order.shippingAddress || order.shipping_address}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      {/* Lihat Detail */}
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                          isPending
                            ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            : "bg-emerald-600 text-white shadow-xs shadow-emerald-600/20 hover:bg-emerald-700"
                        }`}
                      >
                        <Eye size={14} />
                        <span>Lihat Detail</span>
                      </Link>

                      {/* Bayar Sekarang (jika PENDING) */}
                      {isPending && !isExpired && (
                        <button
                          type="button"
                          onClick={() => setPayingOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 cursor-pointer"
                        >
                          <CreditCard size={14} />
                          <span>Bayar Sekarang</span>
                        </button>
                      )}

                      {/* Beli Lagi (Reorder) untuk status Completed / Paid */}
                      {(isCompleted || isPaid) && (
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          disabled={isReordering}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-50 cursor-pointer"
                          title="Masukkan produk pesanan ini kembali ke keranjang"
                        >
                          <RotateCcw size={13} className={isReordering ? "animate-spin" : ""} />
                          <span>{isReordering ? "Memasukkan..." : "Beli Lagi"}</span>
                        </button>
                      )}

                      {/* Bantuan CS WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleContactCS(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700 cursor-pointer"
                        title="Tanya Admin CS perihal pesanan ini via WhatsApp"
                      >
                        <MessageCircle size={14} className="text-emerald-600" />
                        <span>Tanya CS</span>
                      </button>

                      {/* Pesan Ulang jika kedaluwarsa */}
                      {isExpired && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-rose-600 bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-xl font-medium">
                            Batas Bayar 24 Jam Berakhir
                          </span>
                          <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-xs"
                          >
                            <RotateCcw size={13} />
                            <span>Pesan Ulang</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>

              <span className="text-sm text-slate-500">
                Halaman {page} dari {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Midtrans Modal directly from order history */}
      {payingOrder && (
        <MidtransModal
          isOpen={Boolean(payingOrder)}
          onClose={() => setPayingOrder(null)}
          order={payingOrder}
          onSuccess={() => {
            setPayingOrder(null);
            getOrders();
          }}
        />
      )}
    </div>
  );
}