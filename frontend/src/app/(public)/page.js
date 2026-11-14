import Link from "next/link";

const WA_URL = "https://wa.me/6281371846810";

const LAYANAN = [
  ["01", "Servis Berkala", "01-servis-berkala.jpg"],
  ["02", "Ganti Oli", "02-ganti-oli.jpg"],
  ["03", "Servis Mesin", "03-servis-mesin.jpg"],
  ["04", "Servis Rem", "04-servis-rem.jpg"],
  ["05", "Servis Kelistrikan", "05-servis-kelistrikan.jpg"],
  ["06", "Servis Ban dan Roda", "06-servis-ban-dan-roda.jpg"],
  ["07", "Servis CVT dan Transmisi", "07-servis-cvt-dan-transmisi.jpg"],
  ["08", "Servis Suspensi", "08-servis-suspensi.jpg"],
  ["09", "Tune Up Motor", "09-tune-up-motor.jpg"],
  ["10", "Penggantian Suku Cadang", "10-penggantian-suku-cadang.jpg"],
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
  return (
    <>
      <div className="pgbg" aria-hidden="true">
        <i className="a" />
        <i className="b" />
        <i className="c" />
        <i className="rb" />
      </div>

      <section className="hero" id="home">
        <div className="hov" />
        <div className="hin">
          <span className="lab">Laju Jaya &middot; Mode Reguler</span>
          <h1>Servis motor jadi jelas.</h1>
          <p className="lead">
            Pantau motor Anda dari antre sampai siap diambil. Lihat rincian suku cadang dan biaya jasa, tanpa perlu
            menelepon bengkel.
          </p>
          <div className="hbtn">
            <Link className="b b-r big" href="/cek-status">
              Cek Status Servis
              <ArrowIcon />
            </Link>
          </div>
          <div className="strip">
            <div>
              <span className="lab">Jam buka</span>
              <b>Senin sampai Sabtu</b>
            </div>
            <div>
              <span className="lab">Waktu</span>
              <b>08.00 sampai 17.00</b>
            </div>
            <div>
              <span className="lab">Layanan</span>
              <b>Servis, ganti oli, suku cadang, dan lainnya</b>
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
            <h2 className="st">Why Choose Us</h2>
            <div className="wrow">
              <div className="wc c-s">
                <div className="n">01</div>
                <h3>Convenience</h3>
                <div className="t">Cek status tanpa telepon.</div>
                <p>
                  Masukkan nomor antrean dan plat nomor. Status motor Anda tampil seketika, dari Antre sampai Selesai.
                </p>
              </div>
              <div className="wc c-r">
                <div className="n">02</div>
                <h3>Transparency</h3>
                <div className="t">Status yang jelas.</div>
                <p>Pantau tiap tahap servis dari Antre sampai Diambil, jadi Anda tahu motor sudah sampai mana.</p>
              </div>
              <div className="wc c-m">
                <div className="n">03</div>
                <h3>Reliability</h3>
                <div className="t">Bergaransi 3 bulan.</div>
                <p>
                  Setiap perbaikan bergaransi, dan stok suku cadang dipantau agar pengerjaan tidak tertahan menunggu
                  barang.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="layanan">
          <div className="ct">
            <h2 className="st">Our Services</h2>
          </div>
          <div className="marq">
            <div className="mtrack slow">
              {[...LAYANAN, ...LAYANAN].map(([no, nama, img], i) => (
                <article key={i} className="sc" aria-hidden={i >= LAYANAN.length || undefined}>
                  <img src={`/img/${img}`} alt="" />
                  <div className="cap">
                    <span>{no}</span>
                    <h3>{nama}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="ct cta">
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
            <h2 className="st">Testimonials</h2>
          </div>
          <div className="marq">
            <TestimoniTrack items={TESTIMONI_1} className="mtrack" />
            <TestimoniTrack items={TESTIMONI_2} className="mtrack rev" />
          </div>
        </section>

        <section className="sec stats" id="statistik">
          <div className="ct">
            <div className="srow">
              <div className="sb sb-s">
                <i className="tick" />
                <div className="v">8</div>
                <div className="l">Tahun menemani perjalanan</div>
              </div>
              <div className="sb sb-r">
                <i className="halo" />
                <i className="ring r1" />
                <i className="ring r2" />
                <i className="tick" />
                <div className="v">1.200+</div>
                <div className="l">Motor dirawat</div>
              </div>
              <div className="sb sb-p">
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
              <div className="cl">
                <span className="lab2">KONTAK</span>
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
              <div className="cm">
                <div className="mapbg" />
                <iframe
                  title="Peta lokasi"
                  loading="lazy"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=110.3600%2C-7.7760%2C110.3860%2C-7.7600&layer=mapnik"
                />
                <div className="mi">
                  <b>Laju Jaya, Fakultas Teknik UGM, Jl. Grafika No. 2, Yogyakarta 55281</b>
                  <span>Senin sampai Sabtu, 08.00 sampai 17.00 WIB</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="foot">
          <div className="ct">
            <img src="/logo.png" alt="BengkelinAja" />
            <nav>
              <a href="#mengapa">Mengapa kami</a>
              <a href="#layanan">Layanan</a>
              <a href="#testimoni">Testimoni</a>
              <a href="#kontak">Kontak</a>
              <Link href="/cek-status">Cek Status</Link>
            </nav>
            <p>&copy; 2026 BengkelinAja. Dibuat untuk Laju Jaya.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
