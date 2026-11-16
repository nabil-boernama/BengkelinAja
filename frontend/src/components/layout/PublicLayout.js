"use client";

import Link from "next/link";
import { useState } from "react";

// Navbar publik (landing, login, cek status). Navbar .nav bersifat fixed;
// tiap halaman mengatur jarak atasnya sendiri (mis. .pub atau .hero).
// Di mobile, menu navigasi dibuka lewat tombol hamburger (.burger).
export default function PublicLayout({ children }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className={`nav${open ? " open" : ""}`}>
        <Link className="logo" href="/" onClick={close}>
          <img src="/logo.png" alt="BengkelinAja" />
        </Link>
        <nav id="menu-nav">
          <Link href="/#home" onClick={close}>Home</Link>
          <Link href="/#mengapa" onClick={close}>Why Choose Us</Link>
          <Link href="/#layanan" onClick={close}>Our Services</Link>
          <Link href="/#testimoni" onClick={close}>Testimonials</Link>
          <Link href="/#kontak" onClick={close}>Contact</Link>
        </nav>
        <div className="navr">
          <Link href="/cek-status" className="b b-s">
            Cek Status Servis
          </Link>
          <Link href="/login" className="b b-r" onClick={close}>
            Masuk Staf
          </Link>
          <button
            type="button"
            className="burger"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="menu-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      {children}
    </>
  );
}
