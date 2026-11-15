import Link from "next/link";
import PublicLayout from "@/components/layout/PublicLayout";

export default function NotFound() {
  return (
    <PublicLayout>
      <div
        style={{
          minHeight: "calc(100dvh - var(--pub-nav-h))",
          display: "grid",
          placeItems: "center",
        }}
      >
        <section
          className="pn"
          style={{ width: "100%", maxWidth: 480, textAlign: "center" }}
        >
          <div
            className="font-display"
            style={{ fontSize: "clamp(80px, 14vw, 140px)", lineHeight: 1 }}
            aria-hidden="true"
          >
            404
          </div>
          <h1 style={{ fontSize: 30, margin: "8px 0 10px" }}>
            Halaman tidak ditemukan
          </h1>
          <p className="muted" style={{ marginBottom: 26 }}>
            Alamat yang Anda buka tidak ada atau sudah dipindahkan.
          </p>
          <Link className="b b-p" href="/">
            Kembali ke beranda
          </Link>
        </section>
      </div>
    </PublicLayout>
  );
}
