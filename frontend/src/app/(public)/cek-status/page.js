"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBackground from "@/components/layout/PageBackground";
import StatusMarker from "@/components/ui/StatusMarker";
import StatusStepper from "@/components/ui/StatusStepper";
import { ApiError } from "@/lib/apiClient";
import { formatTanggal } from "@/lib/format";
import { getTrackReceiptPdf, trackOrder } from "@/services/trackService";

const RECEIPT_AVAILABLE_STATUSES = ["Selesai", "Diambil"];

export default function CekStatusPage() {
  const [nomorAntrean, setNomorAntrean] = useState("");
  const [plat, setPlat] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [receiptLookup, setReceiptLookup] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || remaining > 0) return;

    const normalizedNomor = nomorAntrean.trim();
    const normalizedPlat = plat.trim().toUpperCase().replace(/\s+/g, " ");
    const nextErrors = {
      nomorAntrean: !/^[1-9][0-9]*$/.test(normalizedNomor),
      plat: normalizedPlat.length < 3 || normalizedPlat.length > 15,
    };

    setErrors(nextErrors);
    setMessage("");
    setResult(null);
    setReceiptLookup(null);

    if (nextErrors.nomorAntrean || nextErrors.plat) return;

    setSubmitting(true);
    try {
      const order = await trackOrder(normalizedNomor, normalizedPlat);
      setResult(order);
      setReceiptLookup({ noAntrean: normalizedNomor, plat: normalizedPlat });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;

      if (error.status === 404) {
        setMessage("not-found");
      } else if (error.status === 429) {
        setRemaining(error.retryAfter || 60);
        setMessage("rate-limit");
      } else {
        setMessage(error.message || "Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewReceipt() {
    if (!receiptLookup || receiptLoading) return;

    const tab = window.open("", "_blank");
    setReceiptLoading(true);
    try {
      const blob = await getTrackReceiptPdf(
        receiptLookup.noAntrean,
        receiptLookup.plat
      );
      const url = URL.createObjectURL(blob);
      if (tab) {
        tab.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `struk-${receiptLookup.noAntrean}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      tab?.close();
      setMessage(error?.message || "Gagal membuka struk.");
    } finally {
      setReceiptLoading(false);
    }
  }

  const messageText =
    message === "rate-limit"
      ? `Terlalu banyak pencarian. Coba lagi dalam ${remaining} detik.`
      : message === "not-found"
        ? "Data servis tidak ditemukan. Periksa kembali nomor antrean dan plat nomor."
        : message;

  return (
    <>
      <PageBackground />
      <main className="pub">
        <section className="pn" style={{ width: "100%", maxWidth: 520 }}>
          <img
            src="/logo.png"
            alt="BengkelinAja"
            style={{ height: 46, marginBottom: 24 }}
          />
          <h1 className="pt">Cek Status Servis</h1>
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

            <button
              className="b b-p full"
              type="submit"
              disabled={submitting || remaining > 0}
            >
              {submitting
                ? "Mencari status..."
                : remaining > 0
                  ? `Coba lagi dalam ${remaining} detik`
                  : "Cek Status"}
            </button>
          </form>

          <p className="help" style={{ marginTop: 16 }}>
            Gunakan nomor antrean dan plat nomor yang tertera pada bukti servis.
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
              <div>{formatTanggal(result.tanggal)}</div>
              <div className="l">Mekanik</div>
              <div>{result.mekanik || "-"}</div>
            </div>
            {RECEIPT_AVAILABLE_STATUSES.includes(result.status) && (
              <button
                type="button"
                className="b b-p full"
                style={{ marginTop: 20 }}
                onClick={handleViewReceipt}
                disabled={receiptLoading}
              >
                {receiptLoading ? "Membuka struk..." : "Lihat Struk PDF"}
              </button>
            )}
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
