"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBackground from "@/components/layout/PageBackground";
import StatusMarker from "@/components/ui/StatusMarker";
import StatusStepper from "@/components/ui/StatusStepper";

const SAMPLE_ORDERS = {
  "14|AB 3456 CD": {
    status: "Dikerjakan",
    mekanik: "Rudi Hartono",
    tanggal: "12 Nov 2026, 09.15 WIB",
  },
  "13|AB 7788 EF": {
    status: "Diperiksa",
    mekanik: "Joko Prasetyo",
    tanggal: "12 Nov 2026, 10.05 WIB",
  },
  "12|AB 1122 GH": {
    status: "Selesai",
    mekanik: "Rudi Hartono",
    tanggal: "12 Nov 2026, 10.40 WIB",
  },
  "11|AB 9900 IJ": {
    status: "Antre",
    mekanik: "Joko Prasetyo",
    tanggal: "12 Nov 2026, 11.10 WIB",
  },
  "10|AB 2020 KL": {
    status: "Diambil",
    mekanik: "Rudi Hartono",
    tanggal: "11 Nov 2026, 13.30 WIB",
  },
  "9|AB 5566 MN": {
    status: "Dibatalkan",
    mekanik: "Joko Prasetyo",
    tanggal: "11 Nov 2026, 09.00 WIB",
  },
};

export default function CekStatusPage() {
  const [nomorAntrean, setNomorAntrean] = useState("");
  const [plat, setPlat] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [failures, setFailures] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining === 0) return undefined;

    const timer = window.setTimeout(() => {
      if (remaining === 1) {
        setRemaining(0);
        setFailures(0);
        setMessage("");
      } else {
        setRemaining(remaining - 1);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [remaining]);

  function handleSubmit(event) {
    event.preventDefault();
    if (remaining > 0) return;

    const normalizedNomor = nomorAntrean.trim();
    const normalizedPlat = plat.trim().toUpperCase().replace(/\s+/g, " ");
    const nextErrors = {
      nomorAntrean: !/^[1-9][0-9]*$/.test(normalizedNomor),
      plat: normalizedPlat.length < 3 || normalizedPlat.length > 15,
    };

    setErrors(nextErrors);
    setMessage("");
    setResult(null);

    if (nextErrors.nomorAntrean || nextErrors.plat) return;

    // TODO: Ganti data contoh dengan trackingService setelah endpoint publik difinalkan.
    const order = SAMPLE_ORDERS[`${normalizedNomor}|${normalizedPlat}`];

    if (!order) {
      const nextFailures = failures + 1;
      setFailures(nextFailures);

      if (nextFailures >= 4) {
        setFailures(4);
        setRemaining(45);
        setMessage("rate-limit");
      } else {
        setMessage("not-found");
      }

      return;
    }

    setFailures(0);
    setResult(order);
  }

  const messageText =
    message === "rate-limit"
      ? `Terlalu banyak pencarian. Coba lagi dalam ${remaining} detik.`
      : "Data servis tidak ditemukan. Periksa kembali nomor antrean dan plat nomor.";

  return (
    <>
      <PageBackground />
      <main
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "120px 20px 60px",
        }}
      >
        <section className="pn" style={{ width: "100%", maxWidth: 520 }}>
          <h1
            className="font-display"
            style={{ fontSize: "clamp(34px, 4.4vw, 52px)", lineHeight: 1.05 }}
          >
            Cek Status Servis
          </h1>
          <p className="muted" style={{ margin: "10px 0 24px" }}>
            Masukkan nomor antrean dan plat nomor yang diberikan bengkel.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="fld" htmlFor="nomor-antrean">
              <span>Nomor antrean</span>
              <input
                className="in"
                id="nomor-antrean"
                inputMode="numeric"
                autoComplete="off"
                value={nomorAntrean}
                onChange={(event) => setNomorAntrean(event.target.value)}
                aria-invalid={Boolean(errors.nomorAntrean)}
                aria-describedby={
                  errors.nomorAntrean ? "nomor-antrean-error" : undefined
                }
              />
              {errors.nomorAntrean && (
                <span className="err" id="nomor-antrean-error" role="alert">
                  Nomor antrean harus berupa angka minimal 1
                </span>
              )}
            </label>

            <label className="fld" htmlFor="plat">
              <span>Plat nomor</span>
              <input
                className="in"
                id="plat"
                autoComplete="off"
                placeholder="AB 1234 CD"
                style={{ textTransform: "uppercase" }}
                value={plat}
                onChange={(event) => setPlat(event.target.value.toUpperCase())}
                aria-invalid={Boolean(errors.plat)}
                aria-describedby={errors.plat ? "plat-error" : undefined}
              />
              {errors.plat && (
                <span className="err" id="plat-error" role="alert">
                  Plat nomor 3 sampai 15 karakter
                </span>
              )}
            </label>

            {message && (
              <div className="ermsg" role="alert" aria-live="polite">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3l10 18H2z" />
                  <path d="M12 10v5M12 18.5v.1" />
                </svg>
                <span>{messageText}</span>
              </div>
            )}

            <button className="b b-p full" type="submit" disabled={remaining > 0}>
              {remaining > 0 ? `Coba lagi dalam ${remaining} detik` : "Cek Status"}
            </button>
          </form>

          <p className="help" style={{ marginTop: 16 }}>
            Contoh untuk dicoba: 14 dan AB 3456 CD. Isian tidak disimpan di alamat
            atau peramban.
          </p>
        </section>

        {result && result.status !== "Dibatalkan" && (
          <section
            className="pn"
            style={{ width: "100%", maxWidth: 520, marginTop: 20 }}
            aria-live="polite"
          >
            <StatusMarker status={result.status} big />
            <StatusStepper status={result.status} />
            <div className="kv" style={{ marginTop: 16 }}>
              <div className="l">Tanggal masuk</div>
              <div>{result.tanggal}</div>
              <div className="l">Mekanik</div>
              <div>{result.mekanik}</div>
            </div>
          </section>
        )}

        {result?.status === "Dibatalkan" && (
          <section
            className="pn"
            style={{ width: "100%", maxWidth: 520, marginTop: 20 }}
            aria-live="polite"
          >
            <StatusMarker status="Dibatalkan" big showBars={false} />
            <p className="muted" style={{ marginTop: 10 }}>
              Order ini dibatalkan. Hubungi bengkel untuk informasi lebih lanjut.
            </p>
          </section>
        )}

        <Link className="b b-g" style={{ marginTop: 28 }} href="/">
          Kembali ke beranda
        </Link>
      </main>
    </>
  );
}
