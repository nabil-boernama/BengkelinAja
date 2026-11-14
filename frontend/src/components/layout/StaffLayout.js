"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccess, ROLE_LABEL } from "@/lib/access";
import PageBackground from "@/components/layout/PageBackground";
import styles from "./StaffLayout.module.css";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const NAV_ITEMS = [
  {
    href: "/orders",
    label: "Order Servis",
    icon: (
      <svg {...svgProps}>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Pelanggan",
    icon: (
      <svg {...svgProps}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2" />
      </svg>
    ),
  },
  {
    href: "/parts",
    label: "Suku Cadang",
    icon: (
      <svg {...svgProps}>
        <path d="M14.7 6.3a4 4 0 00-5.4 5.2L3.5 17.3a1.8 1.8 0 002.5 2.5l5.8-5.8a4 4 0 005.2-5.4l-2.6 2.6-2.3-.5-.5-2.3z" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg {...svgProps}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
];

function Logo() {
  return (
    <span className={styles.logo}>
      Bengkelin<span>Aja</span>
    </span>
  );
}

/**
 * Kerangka halaman staf: sidebar (laci di HP) + area konten.
 * Pakai di dalam AuthGuard, mis. di app/(staff)/layout.js:
 *   <AuthGuard><StaffLayout>{children}</StaffLayout></AuthGuard>
 */
export default function StaffLayout({ children }) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => canAccess(role, item.href));
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  // Esc menutup laci
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace("/login");
  }

  return (
    <div className={`${styles.shell} ${open ? styles.open : ""}`}>
      <PageBackground />

      <header className={styles.topbar}>
        <button
          type="button"
          className="ib"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          aria-expanded={open}
          aria-controls="staff-sidebar"
        >
          <svg {...svgProps}>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Logo />
      </header>

      <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside id="staff-sidebar" className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <Logo />
          <button
            type="button"
            className={`ib ${styles.closeBtn}`}
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <svg {...svgProps}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav} aria-label="Menu utama">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className={styles.user}>
            <div className={styles.userName}>{user.nama || user.username}</div>
            <div className={styles.userRole}>{ROLE_LABEL[role] || user.peran}</div>
            <button type="button" className="b b-g sm full" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        )}
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
