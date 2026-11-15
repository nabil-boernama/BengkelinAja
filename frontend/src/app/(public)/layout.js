import PublicLayout from "@/components/layout/PublicLayout";

// Layout untuk semua halaman publik: /login, /track, dst.
export default function PublicGroupLayout({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}
