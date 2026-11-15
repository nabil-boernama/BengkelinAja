"use client";

import AuthGuard from "@/components/ui/AuthGuard";

// Semua halaman staf wajib login; hak akses per peran dibaca dari path (lib/access.js).
export default function StaffGroupLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
