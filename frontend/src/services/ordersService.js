import { api } from "@/lib/apiClient";

const enc = encodeURIComponent;

// GET /orders?status=&plat= (Admin, Mekanik, Owner). Mekanik hanya menerima order miliknya.
export function listOrders({ status, plat } = {}) {
  return api.get("/orders", { query: { status, plat } });
}

// GET /orders/:id
export function getOrder(id) {
  return api.get(`/orders/${enc(id)}`);
}

// POST /orders (Admin)
// payload: { customer: { id } | { nama, no_wa? }, plat, keluhan, mekanik }
export function createOrder(payload) {
  return api.post("/orders", payload);
}

// PATCH /orders/:id (Admin). payload: { plat?, keluhan?, mekanik? }
export function updateOrder(id, payload) {
  return api.patch(`/orders/${enc(id)}`, payload);
}

// PATCH /orders/:id/status (Admin, Mekanik)
export function updateOrderStatus(id, status) {
  return api.patch(`/orders/${enc(id)}/status`, { status });
}

// PUT /orders/:id/service (Admin). items: [{ part, jumlah }]
export function recordService(id, { items = [], biaya_jasa }) {
  return api.put(`/orders/${enc(id)}/service`, { items, biaya_jasa });
}

// POST /orders/:id/cancel (Admin), hanya untuk status Antre atau Diperiksa
export function cancelOrder(id, alasan) {
  return api.post(`/orders/${enc(id)}/cancel`, { alasan });
}

// POST /orders/:id/revert (Admin), Selesai -> Dikerjakan
export function revertOrder(id, alasan) {
  return api.post(`/orders/${enc(id)}/revert`, alasan ? { alasan } : {});
}

// GET /orders/:id/notify-link (Admin, Mekanik) -> { url } wa.me
export function getNotifyLink(id) {
  return api.get(`/orders/${enc(id)}/notify-link`);
}

// GET /orders/:id/receipt (Admin), hanya untuk status Diambil -> Blob PDF
export async function getReceiptPdf(id) {
  const res = await api.get(`/orders/${enc(id)}/receipt`, { raw: true });
  return res.blob();
}

// GET /mechanics/workload (Admin) -> [{ id, nama, order_aktif }]
export function getMechanicWorkload() {
  return api.get("/mechanics/workload");
}
