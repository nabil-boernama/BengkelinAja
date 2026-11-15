import { api } from "@/lib/apiClient";

const enc = encodeURIComponent;

// GET /customers?q= (cari nama atau nomor WA)
export function searchCustomers(q) {
  return api.get("/customers", { query: { q: q?.trim() } });
}

// GET /customers/:id/orders -> { customer, orders }
export function getCustomerOrders(id) {
  return api.get(`/customers/${enc(id)}/orders`);
}

// PATCH /customers/:id (Admin). payload: { nama?, no_wa? } (no_wa "" = hapus nomor)
export function updateCustomer(id, payload) {
  return api.patch(`/customers/${enc(id)}`, payload);
}
