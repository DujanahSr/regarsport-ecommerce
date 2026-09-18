import { useEffect, useState } from "react";
import {
  CreditCard,
  Building2,
  QrCode,
  CheckCircle2,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function MidtransModal({
  isOpen,
  onClose,
  order,
  snapToken: initialSnapToken,
  onSuccess,
}) {
  const [selectedMethod, setSelectedMethod] = useState("bank_transfer");
  const [processing, setProcessing] = useState(false);
  const [snapToken, setSnapToken] = useState(initialSnapToken || "");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [snapLaunched, setSnapLaunched] = useState(false);

  // Fetch or generate snap token if not provided
  useEffect(() => {
    if (!isOpen || !order) {
      setSnapLaunched(false);
      return;
    }

    if (initialSnapToken) {
      setSnapToken(initialSnapToken);
      return;
    }

    const fetchToken = async () => {
      try {
        setTokenLoading(true);
        try {
          const res = await api.get(`/payments/order/${order.id}`);
          const token = res.data?.data?.snapToken || res.data?.snapToken;
          if (token && !token.startsWith("SNAP-TOKEN-")) {
            setSnapToken(token);
            return;
          }
        } catch {
          // Fallback to create-token
        }

        const createRes = await api.post("/payments/create-token", {
          orderId: Number(order.id),
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail || "customer@regarsport.com",
          customerName: order.customerName || "Customer",
          amount: Number(order.totalAmount || order.total_amount || 0),
        });
        const createdToken =
          createRes.data?.data?.snapToken || createRes.data?.snapToken || "";
        setSnapToken(createdToken);
      } catch (err) {
        console.error("Gagal mendapatkan Snap Token:", err);
      } finally {
        setTokenLoading(false);
      }
    };

    fetchToken();
  }, [isOpen, order, initialSnapToken]);

  const orderNumber = order?.orderNumber || (order?.id ? `REGAR-${order.id}` : "");
  const totalAmount = Number(order?.totalAmount || order?.total_amount || 0);

  // Auto-trigger official Midtrans Snap popup when valid Snap token is ready
  useEffect(() => {
    if (!isOpen || !snapToken || tokenLoading || snapLaunched) return;

    const isOfficialToken = snapToken && !snapToken.startsWith("SNAP-TOKEN-");

    if (window.snap && typeof window.snap.pay === "function" && isOfficialToken) {
      setSnapLaunched(true);

      try {
        window.snap.pay(snapToken, {
          onSuccess: async function (result) {
            toast.success("Pembayaran Berhasil!");
            try {
              await api.post("/payments/midtrans/webhook", {
                order_id: result.order_id || orderNumber,
                orderId: result.order_id || orderNumber,
                transaction_status: result.transaction_status || "settlement",
                transactionStatus: result.transaction_status || "settlement",
                fraud_status: result.fraud_status || "accept",
                fraudStatus: result.fraud_status || "accept",
                payment_type: result.payment_type || "credit_card",
                paymentType: result.payment_type || "credit_card",
                transaction_id: result.transaction_id || `TRX-${Date.now()}`,
                transactionId: result.transaction_id || `TRX-${Date.now()}`,
                status_code: result.status_code || "200",
                statusCode: result.status_code || "200",
                gross_amount: String(totalAmount),
                grossAmount: String(totalAmount),
              });
            } catch {
              await api.get(`/payments/sync/${orderNumber}`).catch(() => {});
            }

            if (onSuccess) onSuccess(order);
            onClose();
          },
          onPending: async function () {
            toast("Menunggu pembayaran...", { icon: "⏳" });
            await api.get(`/payments/sync/${orderNumber}`).catch(() => {});
            onClose();
          },
          onError: function () {
            toast.error("Pembayaran dibatalkan atau gagal via Midtrans");
            onClose();
          },
          onClose: async function () {
            // Check if status changed in Midtrans before modal was closed
            await api.get(`/payments/sync/${orderNumber}`).catch(() => {});
            onClose();
          },
        });
      } catch (e) {
        console.warn("window.snap.pay error:", e);
        setSnapLaunched(false);
      }
    }
  }, [
    isOpen,
    snapToken,
    tokenLoading,
    snapLaunched,
    order,
    orderNumber,
    totalAmount,
    onSuccess,
    onClose,
  ]);

  if (!isOpen || !order) return null;

  const isOfficialToken = snapToken && !snapToken.startsWith("SNAP-TOKEN-");

  // When official Midtrans Snap is launching or open, DO NOT render the custom modal
  // This prevents overlapping double modals on screen!
  if (isOfficialToken && window.snap) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl border border-slate-100">
          <Loader2 size={20} className="animate-spin text-emerald-600" />
          <span className="text-sm font-semibold text-slate-700">
            Menghubungkan Midtrans Snap...
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Fallback Simulator Modal (used only if official snap is unavailable)
  const handleSimulatePayment = async () => {
    try {
      setProcessing(true);
      await api.post("/payments/midtrans/webhook", {
        order_id: orderNumber,
        orderId: orderNumber,
        transaction_status: "settlement",
        transactionStatus: "settlement",
        fraud_status: "accept",
        fraudStatus: "accept",
        payment_type: selectedMethod,
        paymentType: selectedMethod,
        transaction_id: "MOCK-TRX-" + Date.now(),
        transactionId: "MOCK-TRX-" + Date.now(),
        status_code: "200",
        statusCode: "200",
        gross_amount: String(totalAmount),
        grossAmount: String(totalAmount),
      });

      toast.success("Pembayaran Berhasil! Pesanan Anda telah lunas.");
      if (onSuccess) {
        onSuccess(order);
      }
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Gagal memproses simulasi pembayaran."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="bg-[#002855] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-400/20 p-2.5 text-sky-300">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold tracking-tight text-white text-base">
                  Midtrans Payment
                </h3>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
                  Simulator
                </span>
              </div>
              <p className="text-xs text-sky-200/70 font-mono mt-0.5">
                {orderNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
            aria-label="Tutup modal pembayaran"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Amount Display */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                Total Tagihan
              </span>
              <div className="text-2xl font-black text-emerald-600">
                Rp {totalAmount.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Snap Token
              </span>
              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-200/70 px-2.5 py-1 rounded-md inline-block">
                {tokenLoading
                  ? "Loading..."
                  : snapToken
                  ? `${snapToken.substring(0, 16)}...`
                  : "TOKEN-READY"}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              Pilih Saluran Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMethod("bank_transfer")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                  selectedMethod === "bank_transfer"
                    ? "border-sky-500 bg-sky-50/60 text-sky-950 ring-2 ring-sky-500/20 font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <Building2 size={22} className="text-sky-600 mb-1.5" />
                <span className="text-xs">Virtual Account</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  BCA / Mandiri / BNI
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("qris")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                  selectedMethod === "qris"
                    ? "border-sky-500 bg-sky-50/60 text-sky-950 ring-2 ring-sky-500/20 font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <QrCode size={22} className="text-emerald-600 mb-1.5" />
                <span className="text-xs">QRIS / e-Wallet</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  GoPay / ShopeePay
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("credit_card")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                  selectedMethod === "credit_card"
                    ? "border-sky-500 bg-sky-50/60 text-sky-950 ring-2 ring-sky-500/20 font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <CreditCard size={22} className="text-purple-600 mb-1.5" />
                <span className="text-xs">Kartu Kredit</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Visa / Mastercard
                </span>
              </button>
            </div>
          </div>

          {/* Sandbox Info Banner */}
          <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200/70 text-xs text-amber-900 flex gap-3 items-start">
            <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Mode Uji Coba</p>
              <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                Tekan tombol di bawah untuk simulasi pembayaran lunas secara instan.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Bayar Nanti
            </button>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={processing || tokenLoading}
              className="flex-[2] rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memproses Settlement...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Bayar Sekarang (Simulasi)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
