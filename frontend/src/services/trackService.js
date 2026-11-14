import { api } from "@/lib/apiClient";

// GET /track?no_antrean=&plat= (publik, tanpa token, dibatasi rate limit)
// -> { status, tanggal, mekanik }. 404 bila data tidak ditemukan.
export function trackOrder(noAntrean, plat) {
  return api.get("/track", {
    auth: false,
    query: { no_antrean: noAntrean, plat: plat?.trim() },
  });
}
