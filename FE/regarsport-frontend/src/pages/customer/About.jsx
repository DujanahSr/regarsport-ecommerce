import { Users, Package, Award, Zap, Heart, Shield, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const teamValues = [
  {
    icon: Heart,
    title: "Passion for Sport",
    desc: "Kami mencintai olahraga dan ingin membantu Anda mencapai performa terbaik.",
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    desc: "Produk original dengan garansi resmi dari brand ternama.",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    desc: "Pengiriman cepat ke seluruh Indonesia dengan tracking real-time.",
  },
];

const stats = [
  { icon: Users, value: "1M+", label: "Pelanggan Aktif" },
  { icon: Package, value: "10K+", label: "Produk Sport" },
  { icon: Award, value: "500+", label: "Brand Ternama" },
  { icon: ShoppingBag, value: "50K+", label: "Pesanan Terkirim" },
];

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 md:space-y-20">

        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-block bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-emerald-700 text-xs font-black tracking-[2px] uppercase">
            Tentang Kami
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Lebih Dari Sekadar
            <br />
            <span className="text-emerald-600">
              Toko Olahraga
            </span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            RegarSport hadir untuk memenuhi kebutuhan perlengkapan olahraga Anda dengan produk
            berkualitas, harga terbaik, dan pelayanan yang memuaskan.
          </p>
        </section>

        {/* Visi & Misi */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 md:p-8 ring-1 ring-slate-900/5 shadow-sm hover:shadow-xl transition hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Visi</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Menjadi pusat perlengkapan olahraga terpercaya di Indonesia yang menginspirasi
              gaya hidup sehat dan aktif untuk semua kalangan.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-8 ring-1 ring-slate-900/5 shadow-sm hover:shadow-xl transition hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Misi</h2>
            <ul className="text-slate-500 text-sm space-y-2 leading-relaxed list-disc list-inside">
              <li>Menyediakan produk olahraga original dengan harga kompetitif</li>
              <li>Memberikan pengalaman belanja yang mudah dan aman</li>
              <li>Mendukung komunitas olahraga melalui event dan edukasi</li>
            </ul>
          </div>
        </section>

        {/* Statistik */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-6 text-center ring-1 ring-slate-900/5 shadow-sm hover:shadow-xl transition hover:-translate-y-1"
            >
              <Icon size={24} className="text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-black text-slate-900">{value}</p>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-1">
                {label}
              </p>
            </div>
          ))}
        </section>

        {/* Nilai / Values */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8">Nilai Kami</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {teamValues.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 text-center ring-1 ring-slate-900/5 shadow-sm hover:shadow-xl transition hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-emerald-600" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg">{title}</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA / Hubungi Kami */}
        <section className="bg-white rounded-2xl p-8 md:p-10 text-center ring-1 ring-slate-900/5 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Siap Berprestasi?</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Temukan perlengkapan olahraga terbaik untuk mencapai performa maksimal.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-950/30 hover:shadow-emerald-950/50"
          >
            Mulai Belanja
            <Zap size={16} strokeWidth={2.5} />
          </Link>
        </section>

      </div>
    </div>
  );
}