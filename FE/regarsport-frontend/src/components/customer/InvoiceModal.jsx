/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState } from "react";
import { Printer, X, FileText, CheckCircle2, ShieldCheck, Download, Loader2 } from "lucide-react";
import html2pdf from "html2pdf.js";
import toast from "react-hot-toast";

export default function InvoiceModal({ isOpen, onClose, order }) {
  const printRef = useRef(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  if (!isOpen || !order) return null;

  const orderNumber = order.orderNumber || `#${order.id}`;
  const invoiceNumber = `INV/${new Date(order.createdAt || Date.now()).getFullYear()}/RS/${orderNumber.replace(/[^a-zA-Z0-9]/g, "")}`;
  const recipientName = order.recipientName || order.customerName || order.users?.full_name || "Pelanggan Terhormat";
  const customerEmail = order.customerEmail || order.users?.email || "-";
  const customerPhone = order.customerPhone || order.shippingPhone || "";
  const streetAddr = order.shippingAddress || order.shipping_address || "Alamat tidak tercantum";
  const cityPostal = [order.shippingCity, order.shippingPostalCode].filter(Boolean).join(", ");
  const fullShippingAddress = cityPostal ? `${streetAddr}, ${cityPostal}` : streetAddr;
  const shippingNotes = order.shippingNotes || "";
  const items = order.items || order.order_items || [];
  const totalAmount = Number(order.totalAmount || order.total_amount || 0);
  const rawStatus = (order.status || "").toUpperCase();
  const isPaid = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(rawStatus);
  const isPending = rawStatus === "PENDING";
  const isCancelled = rawStatus === "CANCELLED";

  // Fungsi untuk membersihkan dan mengonversi warna modern (oklch, oklab, lab, lch) ke sRGB standar
  // agar html2canvas / html2pdf tidak error 'Unsupported color function oklch'
  const sanitizeColorsForCanvas = (clonedDoc) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const colorCache = new Map();

    const convertColorToRgb = (colorStr) => {
      if (!colorStr || typeof colorStr !== "string") return colorStr;
      if (
        !colorStr.includes("oklch") &&
        !colorStr.includes("oklab") &&
        !colorStr.includes("lab(") &&
        !colorStr.includes("lch(")
      ) {
        return colorStr;
      }

      if (colorCache.has(colorStr)) {
        return colorCache.get(colorStr);
      }

      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = "#000000";
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        const alpha = +(a / 255).toFixed(3);
        const res = alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
        colorCache.set(colorStr, res);
        return res;
      } catch {
        return "rgb(30, 41, 59)";
      }
    };

    const regexModernColor = /(oklch|oklab|lab|lch)\([^)]+\)/gi;

    // 1. Sanitasi semua style tags
    const styles = clonedDoc.querySelectorAll("style");
    styles.forEach((st) => {
      if (st.textContent && regexModernColor.test(st.textContent)) {
        st.textContent = st.textContent.replace(regexModernColor, (match) => convertColorToRgb(match));
      }
    });

    // 2. Ubah external stylesheet link menjadi style tag yang telah disanitasi
    const links = clonedDoc.querySelectorAll("link[rel='stylesheet']");
    links.forEach((lk) => {
      try {
        const sheet = Array.from(document.styleSheets).find((s) => s.href === lk.href);
        if (sheet && sheet.cssRules) {
          const cssText = Array.from(sheet.cssRules)
            .map((r) => r.cssText)
            .join("\n");
          const styleTag = clonedDoc.createElement("style");
          styleTag.textContent = cssText.replace(regexModernColor, (m) => convertColorToRgb(m));
          lk.parentNode.replaceChild(styleTag, lk);
        }
      } catch {
        // Cross-origin stylesheet handling
      }
    });

    // 3. Traversal dan beri inline sRGB style pada setiap node invoice
    const invoice = clonedDoc.getElementById("official-customer-invoice");
    if (invoice) {
      const allNodes = [invoice, ...invoice.querySelectorAll("*")];
      const colorProps = [
        "color",
        "backgroundColor",
        "borderColor",
        "borderTopColor",
        "borderRightColor",
        "borderBottomColor",
        "borderLeftColor",
        "outlineColor",
      ];

      allNodes.forEach((node) => {
        if (node.nodeType === 1) {
          const computed = window.getComputedStyle(node);
          colorProps.forEach((prop) => {
            const val = computed[prop];
            if (val && regexModernColor.test(val)) {
              node.style[prop] = convertColorToRgb(val);
            }
          });
        }
      });
    }
  };

  const handleDownloadPDF = async () => {
    const invoiceEl = document.getElementById("official-customer-invoice");
    if (!invoiceEl) return;

    try {
      setDownloadingPDF(true);
      toast.loading("Menyiapkan dokumen PDF...", { id: "pdf-toast" });

      const opt = {
        margin: [8, 10, 8, 10],
        filename: `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          onclone: (clonedDoc) => {
            sanitizeColorsForCanvas(clonedDoc);
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(invoiceEl).save();
      toast.success("Dokumen PDF berhasil diunduh!", { id: "pdf-toast" });
    } catch (err) {
      console.error("Gagal download PDF:", err);
      toast("Mengalihkan ke dialog Cetak / Simpan PDF...", { id: "pdf-toast", icon: "📄" });
      setTimeout(() => {
        handlePrint();
      }, 400);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handlePrint = () => {
    const invoiceEl = document.getElementById("official-customer-invoice");
    if (!invoiceEl) {
      window.print();
      return;
    }

    // Buat iframe terisolasi agar tidak terpengaruh CSS/posisi flex modal induk
    const frameId = "official-invoice-print-frame";
    let iframe = document.getElementById(frameId);
    if (iframe) iframe.remove();

    iframe = document.createElement("iframe");
    iframe.id = frameId;
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    // Salin seluruh stylesheet Vite & Tailwind ke iframe
    const styleTags = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${invoiceNumber}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              height: auto !important;
              overflow: visible !important;
            }
            #official-customer-invoice {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div id="official-customer-invoice" class="w-full bg-white text-zinc-900 font-sans text-xs">
            ${invoiceEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Tunggu stylesheet memuat lalu panggil printer
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Fallback Print CSS Scoped jika user menekan Ctrl+P langsung di browser */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          .fixed.inset-0 {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .relative.w-full.max-w-3xl {
            position: static !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          #official-customer-invoice, #official-customer-invoice * {
            visibility: visible !important;
          }
          #official-customer-invoice {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Modal Actions Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              isPaid
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : isPending
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isPaid
                  ? "Invoice Resmi Pembelian (Lunas)"
                  : isPending
                  ? "Surat Tagihan / Proforma Invoice"
                  : "Faktur Pembelian (Dibatalkan)"}
              </h3>
              <p className="text-xs text-white/50">{invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-95 cursor-pointer"
              title="Unduh berkas PDF langsung ke perangkat"
            >
              {downloadingPDF ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{downloadingPDF ? "Menyimpan..." : "Unduh PDF"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              title="Cetak lewat printer fisik atau preview dialog browser"
            >
              <Printer size={15} /> <span>Cetak Faktur</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ===================== PHYSICAL A4 INVOICE CONTAINER ===================== */}
        <div className="bg-zinc-950/60 p-2 sm:p-6 rounded-2xl border border-white/5 overflow-x-auto">
          <div
            id="official-customer-invoice"
            ref={printRef}
            className="w-full min-w-[620px] max-w-[760px] mx-auto bg-white text-zinc-900 p-6 sm:p-8 print:p-0 font-sans text-xs shadow-xl relative border border-slate-200 print:border-none"
          >
            {/* Header Perusahaan & Identitas Invoice */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-3 print:pb-2 print:mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-emerald-600 text-white font-black text-xs px-2 py-0.5 rounded tracking-wider">
                    RS
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                      PT REGARSPORT INDONESIA
                    </h1>
                    <p className="text-[9px] font-bold text-emerald-700 tracking-widest uppercase">
                      Official Athletic Gear & Custom Apparel
                    </p>
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] leading-tight max-w-xs">
                  Jl. Jenderal Sudirman No. 45, Wonogiri, Jawa Tengah 57612<br />
                  NPWP: 01.345.678.9-521.000 | Email: cs@regarsport.com<br />
                  Hotline / WhatsApp: +62 812-3456-7890
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-slate-900 tracking-wider block">
                  {isPaid
                    ? "INVOICE RESMI"
                    : isPending
                    ? "PROFORMA INVOICE"
                    : "INVOICE (DIBATALKAN)"}
                </span>
                <p className="text-[11px] font-mono font-bold text-emerald-700">
                  {invoiceNumber}
                </p>
                <div className="mt-1 space-y-0.5 text-[10px] text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Tanggal:</span>{" "}
                    {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Order Ref:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{orderNumber}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Penerima & Info Pembayaran Grid */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 mb-3 print:pb-2 print:mb-2">
              {/* Ditagihkan Kepada */}
              <div>
                <h2 className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  DITAGIHKAN KEPADA:
                </h2>
                <p className="text-xs font-bold text-slate-900 uppercase">{recipientName}</p>
                <p className="text-slate-600 font-mono text-[10px]">
                  {customerEmail} {customerPhone && `• ${customerPhone}`}
                </p>
                <p className="text-slate-600 text-[10px] mt-1 leading-snug">
                  <span className="font-semibold text-slate-700">Alamat Kirim:</span> {fullShippingAddress}
                </p>
                {shippingNotes && (
                  <p className="text-slate-500 text-[9.5px] italic mt-0.5">
                    <span className="font-semibold not-italic text-slate-700">Catatan:</span> {shippingNotes}
                  </p>
                )}
              </div>

              {/* Rincian Metode & Status Transaksi */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 relative overflow-hidden text-[10.5px]">
                <h2 className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  INFORMASI PEMBAYARAN:
                </h2>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway:</span>
                    <span className="font-bold text-slate-800">Midtrans Online Payment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Transaksi:</span>
                    <span className={`font-bold ${isPaid ? "text-emerald-700" : isPending ? "text-amber-600" : "text-rose-600"}`}>
                      {isPaid ? "LUNAS (SETTLEMENT)" : isPending ? "MENUNGGU PEMBAYARAN" : "DIBATALKAN"}
                    </span>
                  </div>
                  {order.shippingCourier && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kurir Pengiriman:</span>
                      <span className="font-bold text-slate-800">{order.shippingCourier}</span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Resi:</span>
                      <span className="font-mono font-bold text-slate-800">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Stempel Digital PAID jika Lunas */}
                {isPaid && (
                  <div className="absolute right-2.5 bottom-1.5 transform -rotate-12 pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-dashed border-rose-600 rounded px-2.5 py-0.5 text-center bg-rose-50/50 shadow-xs">
                      <span className="text-[8px] font-black uppercase text-rose-600 tracking-widest block">
                        MIDTRANS VERIFIED
                      </span>
                      <span className="text-xs font-black text-rose-600 tracking-widest leading-tight block">
                        PAID / LUNAS
                      </span>
                      <span className="text-[7.5px] font-mono text-rose-500 font-bold block">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stempel Digital PROFORMA jika Belum Lunas */}
                {isPending && (
                  <div className="absolute right-2.5 bottom-1.5 transform -rotate-12 pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-dashed border-amber-500 rounded px-2.5 py-0.5 text-center bg-amber-50/60 shadow-xs">
                      <span className="text-[8px] font-black uppercase text-amber-600 tracking-widest block">
                        MENUNGGU BAYAR
                      </span>
                      <span className="text-xs font-black text-amber-600 tracking-widest leading-tight block">
                        UNPAID / PROFORMA
                      </span>
                      <span className="text-[7.5px] font-mono text-amber-500 font-bold block">
                        Tagihan Sementara
                      </span>
                    </div>
                  </div>
                )}

                {/* Stempel Digital VOID jika Dibatalkan */}
                {isCancelled && (
                  <div className="absolute right-2.5 bottom-1.5 transform -rotate-12 pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-dashed border-rose-600 rounded px-2.5 py-0.5 text-center bg-rose-50/70 shadow-xs">
                      <span className="text-[8px] font-black uppercase text-rose-600 tracking-widest block">
                        STATUS TRANSAKSI
                      </span>
                      <span className="text-xs font-black text-rose-600 tracking-widest leading-tight block">
                        VOID / BATAL
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabel Rincian Barang */}
            <div className="mb-3 print:mb-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                    <th className="py-1.5 px-2 w-8">No</th>
                    <th className="py-1.5 px-2">Deskripsi Barang & Variasi</th>
                    <th className="py-1.5 px-2 text-center w-20">Ukuran</th>
                    <th className="py-1.5 px-2 text-right w-24">Harga Satuan</th>
                    <th className="py-1.5 px-2 text-center w-12">Qty</th>
                    <th className="py-1.5 px-2 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10.5px]">
                  {items.map((it, idx) => {
                    const price = Number(it.price || 0);
                    const qty = Number(it.quantity || 1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <p className="font-bold text-slate-800">{it.productName || "Produk Olahraga"}</p>
                          <p className="text-[9px] text-slate-400">RegarSport Original Collection</p>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {it.size ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[9px] text-slate-700 border border-slate-200">
                              {it.size}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                          Rp {price.toLocaleString("id-ID")}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-800 font-mono">
                          {qty}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                          Rp {(price * qty).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Pembayaran */}
            <div className="flex justify-end border-t-2 border-slate-900 pt-2 mb-3 print:mb-2">
              <div className="w-56 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono">Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim:</span>
                  <span className="font-semibold text-emerald-700">Gratis (Promo RS)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN 11% (Termasuk):</span>
                  <span className="font-mono text-slate-500">Rp {Math.round(totalAmount * 0.11 / 1.11).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 text-xs font-black text-slate-900">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-700 text-sm font-mono">
                    Rp {totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Kaki & Tanda Tangan Komputerisasi */}
            <div className="grid grid-cols-2 items-end border-t border-slate-200 pt-2.5 text-[9.5px] text-slate-500">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-700">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Invoice ini merupakan bukti pembayaran resmi yang sah diterbitkan oleh sistem komputerisasi.</li>
                  <li>Simpan invoice ini sebagai syarat klaim garansi atau penukaran ukuran (size exchange).</li>
                  <li>Produk original bergaransi resmi PT RegarSport Indonesia.</li>
                </ul>
              </div>

              <div className="text-right">
                <p className="text-slate-400 text-[9px] mb-4">
                  Wonogiri, {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID")}
                </p>
                <div className="inline-block border-b border-slate-400 pb-0.5 text-center min-w-36">
                  <p className="font-bold text-slate-800 text-[10px]">Finance & Logistics Dept</p>
                </div>
                <p className="text-[8.5px] text-slate-400 mt-0.5">PT RegarSport Indonesia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex justify-end gap-3 mt-5 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            {downloadingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>{downloadingPDF ? "Menyimpan PDF..." : "Unduh PDF"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Printer size={16} /> Cetak Faktur
          </button>
        </div>
      </div>
    </div>
  );
}
