import { Link } from "react-router-dom";
import { Dumbbell, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-emerald-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
                <Dumbbell size={20} className="text-emerald-400" />
              </span>
              <span className="text-xl font-bold tracking-tight">
                Regar<span className="text-emerald-400">Sport</span>
              </span>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-emerald-50/60">
              Peralatan, pakaian, dan aksesori olahraga berkualitas tinggi untuk
              menunjang performa terbaik Anda setiap hari.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-sm font-semibold text-white">Navigasi</p>
            <ul className="mt-4 space-y-2.5 text-sm text-emerald-50/60">
              <li>
                <Link to="/dashboard" className="transition hover:text-emerald-300">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/dashboard/about" className="text-white/40 hover:text-[#00BFA5] transition">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/dashboard/favorites" className="transition hover:text-emerald-300">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/dashboard/cart" className="transition hover:text-emerald-300">
                  Keranjang
                </Link>
              </li>
              <li>
                <Link to="/dashboard/my-orders" className="transition hover:text-emerald-300">
                  Pesanan Saya
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-white">Hubungi Kami</p>
            <ul className="mt-4 space-y-3 text-sm text-emerald-50/60">
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                support@regarsport.com
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                +62 851-8726-8888
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                Bandung, Indonesia
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-emerald-50/50">
          © {year} RegarSport. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}