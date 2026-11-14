"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccess, ROLE_LABEL } from "@/lib/access";
import PageBackground from "@/components/layout/PageBackground";

// Urutan dan label mengikuti prototype (assets/app.js). Menu disaring per peran lewat lib/access.js.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Order", mekanikLabel: "Order Saya" },
  { href: "/orders/new", label: "Order Baru" },
  { href: "/customers", label: "Riwayat" },
  { href: "/parts", label: "Stok" },
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
        <span>
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
            <b>{name}</b>
            <span>{roleLabel}</span>
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
            {item.text}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          style={{ flex: 1, border: 0, background: "transparent", color: "var(--mist)", font: "inherit", fontSize: 12, fontWeight: 700, padding: "10px 4px", borderRadius: 999, cursor: "pointer" }}
        >
          Keluar
        </button>
      </nav>
    </>
  );
}
