"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccess, ROLE_LABEL } from "@/lib/access";
import PageBackground from "@/components/layout/PageBackground";

// Urutan dan label mengikuti prototype (assets/app.js). Menu disaring per peran lewat lib/access.js.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", short: "Dashboard", icon: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" },
  { href: "/orders", label: "Daftar Order", mekanikLabel: "Order Saya", short: "Order", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 7h6m-6 4h4" },
  { href: "/orders/new", label: "Order Baru", short: "Order Baru", icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { href: "/customers", label: "Riwayat Pelanggan", short: "Pelanggan", icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" },
  { href: "/parts", label: "Stok Suku Cadang", short: "Stok", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" },
  { href: "/staff", label: "Kelola Staf", short: "Staf", icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
];

/**
 * Kerangka halaman staf: sidebar (desktop), bar atas + navigasi bawah (HP), dan area konten.
 * AuthGuard dipasang di app/(staff)/layout.js, jadi user di sini sudah pasti login.
 */
export default function StaffLayout({ children }) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV_ITEMS.filter((item) => canAccess(role, item.href)).map((item) => ({
    ...item,
    text: role === "mekanik" && item.mekanikLabel ? item.mekanikLabel : item.label,
    shortText: role === "mekanik" && item.href === "/orders" ? "Order Saya" : item.short,
    // "/orders" tidak aktif saat di "/orders/new" (dicek exact atau sub-path non-new)
    active:
      item.href === "/orders"
        ? pathname === "/orders" || (pathname.startsWith("/orders/") && pathname !== "/orders/new" && !pathname.startsWith("/orders/new/"))
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  const name = user?.nama || user?.username || "";
  const roleLabel = ROLE_LABEL[role] || user?.peran || "";

  async function handleLogout() {
    await logout(); // hapus token + ba_user
    router.replace("/login");
  }

  return (
    <>
      <PageBackground />

      <div className="mtop">
        <img src="/logo.png" alt="" />
        <span className="mtop-user">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
          </svg>
          {name} · {roleLabel}
        </span>
      </div>

      <div className="shell">
        <aside className="side">
          <Link className="logo" href="/">
            <img src="/logo.png" alt="BengkelinAja" />
          </Link>
          <nav aria-label="Menu utama">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.active ? "on" : undefined}
                aria-current={item.active ? "page" : undefined}
              >
                {item.text}
              </Link>
            ))}
          </nav>
          <div className="me">
            <div className="me-user">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{flexShrink:0,color:"rgba(255,255,255,.35)"}}>
                <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
              </svg>
              <div>
                <b>{name}</b>
                <span>{roleLabel}</span>
              </div>
            </div>
            <button type="button" className="b b-g sm full" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </aside>

        <main className="main">{children}</main>
      </div>

      <nav className="bnav" aria-label="Menu utama">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.active ? "on" : undefined}
            aria-current={item.active ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={item.icon} />
            </svg>
            {item.shortText}
          </Link>
        ))}
        <button type="button" onClick={handleLogout} className="bnav-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
          </svg>
          Keluar
        </button>
      </nav>
    </>
  );
}
