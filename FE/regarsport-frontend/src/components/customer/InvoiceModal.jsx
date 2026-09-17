/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef } from "react";
import { Printer, X, FileText, CheckCircle2, ShieldCheck, Download } from "lucide-react";

export default function InvoiceModal({ isOpen, onClose, order }) {
  const printRef = useRef(null);

  if (!isOpen || !order) return null;

  const orderNumber = order.orderNumber || `#${order.id}`;
  const invoiceNumber = `INV/${new Date(order.createdAt || Date.now()).getFullYear()}/RS/${orderNumber.replace(/[^a-zA-Z0-9]/g, "")}`;
  const customerName = order.customerName || order.users?.full_name || "Pelanggan Terhormat";
  const customerEmail = order.customerEmail || order.users?.email || "-";
  const customerPhone = order.customerPhone || order.shippingPhone || "-";
  const shippingAddress = order.shippingAddress || order.shipping_address || "Alamat tidak tercantum";
  const items = order.items || order.order_items || [];
  const totalAmount = Number(order.totalAmount || order.total_amount || 0);
  const rawStatus = (order.status || "").toUpperCase();
  const isPaid = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(rawStatus);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Print CSS Scoped to this invoice */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-customer-invoice, #official-customer-invoice * {
            visibility: visible !important;
          }
          #official-customer-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: #fff !important;
            color: #000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 99999 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Modal Actions Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Invoice Resmi Pembelian</h3>
              <p className="text-xs text-white/50">{invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> Cetak / Unduh PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition"
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
            className="w-full min-w-[620px] max-w-[760px] mx-auto bg-white text-zinc-900 p-8 sm:p-10 font-sans text-xs shadow-xl relative border border-slate-200"
          >
            {/* Header Perusahaan & Identitas Invoice */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-600 text-white font-black text-sm px-2.5 py-1 rounded-md tracking-wider">
                    RS
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                      PT REGARSPORT INDONESIA
                    </h1>
                    <p className="text-[10px] font-bold text-emerald-700 tracking-widest mt-0.5 uppercase">
                      Official Athletic Gear & Custom Apparel
                    </p>
                  </div>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed max-w-xs">
                  Jl. Jenderal Sudirman No. 45, Wonogiri, Jawa Tengah 57612<br />
                  NPWP: 01.345.678.9-521.000 | Email: cs@regarsport.com<br />
                  Hotline / WhatsApp: +62 812-3456-7890
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 tracking-wider block">
                  INVOICE
                </span>
                <p className="text-xs font-mono font-bold text-emerald-700 mt-1">
                  {invoiceNumber}
                </p>
                <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
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
            <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-6 mb-6">
              {/* Ditagihkan Kepada */}
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  DITAGIHKAN KEPADA:
                </h2>
                <p className="text-sm font-bold text-slate-900">{customerName}</p>
                <p className="text-slate-600 font-mono text-[11px] mt-0.5">{customerEmail}</p>
                {customerPhone !== "-" && (
                  <p className="text-slate-600 font-mono text-[11px]">{customerPhone}</p>
                )}
                <p className="text-slate-600 text-[11px] mt-2 leading-relaxed">
                  <span className="font-semibold text-slate-700">Alamat Kirim:</span> {shippingAddress}
                </p>
              </div>

              {/* Rincian Metode & Status Transaksi */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative overflow-hidden">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  INFORMASI PEMBAYARAN:
                </h2>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway:</span>
                    <span className="font-bold text-slate-800">Midtrans Online Payment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <span className={`font-bold ${isPaid ? "text-emerald-700" : "text-amber-600"}`}>
                      {isPaid ? "LUNAS (SETTLEMENT)" : "MENUNGGU PEMBAYARAN"}
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
                  <div className="absolute right-3 bottom-2 transform -rotate-12 pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-dashed border-rose-600 rounded-lg px-3 py-1 text-center bg-rose-50/50 shadow-xs">
                      <span className="text-[9px] font-black uppercase text-rose-600 tracking-widest block">
                        MIDTRANS VERIFIED
                      </span>
                      <span className="text-base font-black text-rose-600 tracking-widest leading-none block">
                        PAID / LUNAS
                      </span>
                      <span className="text-[8px] font-mono text-rose-500 font-bold block mt-0.5">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabel Rincian Barang */}
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                    <th className="py-2.5 px-3 w-10">No</th>
                    <th className="py-2.5 px-3">Deskripsi Barang & Variasi</th>
                    <th className="py-2.5 px-3 text-center w-24">Ukuran</th>
                    <th className="py-2.5 px-3 text-right w-28">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11.5px]">
                  {items.map((it, idx) => {
                    const price = Number(it.price || 0);
                    const qty = Number(it.quantity || 1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{it.productName || "Produk Olahraga"}</p>
                          <p className="text-[10px] text-slate-400">RegarSport Original Collection</p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {it.size ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700 border border-slate-200">
                              {it.size}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          Rp {price.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                          {qty}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          Rp {(price * qty).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Pembayaran & Footer */}
            <div className="flex justify-end border-t-2 border-slate-900 pt-4 mb-8">
              <div className="w-64 space-y-1.5 text-xs">
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
                <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-700 text-base font-mono">
                    Rp {totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Kaki & Tanda Tangan Komputerisasi */}
            <div className="grid grid-cols-2 items-end border-t border-slate-200 pt-6 text-[10.5px] text-slate-500">
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Invoice ini merupakan bukti pembayaran resmi yang sah diterbitkan oleh sistem komputerisasi.</li>
                  <li>Simpan invoice ini sebagai syarat klaim garansi atau penukaran ukuran (size exchange).</li>
                  <li>Produk original bergaransi resmi PT RegarSport Indonesia.</li>
                </ul>
              </div>

              <div className="text-right">
                <p className="text-slate-400 text-[10px] mb-8">
                  Wonogiri, {new Date(order.createdAt || Date.now()).toLocaleDateString("id-ID")}
                </p>
                <div className="inline-block border-b border-slate-400 pb-1 text-center min-w-40">
                  <p className="font-bold text-slate-800 text-[11px]">Finance & Logistics Dept</p>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">PT RegarSport Indonesia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex justify-end gap-3 mt-6 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Printer size={16} /> Cetak Faktur / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
