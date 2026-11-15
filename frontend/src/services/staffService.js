import { api } from "@/lib/apiClient";

const enc = encodeURIComponent;

// GET /staff (Owner) -> [{ _id, nama, username, peran, aktif }]
export function listStaff() {
  return api.get("/staff");
}

// POST /staff (Owner). payload: { nama, username, password, peran }
export function createStaff(payload) {
  return api.post("/staff", payload);
}

// PUT /staff/:id (Owner). payload: sebagian dari { nama, username, peran }; password tidak bisa diubah
export function updateStaff(id, payload) {
  return api.put(`/staff/${enc(id)}`, payload);
}

// PATCH /staff/:id/toggle-aktif (Owner): aktifkan <-> nonaktifkan akun
export function toggleStaffAktif(id) {
  return api.patch(`/staff/${enc(id)}/toggle-aktif`);
}
