"use client";

import Link from "next/link";
import { useEffect } from "react";
import ScrollTopOnLoad from "@/components/landing/ScrollTopOnLoad";
import ServicesCarousel from "@/components/landing/ServicesCarousel";

const WA_URL = "https://wa.me/6281371846810";

const LAYANAN = [
  ["Ganti Aki", "ganti-aki.jpg"],
  ["Servis Berkala", "servis-berkala.jpg"],
  ["Servis CVT dan Transmisi", "servis-cvt-dan-transmisi.jpg"],
  ["Servis Kelistrikan", "servis-kelistrikan.jpg"],
  ["Servis Mesin", "servis-mesin.jpg"],
  ["Servis Rem", "servis-rem.jpg"],
  ["Servis Suspensi", "servis-suspensi.jpg"],
  ["Tune Up Motor", "tune-up-motor.jpg"],
];

const TESTIMONI_1 = [
  ["t-s", "Andi Pratama", "Pelayanannya ramah dan pengerjaannya cepat. Motor saya jadi lebih nyaman dipakai setelah servis di sini."],
  ["t-c", "Dimas Saputra", "Mekaniknya berpengalaman dan menjelaskan kerusakan motor dengan detail. Harga servis juga cukup terjangkau."],
  ["t-r", "Rizky Maulana", "Tempat servisnya bersih dan nyaman. Proses ganti oli dan pengecekan motor juga tidak membutuhkan waktu lama."],
  ["t-m", "Fajar Ramadhan", "Sudah beberapa kali servis di sini dan selalu puas dengan hasilnya. Kualitas pelayanannya konsisten."],
  ["t-p", "Nadia Putri", "Suka banget dengan pelayanannya. Mekaniknya sabar menjelaskan masalah motor dan tidak asal mengganti spare part."],
];

const TESTIMONI_2 = [
  ["t-m", "Agus Setiawan", "Servis CVT di sini hasilnya memuaskan. Tarikan motor terasa lebih ringan dan suara mesin juga lebih halus."],
  ["t-s", "Rina Amelia", "Pendaftaran mudah dan pelayanannya tepat waktu. Sangat membantu untuk yang punya aktivitas padat."],
  ["t-r", "Budi Santoso", "Harga servis transparan dan pengerjaannya rapi. Sebelum melakukan perbaikan, mekanik selalu konfirmasi terlebih dahulu."],
  ["t-p", "Yoga Firmansyah", "Pernah mengalami masalah rem dan langsung ditangani dengan baik. Sekarang motor terasa lebih aman digunakan."],
  ["t-c", "Siti Rahmawati", "Pengalaman servis yang menyenangkan. Stafnya ramah, tempatnya nyaman, dan hasil pengerjaannya sesuai harapan."],
];

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function ArrowIcon() {
  return (
    <span className="ar">
      <svg strokeWidth="2.2" {...svgProps}>
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </span>
  );
}

