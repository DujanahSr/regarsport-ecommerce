/* eslint-disable react-hooks/set-state-in-effect */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Users as UsersIcon,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";

import toast from "react-hot-toast";

/* ----------------------------------------------------------------
   UserRow – tetap memoized untuk performa
---------------------------------------------------------------- */
const UserRow = memo(function UserRow({ user, index, page, limit, onRoleChange }) {
  const [avatarError, setAvatarError] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fullName = user.fullName || user.full_name || "Pengguna";
  const email = user.email || "-";
  const roleRaw = user.role || "ROLE_CUSTOMER";
  const isAdmin = roleRaw.toUpperCase().includes("ADMIN");
  const avatarUrl = user.avatarUrl || user.avatar_url;
  const createdAt = user.createdAt || user.created_at;

  const roleBadge = isAdmin
    ? "bg-red-500/10 text-red-400 border-red-500/20"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  const handleToggleRole = async () => {
    const nextRole = isAdmin ? "ROLE_CUSTOMER" : "ROLE_ADMIN";
    const actionLabel = isAdmin ? "turunkan ke Customer" : "jadikan Admin";
    if (!window.confirm(`Yakin ingin mengubah ${fullName} menjadi ${nextRole}?`)) return;

    try {
      setUpdating(true);
      await api.patch(`/admin/users/${user.id}/role`, { role: nextRole });
      toast.success(`Role ${fullName} berhasil diubah!`);
      if (onRoleChange) onRoleChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengubah role pengguna");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors duration-200 group">
      <td className="p-4 text-white/40 text-sm font-mono">
        {(page - 1) * limit + index + 1}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          {/* Initial Avatar */}
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#00BFA5]/80 to-teal-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,191,165,0.15)] overflow-hidden">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-white font-bold text-xs">
                {fullName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div>
            <p className="text-white/90 text-sm font-semibold group-hover:text-white transition-colors duration-200">
              {fullName}
            </p>
            <p className="text-white/30 text-xs">{email}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs font-bold border ${roleBadge} transition-all duration-200`}
        >
          {isAdmin ? <Shield size={11} /> : <User size={11} />}
          {isAdmin ? "Admin" : "Customer"}
        </span>
      </td>
      <td className="p-4 text-white/40 text-sm">
        {createdAt
          ? new Date(createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-"}
      </td>
      <td className="p-4">
        <button
          onClick={handleToggleRole}
          disabled={updating}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 active:scale-95 disabled:opacity-50 ${
            isAdmin
              ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              : "border-[#00BFA5]/30 text-[#00BFA5] hover:bg-[#00BFA5]/10"
          }`}
          title={isAdmin ? "Ubah ke Customer" : "Promosikan ke Admin"}
        >
          {updating ? "Menyimpan..." : isAdmin ? "Set Customer" : "Set Admin"}
        </button>
      </td>
    </tr>
  );
});

/* ----------------------------------------------------------------
   Users Page
---------------------------------------------------------------- */
export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const searchTimerRef = useRef(null);

  /* Debounce search */
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  /* Fetch users */
  const getUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", {
        params: {
          search: debouncedSearch || undefined,
          role: roleFilter ? (roleFilter.toUpperCase().startsWith("ROLE_") ? roleFilter : `ROLE_${roleFilter.toUpperCase()}`) : undefined,
          page,
          limit,
        },
      });
      const responseData = res.data?.data || res.data;
      const list = Array.isArray(responseData?.content)
        ? responseData.content
        : Array.isArray(responseData)
        ? responseData
        : [];
      setUsers(list);
      setTotal(responseData?.totalElements ?? res.data?.meta?.total ?? list.length);
      setTotalPages(responseData?.totalPages ?? res.data?.meta?.totalPages ?? 1);
    } catch (error) {
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, page]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-10">
      {/* ======================== HEADER ======================== */}
      <div className="flex items-center gap-4 mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
          <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
            <UsersIcon size={28} className="text-[#00BFA5]" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-[-1px]">USERS</h1>
          <p className="text-[#2a3a3a] text-sm">
            Total <span className="text-white font-semibold">{total}</span> pengguna terdaftar
          </p>
        </div>
      </div>

      {/* ======================== FILTER BAR ======================== */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 bg-[#14141E] border border-white/5 rounded-2xl px-5 py-3 hover:border-[#00BFA5]/20 transition-all duration-300 group">
          <Search size={20} className="text-white/30 group-hover:text-[#00BFA5]/60 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
            >
              <ChevronRight size={16} className="rotate-45" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className="bg-[#14141E] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm outline-none hover:border-[#00BFA5]/20 focus:border-[#00BFA5]/40 transition-all duration-300 cursor-pointer appearance-none bg-no-repeat bg-position-[right_1rem_center] bg-size-[1rem]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300BFA5' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          }}
        >
          <option value="">Semua Role</option>
          <option value="admin" className="bg-[#0D0D0D]">Admin</option>
          <option value="customer" className="bg-[#0D0D0D]">Customer</option>
        </select>
      </div>

      {/* ======================== TABLE ======================== */}
      {loading ? (
        <ScreenLoader label="Memuat data pengguna..." />
      ) : users.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna"
          description={
            debouncedSearch || roleFilter
              ? "Tidak ada pengguna yang cocok dengan filter."
              : "Belum ada pengguna terdaftar."
          }
        />
      ) : (
        <div className="bg-[#14141E] border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Pengguna
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Role
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Bergabung
                  </th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user, index) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    index={index}
                    page={page}
                    limit={limit}
                    onRoleChange={getUsers}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== PAGINATION ======================== */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-2 px-5 py-3 bg-[#14141E] border border-white/5 hover:border-white/20 rounded-2xl text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:text-white active:scale-95"
          >
            <ChevronLeft size={18} />
            Sebelumnya
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-90 ${p === page
                    ? "bg-[#00BFA5] text-black shadow-[0_0_20px_rgba(0,191,165,0.3)]"
                    : "bg-[#14141E] border border-white/5 text-white/50 hover:text-white hover:border-white/20"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-2 px-5 py-3 bg-[#14141E] border border-white/5 hover:border-white/20 rounded-2xl text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:text-white active:scale-95"
          >
            Berikutnya
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-[-1]"
        style={{
          backgroundImage: `linear-gradient(#00BFA5 1px, transparent 1px), linear-gradient(90deg, #00BFA5 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}