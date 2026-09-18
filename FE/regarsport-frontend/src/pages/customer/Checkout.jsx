/* eslint-disable react-hooks/immutability */
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MapPin, Package, CreditCard, ArrowLeft, ShoppingBag, User, Phone, Building2, FileText } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import MidtransModal from "../../components/common/MidtransModal";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cartItems, loadCart, setSelectedItems } = useCart();

  const { user } = useAuth();

  const [recipientName, setRecipientName] = useState(user?.fullName || user?.full_name || "");
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone_number || "");
  const [city, setCity] = useState(user?.city || "");
  const [postalCode, setPostalCode] = useState(user?.postalCode || user?.postal_code || "");
  const [streetAddress, setStreetAddress] = useState(user?.address || "");
  const [shippingNotes, setShippingNotes] = useState("");

  // Auto-fill dari data profil pengguna jika baru dimuat
  useEffect(() => {
    if (user) {
      if (!recipientName) setRecipientName(user.fullName || user.full_name || "");
      if (!phone && (user.phoneNumber || user.phone_number)) setPhone(user.phoneNumber || user.phone_number);
      if (!city && user.city) setCity(user.city);
      if (!postalCode && (user.postalCode || user.postal_code)) setPostalCode(user.postalCode || user.postal_code);
      if (!streetAddress && user.address) setStreetAddress(user.address);
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const directItem = location.state?.directItem;
  const selectedIds = location.state?.selectedItems || [];

  const checkoutItems = directItem
    ? [directItem]
    : cartItems.filter((item) => selectedIds.includes(item.id));

  const total = checkoutItems.reduce(
    (acc, item) =>
      acc + Number(item.price || item.products?.price || 0) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    try {
      if (checkoutItems.length === 0) {
        setValidationError("Pilih produk terlebih dahulu");
        return;
      }

      if (!recipientName.trim()) {
        setValidationError("Nama penerima paket wajib diisi");
        return;
      }

      const cleanPhone = phone.trim().replace(/[-\s]/g, "");
      if (!cleanPhone || !/^08\d{8,12}$/.test(cleanPhone)) {
        setValidationError("Nomor WhatsApp/HP wajib diawali 08 dan memiliki 10-13 digit (contoh: 081234567890)");
        return;
      }

      if (!city.trim()) {
        setValidationError("Kota / Kabupaten pengiriman wajib diisi");
        return;
      }

      if (!postalCode.trim() || !/^\d{5}$/.test(postalCode.trim())) {
        setValidationError("Kode pos wajib 5 digit angka (contoh: 57612)");
        return;
      }

      if (!streetAddress.trim() || streetAddress.trim().length < 8) {
        setValidationError("Alamat jalan & nomor rumah wajib diisi lengkap (minimal 8 karakter)");
        return;
      }

      setValidationError("");
      setLoading(true);

      const items = checkoutItems.map((item) => ({
        productId: item.productId || item.products?.id || item.id,
        productName: item.productName || item.products?.name || item.name,
        productImage:
          item.productImage ||
          item.products?.image_url ||
          item.imageUrl ||
          item.image_url ||
          "",
        price: Number(item.price || item.products?.price),
        quantity: Number(item.quantity),
        size: item.size || "L",
      }));

      const orderResponse = await api.post("/orders/checkout", {
        shippingAddress: streetAddress.trim(),
        recipientName: recipientName.trim(),
        customerPhone: cleanPhone,
        shippingCity: city.trim(),
        shippingPostalCode: postalCode.trim(),
        shippingNotes: shippingNotes.trim(),
        items,
      });

      const orderData = orderResponse.data?.data;
      setCreatedOrder(orderData);

      // Sinkronisasi pengurangan stok ukuran produk secara otomatis di katalog
      for (const it of items) {
        if (it.productId) {
          api.patch(`/products/${it.productId}/stock`, {
            size: it.size,
            quantityChange: -Number(it.quantity),
          }).catch((err) => console.warn("Stock sync warning:", err));
        }
      }

      // Refresh cart and clear selected items
      await loadCart();
      setSelectedItems([]);
      setValidationError("");

      toast.success("Pesanan berhasil dibuat!");
      // Directly trigger Midtrans payment modal on checkout page
      setShowPaymentModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || "Checkout pesanan gagal";
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (order) => {
    const targetId = order?.id || createdOrder?.id;
    navigate(`/dashboard/orders/${targetId}`);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    if (createdOrder?.id) {
      toast("Pesanan disimpan. Anda dapat membayar nanti di Detail Pesanan.", {
        icon: "ℹ️",
      });
      navigate(`/dashboard/orders/${createdOrder.id}`);
    }
  };

  if (loading && checkoutItems.length === 0) {
    return <ScreenLoader label="Menyiapkan checkout..." />;
  }

  if (checkoutItems.length === 0) {
    return (
      <EmptyState
        title="Belum ada produk yang dipilih"
        description="Pilih item dari keranjang atau gunakan fitur 'Beli Sekarang' pada produk."
        action={
          <Link
            to="/dashboard/cart"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <ShoppingBag size={18} />
            Buka Keranjang
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        to={directItem ? -1 : "/dashboard/cart"}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft size={16} />
        {directItem ? "Kembali ke Produk" : "Kembali ke Keranjang"}
      </Link>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Checkout Pembayaran
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Periksa rincian pesanan dan alamat pengiriman Anda sebelum membayar.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
            {checkoutItems.length} Item
          </span>
        </div>

        {/* Shipping Information Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <MapPin size={18} className="text-emerald-600" />
              Informasi Penerima & Alamat Pengiriman
            </h2>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Wajib diisi lengkap untuk resi kurir
            </span>
          </div>

          {(user?.address || user?.phoneNumber) && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2 text-xs text-emerald-800">
              <span className="flex items-center gap-1.5 font-medium">
                ✨ Alamat & kontak terisi otomatis dari profil akun Anda.
              </span>
              <Link to="/dashboard/profile" className="font-bold underline hover:text-emerald-950">
                Kelola Profil
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Penerima */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-emerald-600" />
                Nama Lengkap Penerima <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama penerima paket"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            {/* No WhatsApp / HP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-600" />
                No. WhatsApp / HP Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                required
              />
            </div>

            {/* Kota / Kabupaten */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-emerald-600" />
                Kota / Kabupaten <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Kab. Wonogiri / Kota Surakarta"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            {/* Kode Pos */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kode Pos (5 Digit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="Contoh: 57612"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                required
              />
            </div>
          </div>

          {/* Alamat Jalan Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat Lengkap & Patokan Rumah <span className="text-rose-500">*</span>
            </label>
            <textarea
              placeholder="Tuliskan nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, serta patokan (misal: Rumah pagar hitam seberang masjid)..."
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              rows="3"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              required
            />
          </div>

          {/* Catatan untuk Kurir */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" />
              Catatan Khusus Kurir / Pengiriman (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Titip satpam komplek jika rumah kosong"
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs sm:text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {validationError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {validationError}
          </div>
        ) : null}

        {/* Order Summary */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
            <Package size={18} className="text-emerald-600" />
            Ringkasan Item Pesanan
          </h2>

          <div className="space-y-3">
            {checkoutItems.map((item, index) => {
              const name = item.productName || item.products?.name || item.name;
              const img =
                item.productImage ||
                item.products?.image_url ||
                item.imageUrl ||
                item.image_url ||
                "https://placehold.co/200x200?text=Produk";
              const price = Number(item.price || item.products?.price || 0);

              return (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-sm transition hover:border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={img}
                      alt={name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover bg-white border border-slate-100"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://placehold.co/200x200?text=Produk";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">Jumlah: {item.quantity} pcs</p>
                        {item.size && (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                            Size: {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 font-bold text-slate-900">
                    Rp {(price * item.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Tagihan
              </span>
              <h3 className="text-2xl font-black text-emerald-600 sm:text-3xl">
                Rp {total.toLocaleString("id-ID")}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/35 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
            >
              <CreditCard size={18} />
              {loading ? "Memproses Order..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>

      {/* Direct Midtrans Payment Modal on Checkout */}
      {createdOrder && (
        <MidtransModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          order={createdOrder}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}