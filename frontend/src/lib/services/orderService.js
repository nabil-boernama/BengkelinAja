// Fungsi order yang dipakai halaman daftar dan detail order.
// Request sebenarnya ada di @/services/ordersService (apiClient: Bearer token, prefix /api,
// unwrap { success, data }), supaya path endpoint hanya didefinisikan di satu tempat.
import { getOrder, listOrders, updateOrderStatus as patchOrderStatus } from "@/services/ordersService";

// GET /api/orders?status=&plat=
export async function getOrders({ status, plat, tanggal } = {}) {
  return listOrders({ status, plat, tanggal });
}

// GET /api/orders/:id -> order + items (rincian suku cadang) + total_biaya
export async function getOrderById(id) {
  return getOrder(id);
}

// PATCH /api/orders/:id/status
export async function updateOrderStatus(id, status) {
  return patchOrderStatus(id, status);
}
