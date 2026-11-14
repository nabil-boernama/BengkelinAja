import { api } from "@/lib/apiClient";

const enc = encodeURIComponent;

// GET /parts (Admin, Owner) -> setiap item punya penanda stok_menipis
export function listParts() {
  return api.get("/parts");
}

// POST /parts (Admin). payload: { nama, harga, stok?, batas_minimum? }
export function createPart(payload) {
  return api.post("/parts", payload);
}

// PATCH /parts/:id (Admin). payload: sebagian dari { nama, harga, stok, batas_minimum }
export function updatePart(id, payload) {
  return api.patch(`/parts/${enc(id)}`, payload);
}

// DELETE /parts/:id (Admin)
export function deletePart(id) {
  return api.delete(`/parts/${enc(id)}`);
}
