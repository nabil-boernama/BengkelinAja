"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { homePathForRole, useAuth } from "@/context/AuthContext";
import { canAccess, safeNextPath } from "@/lib/access";
import { useToast } from "@/components/ui/Toast";

// Tujuan setelah login: ?next= bila aman dan boleh dibuka peran ini, selain itu halaman utama peran.
function redirectTarget(role) {
  const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
  if (next) {
    const path = next.split(/[?#]/)[0];
    if (path !== "/login" && canAccess(role, path)) return next;
  }
  return homePathForRole(role);
}

function errorMessage(err) {
  if (err?.status === 429) {
    const minutes = err.retryAfter ? Math.ceil(err.retryAfter / 60) : null;
    return minutes
      ? `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`
      : "Terlalu banyak percobaan login. Coba lagi nanti.";
  }
  if (err?.status === 400 && err.errors?.length) return err.errors[0].message;
  return err?.message || "Terjadi kesalahan. Coba lagi.";
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, role, loading, setSession, clearSessionExpired } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusPassword, setFocusPassword] = useState(0); // dinaikkan untuk memindah fokus ke password
  const passwordRef = useRef(null);
  const expiredShown = useRef(false);

  // Fokus dipindah setelah render, karena saat submit input masih disabled dan focus() akan gagal.
  useEffect(() => {
    if (focusPassword) passwordRef.current?.focus();
  }, [focusPassword]);

  // Sudah login (token valid menurut /auth/me) atau baru saja berhasil login: alihkan.
  useEffect(() => {
    if (!loading && user) router.replace(redirectTarget(role));
  }, [loading, user, role, router]);

  // ?expired=1 dari AuthGuard: beri tahu sekali, lalu buang parameter dari URL
  // agar toast tidak muncul lagi saat halaman dimuat ulang.
  useEffect(() => {
    if (expiredShown.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") !== "1") return;
    expiredShown.current = true;
    toast.error("Sesi habis, silakan login kembali");
    clearSessionExpired();
    params.delete("expired");
    const qs = params.toString();
    window.history.replaceState(null, "", `/login${qs ? `?${qs}` : ""}`);
  }, [toast, clearSessionExpired]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const data = await api.post(
        "/auth/login", // BASE_URL sudah berisi /api
        { username: cleanUsername, password },
        { auth: false }
      );
      // simpan ba_token + ba_user dan perbarui AuthContext; redirect ditangani effect di atas
      setSession(data?.token, data?.user);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
      if (err?.status === 401) {
        setPassword("");
        setFocusPassword((n) => n + 1);
      }
    }
  }

  // Selama sesi lama diperiksa, atau saat sedang dialihkan, form tidak ditampilkan.
  const busyText = loading ? "Memeriksa sesi…" : user ? "Mengalihkan…" : null;

  return (
    <>
      <div className="pgbg" aria-hidden="true">
        <i className="a" />
        <i className="b" />
        <i className="c" />
        <i className="rb" />
      </div>
      <main className="pub">
        <div className="pn" style={{ maxWidth: 440 }}>
          <img src="/logo.png" alt="BengkelinAja" style={{ height: 46, marginBottom: 24 }} />
          <h1 className="pt">Masuk Staf</h1>
          <p className="muted" style={{ margin: "10px 0 24px" }}>
            Khusus untuk Admin, Mekanik, dan Owner Bengkel Laju Jaya.
          </p>

          {busyText ? (
            <p className="muted" role="status">
              {busyText}
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <label className="fld" htmlFor="login-username">
                <span>Username</span>
                <input
                  id="login-username"
                  className="in"
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  autoFocus
                />
              </label>

              <label className="fld" htmlFor="login-password">
                <span>Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    ref={passwordRef}
                    id="login-password"
                    className="in"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    maxLength={100}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={error ? "login-error" : undefined}
                    style={{ paddingRight: 64 }}
                  />
                  <button
                    type="button"
                    className="ib"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    aria-pressed={showPassword}
                    style={{ position: "absolute", right: 6, top: 6, width: 44, height: 44 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <path d="M4 4l16 16" />}
                    </svg>
                  </button>
                </div>
              </label>

              {error && (
                <div id="login-error" className="ermsg on" role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l10 18H2z" />
                    <path d="M12 10v5M12 18.5v.1" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="b b-r big full" disabled={submitting}>
                {submitting ? "Memuat..." : "Masuk"}
                <span className="ar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </span>
              </button>
              <Link href="/" className="b b-g full" style={{ marginTop: 12 }}>
                Kembali ke beranda
              </Link>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
