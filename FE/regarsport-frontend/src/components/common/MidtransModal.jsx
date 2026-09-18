import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const MIDTRANS_CLIENT_KEY = "Mid-client-k96CUmHtMPzra5IO";
const MIDTRANS_SNAP_URL = "https://app.sandbox.midtrans.com/snap/snap.js";

// Fungsi untuk memastikan script Midtrans Snap termuat di header dokumen
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
  const isLaunchingRef = useRef(false);
  const orderNumber = order?.orderNumber || (order?.id ? `REGAR-${order.id}` : "");

  useEffect(() => {
    if (!isOpen || !order) {
      isLaunchingRef.current = false;
      toast.dismiss("midtrans-snap-loader");
      return;
    }

    if (isLaunchingRef.current) return;
    isLaunchingRef.current = true;

    let isMounted = true;
    toast.loading("Membuka pembayaran Midtrans Sandbox...", { id: "midtrans-snap-loader" });

    const launchSnap = async () => {
      try {
        await ensureSnapScriptLoaded();

        let token = initialSnapToken;

        // Ambil atau buat token resmi Midtrans jika belum ada
        if (!token || token.startsWith("SNAP-TOKEN-")) {
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

        // Hilangkan loading toast tepat sebelum pop-up resmi Midtrans muncul
        toast.dismiss("midtrans-snap-loader");

        if (window.snap && typeof window.snap.pay === "function") {
          window.snap.pay(token, {
            onSuccess: async function (result) {
              toast.success("Pembayaran Berhasil! Pesanan Anda telah lunas.");
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
              // Pengguna menutup pop-up Midtrans
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
        toast.dismiss("midtrans-snap-loader");
        console.error("Midtrans launch error:", err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Gagal menghubungkan ke gateway pembayaran Midtrans.";
        toast.error(msg);
        onClose();
      }
    };

    launchSnap();

    return () => {
      isMounted = false;
      toast.dismiss("midtrans-snap-loader");
    };
  }, [isOpen, order, initialSnapToken, orderNumber, onClose, onSuccess]);

  // Tidak menampilkan modal kartu tambahan agar Midtrans Snap muncul langsung tanpa pop-up ganda
  return null;
}
