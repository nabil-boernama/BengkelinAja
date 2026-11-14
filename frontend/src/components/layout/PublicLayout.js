import Link from "next/link";

// Navbar publik (landing, login, cek status). Navbar .nav bersifat fixed;
// tiap halaman mengatur jarak atasnya sendiri (mis. .pub atau .hero).
export default function PublicLayout({ children }) {
  return (
    <>
      <header className="nav">
        <Link className="logo" href="/">
          <img src="/logo.png" alt="BengkelinAja" />
        </Link>
        <nav>
          <Link href="#">Layanan</Link>
          <Link href="#">Tentang Kami</Link>
          <Link href="#">Kontak</Link>
        </nav>
        <div className="navr">
          <Link href="/cek-status" className="b b-s">
            Cek Status
          </Link>
          <Link href="/login" className="b b-r">
            Masuk Staf
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
