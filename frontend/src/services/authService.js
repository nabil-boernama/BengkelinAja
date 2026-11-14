import { api } from "@/lib/apiClient";

export function login(username, password) {
  return api.post("/auth/login", { username, password }, { auth: false });
}

export function getMe() {
  return api.get("/auth/me");
}

export function logout() {
  return api.post("/auth/logout");
}