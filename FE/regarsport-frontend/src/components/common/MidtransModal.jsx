import { useEffect, useState, useRef } from "react";
import { ShieldCheck, Loader2, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const MIDTRANS_CLIENT_KEY = "Mid-client-k96CUmHtMPzra5IO";
const MIDTRANS_SNAP_URL = "https://app.sandbox.midtrans.com/snap/snap.js";

// Helper to ensure Midtrans Snap script is loaded into the document head
function ensureSnapScriptLoaded() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.snap && typeof window.snap.pay === "function") {
      return resolve(window.snap);
    }

    const existingScript = document.querySelector(`script[src="${MIDTRANS_SNAP_URL}"]`);
    if (existingScript) {
      if (window.snap) return resolve(window.snap);
      existingScript.addEventListener("load", () => resolve(window.snap));
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src = MIDTRANS_SNAP_URL;
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    script.async = true;
    script.onload = () => resolve(window.snap);
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export default function MidtransModal({
  isOpen,
  onClose,
  order,
  snapToken: initialSnapToken,
  onSuccess,
}) {
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Menghubungkan Midtrans...");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isLaunchingRef = useRef(false);

  const orderNumber = order?.orderNumber || (order?.id ? `REGAR-${order.id}` : "");

  useEffect(() => {
    if (!isOpen || !order) {
      isLaunchingRef.current = false;
      setLoading(true);
      setHasError(false);
      setErrorMessage("");
      return;
    }

    isLaunchingRef.current = false;
    setLoading(true);
    setHasError(false);
    setErrorMessage("");

    let isMounted = true;

    const launchSnap = async () => {
      try {
        setStatusMessage("Memeriksa pustaka Midtrans...");
        await ensureSnapScriptLoaded();

        let token = initialSnapToken;

        // If no initial token or if token is a mock token, fetch/create official token from backend
        if (!token || token.startsWith("SNAP-TOKEN-")) {
          setStatusMessage("Mengambil token pembayaran Midtrans...");

          try {
            const res = await api.get(`/payments/order/${order.id}`);
            const fetchedToken = res.data?.data?.snapToken || res.data?.snapToken;
            if (fetchedToken && !fetchedToken.startsWith("SNAP-TOKEN-")) {
              token = fetchedToken;
            }
          } catch (fetchErr) {
            console.warn("Belum ada payment record tersimpan, mencoba create-token:", fetchErr);
          }

          if (!token || token.startsWith("SNAP-TOKEN-")) {
            const createRes = await api.post("/payments/create-token", {
              orderId: Number(order.id),
              orderNumber: order.orderNumber,
              customerEmail: order.customerEmail || "customer@regarsport.com",
              customerName: order.customerName || "Customer",
              amount: Number(order.totalAmount || order.total_amount || 0),
            });
            token = createRes.data?.data?.snapToken || createRes.data?.snapToken;
          }
        }

        if (!isMounted) return;

        if (!token || token.startsWith("SNAP-TOKEN-")) {
          throw new Error("Gagal memperoleh Snap Token resmi dari Midtrans.");
        }

        setStatusMessage("Membuka pop-up pembayaran resmi Midtrans...");

        if (window.snap && typeof window.snap.pay === "function") {
          isLaunchingRef.current = true;

          window.snap.pay(token, {
            onSuccess: async function (result) {
              toast.success("Pembayaran Berhasil!");
              try {
                await api.get(`/payments/sync/${orderNumber}`);
              } catch (e) {
                console.warn("Sync error after success:", e);
              }
              if (onSuccess) onSuccess(order);
              onClose();
            },
            onPending: async function () {
              toast("Menunggu pembayaran diselesaikan...", { icon: "⏳" });
              try {
                await api.get(`/payments/sync/${orderNumber}`);
              } catch (e) {
                console.warn("Sync error on pending:", e);
              }
              onClose();
            },
            onError: function () {
              toast.error("Pembayaran dibatalkan atau gagal via Midtrans");
              onClose();
            },
            onClose: async function () {
              // User closed Midtrans Snap popup
              try {
                await api.get(`/payments/sync/${orderNumber}`);
              } catch (e) {
                console.warn("Sync error on close:", e);
              }
              onClose();
            },
          });
        } else {
          throw new Error("Pustaka Midtrans Snap gagal dimuat di browser.");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Midtrans launch error:", err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Gagal menghubungkan ke gateway pembayaran Midtrans.";
        setHasError(true);
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    launchSnap();

    return () => {
      isMounted = false;
    };
  }, [isOpen, order, initialSnapToken]);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 text-center">
        {hasError ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-1 ring-rose-200">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Gagal Membuka Midtrans
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              {errorMessage ||
                "Terjadi kendala saat menghubungkan ke gateway pembayaran Midtrans Sandbox."}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200 py-3 text-xs font-bold text-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 ring-1 ring-emerald-200/60">
              <ShieldCheck size={28} />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full ring-1 ring-sky-200">
                Midtrans Snap Sandbox
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Menghubungkan Midtrans...
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Pesanan:{" "}
              <span className="font-mono font-semibold text-slate-700">
                {orderNumber}
              </span>
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5 rounded-2xl bg-slate-50 py-3 px-4 border border-slate-100">
              <Loader2 size={16} className="animate-spin text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-600">
                {statusMessage}
              </span>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-semibold text-slate-500 transition"
              >
                Batal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
