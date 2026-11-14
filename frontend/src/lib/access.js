// Hak akses halaman staf per peran (peran sudah dinormalisasi: "admin" | "mekanik" | "owner").
// Dipakai AuthGuard (cek akses) dan StaffLayout (menyembunyikan menu yang tidak boleh diakses).
export const ROUTE_ACCESS = {
  "/orders": ["admin", "mekanik", "owner"], // Owner: hanya lihat
  "/orders/new": ["admin"],                 // Order Baru: hanya admin
  "/customers": ["admin", "mekanik", "owner"],
  "/parts": ["admin", "owner"],
  "/dashboard": ["owner"],
};

export const ROLE_LABEL = {
  admin: "Admin",
  mekanik: "Mekanik",
  owner: "Owner",
};

// "/orders/123" -> ["admin", "mekanik", "owner"]; null bila path tidak dibatasi peran
export function rolesForPath(pathname = "") {
  const base = Object.keys(ROUTE_ACCESS).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  return base ? ROUTE_ACCESS[base] : null;
}

export function canAccess(role, pathname) {
  const roles = rolesForPath(pathname);
  return roles === null || roles.includes(role);
}

// Untuk halaman login: pakai ?next= hanya bila path internal (cegah open redirect ke situs lain)
export function safeNextPath(next) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  return next;
}
