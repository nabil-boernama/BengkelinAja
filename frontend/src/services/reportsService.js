import { api } from "@/lib/apiClient";

export const REPORT_PERIODS = ["daily", "weekly", "monthly"];

// GET /reports/dashboard?period= (Owner)
// -> { period, total_pendapatan, total_order, stok_menipis: [...] }
export function getDashboard(period = "monthly") {
  return api.get("/reports/dashboard", { query: { period } });
}