// Marquee CSS butuh isi yang diulang dua kali agar putarannya mulus; salinan kedua disembunyikan dari pembaca layar.
function TestimoniTrack({ items, className }) {
  return (
    <div className={className}>
      {[...items, ...items].map(([tone, nama, isi], i) => (
        <article key={i} className={`tc ${tone}`} aria-hidden={i >= items.length || undefined}>
          <h4>{nama}</h4>
          <hr />
          <p>&ldquo;{isi}&rdquo;</p>
        </article>
      ))}
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ScrollTopOnLoad />
      <div className="pgbg" aria-hidden="true">
        <i className="a" />
        <i className="b" />
        <i className="c" />
        <i className="rb" />
      </div>

      <section className="hero" id="home">
        <div className="hov" />
        <div className="hin">
          <h1>Motor Bermasalah?<br />BengkelinAja!</h1>
          <p className="lead">
            Nikmati kemudahan dalam memenuhi kebutuhan servis dan perawatan motormu. Bersama BengkelinAja, rawat motor
            jadi lebih praktis dan nyaman.
          </p>
          <div className="hbtn">
            <Link className="b b-r big" href="/cek-status">
              Cek Status Servis
              <ArrowIcon />
            </Link>
          </div>
          <div className="strip">
            <div className="ops">
              <span className="lab">JAM OPERASIONAL</span>
              <b className="ops-day">Senin &ndash; Sabtu</b>
              <span className="ops-time">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                08.00 &ndash; 17.00 WIB
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="gw">
        <div className="fx" aria-hidden="true">
          <i className="bl b1" />
          <i className="bl b2" />
          <i className="bl b3" />
          <i className="bl b4" />
          <i className="bl b5" />
          <i className="bl b6" />
          <i className="bl b7" />
          <i className="rib r1" />
          <i className="rib r2" />
          <i className="rib r3" />
          <i className="ht h1" />
          <i className="ht h2" />
          <i className="ht h3" />
          <i className="ht h4" />
          <svg className="cv" viewBox="0 0 1440 4800" preserveAspectRatio="none">
            <path d="M-50 300 C 400 120, 900 520, 1500 260" />
            <path d="M-50 420 C 500 260, 950 640, 1500 380" />
            <path d="M-50 1700 C 420 1500, 980 1900, 1500 1640" />
            <path d="M-50 3300 C 450 3100, 900 3500, 1500 3240" />
            <path d="M-50 4100 C 450 3950, 900 4250, 1500 4020" />
          </svg>
        </div>

        <section className="sec" id="mengapa">
          <div className="ct">
            <h2 className="st reveal">Why Choose Us</h2>
            <div className="wrow">
              <div className="wc c-s reveal reveal-delay-1">
                <h3>Convenience</h3>
                <div className="t">Cek status tanpa telepon</div>
                <p>Pantau proses servis motormu kapan saja, mulai dari antre hingga selesai</p>
              </div>
              <div className="wc c-r reveal reveal-delay-2">
                <h3>Transparency</h3>
                <div className="t">Rincian biaya yang jelas</div>
                <p>Ketahui rincian biaya jasa dan suku cadang secara transparan</p>
              </div>
              <div className="wc c-m reveal reveal-delay-3">
                <h3>Quality</h3>
                <div className="t">Pengerjaan dengan teliti</div>
                <p>Setiap motor ditangani dengan cermat dan mengutamakan kualitas</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="layanan">
          <div className="ct">
            <h2 className="st reveal">Our Services</h2>
          </div>
          <ServicesCarousel items={LAYANAN} />
          <div className="ct cta reveal">
            <a
              className="b b-r big"
              href={`${WA_URL}?text=${encodeURIComponent("Halo Laju Jaya, saya ingin konsultasi servis motor.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg strokeWidth="1.8" {...svgProps}>
                <path d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.5z" />
                <path d="M9 9.5c.3 2 2.3 4.2 4.5 5l1.4-1.2-1.8-1-.8.7c-.8-.4-1.5-1.1-1.9-1.9l.7-.8-1-1.8z" />
              </svg>
              Konsultasi via Whatsapp
            </a>
          </div>
        </section>

        <section className="sec" id="testimoni">
          <div className="ct">
            <h2 className="st reveal">Testimonials</h2>
          </div>
          <div className="marq marq-t">
            <TestimoniTrack items={TESTIMONI_1} className="mtrack" />
            <TestimoniTrack items={TESTIMONI_2} className="mtrack rev" />
          </div>
        </section>

        <section className="sec stats" id="statistik">
          <div className="ct">
            <div className="srow">
              <div className="sb sb-s reveal reveal-delay-1">
                <i className="tick" />
                <div className="v">8</div>
                <div className="l">Tahun menemani perjalanan</div>
              </div>
              <div className="sb sb-r reveal reveal-delay-2">
                <i className="halo" />
                <i className="ring r1" />
                <i className="ring r2" />
                <i className="tick" />
                <div className="v">1.200+</div>
                <div className="l">Motor dirawat</div>
              </div>
              <div className="sb sb-p reveal reveal-delay-3">
                <i className="tick" />
                <div className="v">98%</div>
                <div className="l">Pelanggan puas</div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="kontak">
          <div className="ct">
            <div className="cg">
              <div className="cl reveal reveal-delay-1">
                <span className="lab2">CONTACT</span>
                <h2>
                  GET IN
                  <br />
                  TOUCH
                </h2>
                <a className="ch" href={WA_URL} target="_blank" rel="noopener noreferrer">
                  <span className="ci">
                    <svg strokeWidth="1.8" {...svgProps}>
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" />
                    </svg>
                  </span>
                  <span>
                    <b>WhatsApp</b>
                    <em>0813 7184 6810</em>
                  </span>
                </a>
                <a className="ch" href="#">
                  <span className="ci">
                    <svg strokeWidth="1.8" {...svgProps}>
                      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
                    </svg>
                  </span>
                  <span>
                    <b>Instagram</b>
                    <em>@bengkelinaja</em>
                  </span>
                </a>
                <a className="ch" href="mailto:bengkelinaja@gmail.com">
                  <span className="ci">
                    <svg strokeWidth="1.8" {...svgProps}>
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M4 7l8 6 8-6" />
                    </svg>
                  </span>
                  <span>
                    <b>Email</b>
                    <em>bengkelinaja@gmail.com</em>
                  </span>
                </a>
              </div>
              <div className="cm reveal reveal-delay-2">
                <div className="mapbg" />
                <iframe
                  title="Peta lokasi Fakultas Teknik UGM"
                  loading="lazy"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=110.3700%2C-7.7695%2C110.3780%2C-7.7625&layer=mapnik&marker=-7.7660%2C110.3740"
                />
                <a
                  className="mi"
                  href="https://www.google.com/maps/search/?api=1&query=Fakultas+Teknik+Universitas+Gadjah+Mada"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <b>Fakultas Teknik UGM, Jl. Grafika No. 2, Yogyakarta 55281</b>
                  <span>Senin &ndash; Sabtu<br />08.00 &ndash; 17.00 WIB</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
