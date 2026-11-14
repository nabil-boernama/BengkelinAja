import Link from "next/link";
import PageBackground from "@/components/layout/PageBackground";
import styles from "./PublicLayout.module.css";

// Kerangka halaman publik (pelanggan): navbar dengan logo dan link ke /track.
export default function PublicLayout({ children }) {
  return (
    <>
      <PageBackground />
      <header className={styles.nav}>
        <Link href="/" className={styles.logo} aria-label="BengkelinAja, ke beranda">
          Bengkelin<span>Aja</span>
        </Link>
        <Link href="/track" className="b b-p sm">
          Lacak Servis
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
    </>
  );
}
