const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_KEY = "ba_token";

// Galat standar: semua halaman cukup menangkap ApiError
export class ApiError extends Error {
  constructor(message, status, retryAfter = null) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 = server tidak terjangkau
    this.retryAfter = retryAfter; // detik, untuk 429
  }
}

// ----- token (localStorage, dibungkus try/catch) -----
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// AuthContext mendaftarkan fungsi ini agar sesi berakhir otomatis saat 401
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// ----- fungsi dasar -----
async function request(path, { method = "GET", body, auth = true, raw = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Periksa koneksi Anda.", 0);
  }

  // token kedaluwarsa atau akun nonaktif: akhiri sesi
  if (res.status === 401 && token) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
  }

  if (!res.ok) {
    let message = "Terjadi kesalahan. Coba lagi.";
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {}
    const retryAfter = Number(res.headers.get("Retry-After")) || null;
    throw new ApiError(message, res.status, retryAfter);
  }

  if (raw) return res; // dipakai untuk unduhan PDF
  if (res.status === 204) return null;
  return res.json();
}

// ----- jalan pintas yang dipakai services/ -----
export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};