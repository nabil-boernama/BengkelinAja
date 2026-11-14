"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { homePathForRole, useAuth } from "@/context/AuthContext";
import { rolesForPath } from "@/lib/access";
import PageBackground from "@/components/layout/PageBackground";

const centerStyle = {
  position: "relative",
  zIndex: 2,
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 20,
};

function FullScreen({ children }) {
  return (
    <>
      <PageBackground />
      <main style={centerStyle}>{children}</main>
    </>
  );
}

/**
 * Lindungi halaman staf.
 * - Belum login  -> redirect ke /login?next=<path sekarang> (plus &expired=1 bila sesi habis)
 * - Peran tidak berhak -> halaman 403
 *
 * `roles` (opsional, huruf kecil) menimpa aturan bawaan dari lib/access.js.
 * Tanpa `roles`, hak akses dibaca dari path: /orders, /customers, /parts, /dashboard.
 */
export default function AuthGuard({ roles, children }) {
  const { user, role, loading, sessionExpired, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allowedRoles = roles ?? rolesForPath(pathname);
  const allowed = !allowedRoles || allowedRoles.includes(role);

  useEffect(() => {
    if (loading || user) return;
    const current = `${pathname}${window.location.search}`;
    const params = new URLSearchParams({ next: current });
    if (sessionExpired) params.set("expired", "1");
    router.replace(`/login?${params.toString()}`);
  }, [loading, user, sessionExpired, pathname, router]);

  if (loading || !user) {
    return (
      <FullScreen>
        <p className="muted" role="status">
          {loading ? "Memuat sesi…" : "Mengarahkan ke halaman login…"}
        </p>
      </FullScreen>
    );
  }

  if (!allowed) {
    return (
      <FullScreen>
        <div className="pn" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <p className="font-display" style={{ fontSize: 64, lineHeight: 1, color: "var(--red)" }}>
            403
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 8px" }}>Akses ditolak</h1>
          <p className="muted" style={{ marginBottom: 24 }}>
            Akun {user.nama || user.username} ({user.peran}) tidak punya akses ke halaman ini.
          </p>
          <div className="row" style={{ justifyContent: "center" }}>
            <Link href={homePathForRole(role)} className="b b-p sm">
              Ke halaman utama
            </Link>
            <button type="button" className="b b-g sm" onClick={logout}>
              Keluar
            </button>
          </div>
        </div>
      </FullScreen>
    );
  }

  return children;
}
