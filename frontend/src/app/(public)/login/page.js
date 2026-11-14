"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { homePathForRole, useAuth } from "@/context/AuthContext";
import { canAccess, safeNextPath } from "@/lib/access";
import { useToast } from "@/components/ui/Toast";
import styles from "./login.module.css";

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
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.logo}>BengkelinAja</p>
        <h1 className={styles.title}>Masuk ke akun staf bengkel</h1>

        {busyText ? (
          <p className={styles.status} role="status">
            {busyText}
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label className={styles.field} htmlFor="login-username">
              <span className={styles.label}>Username</span>
              <input
                id="login-username"
                className={styles.input}
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

            <label className={styles.field} htmlFor="login-password">
              <span className={styles.label}>Password</span>
              <input
                ref={passwordRef}
                id="login-password"
                className={styles.input}
                type="password"
                name="password"
                autoComplete="current-password"
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? "login-error" : undefined}
              />
            </label>

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? "Memuat..." : "Masuk"}
            </button>

            {error && (
              <p id="login-error" className={styles.error} role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
