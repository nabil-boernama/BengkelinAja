"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, REPORT_PERIODS } from "@/services/reportsService";
import { formatRupiah } from "@/lib/format";

const PERIOD_LABELS = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

const ACTIVE_STATUS_SAMPLE = [
  { status: "Antre", total: 3 },
  { status: "Diperiksa", total: 2 },
  { status: "Dikerjakan", total: 4 },
  { status: "Selesai", total: 1 },
];

function getErrorMessage(error) {
  return error?.message || "Laporan gagal dimuat. Coba lagi.";
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("monthly");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getDashboard(period)
      .then((data) => {
        if (
          !data ||
          typeof data.total_pendapatan !== "number" ||
          typeof data.total_order !== "number" ||
          !Array.isArray(data.stok_menipis)
        ) {
          throw new Error("Data laporan dari server tidak sesuai.");
        }
        if (!cancelled) {
          setReport(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, refreshKey]);

  function selectPeriod(nextPeriod) {
    if (nextPeriod === period) return;
    setPeriod(nextPeriod);
    setReport(null);
    setLoading(true);
    setError("");
  }

  function refreshReport() {
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  }

  const maxActiveOrders = Math.max(
    ...ACTIVE_STATUS_SAMPLE.map((item) => item.total),
    1
  );

  return (
    <div>
      <div className="row sp" style={{ marginBottom: 24 }}>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1.1 }}
        >
          Dashboard
        </h1>
        <div className="row">
          <div className="seg" aria-label="Periode laporan">
            {REPORT_PERIODS.map((item) => (
              <button
                key={item}
                className={period === item ? "on" : ""}
                type="button"
                aria-pressed={period === item}
                onClick={() => selectPeriod(item)}
              >
                {PERIOD_LABELS[item]}
              </button>
            ))}
          </div>
          <button
            className="ib"
            type="button"
            onClick={refreshReport}
            disabled={loading}
            aria-label="Muat ulang laporan"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="ermsg" role="alert" style={{ marginBottom: 16 }}>
          <span>{error}</span>
        </div>
      )}

      <div
        className="cards"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
        aria-live="polite"
      >
        <section className="cc">
          <p className="muted small">Total Pendapatan</p>
          {loading && !report ? (
            <div className="sk" style={{ height: 48, marginTop: 8 }} />
          ) : (
            <p style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 800 }}>
              {report ? formatRupiah(report.total_pendapatan) : "-"}
            </p>
          )}
        </section>
        <section className="cc">
          <p className="muted small">Order Selesai Diambil</p>
          {loading && !report ? (
            <div className="sk" style={{ height: 48, marginTop: 8 }} />
          ) : (
            <p style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 800 }}>
              {report ? report.total_order : "-"}
            </p>
          )}
        </section>
      </div>

      <p className="muted small" style={{ margin: "16px 0 24px" }}>
        Dihitung dari order berstatus Diambil pada periode ini, berdasarkan waktu
        WIB. Minggu dimulai hari Minggu.
      </p>

      <div
        className="cards"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
      >
        <section className="pn">
          <h2>Stok Menipis</h2>
          {loading && !report ? (
            <p className="muted" role="status">
              Memuat data stok...
            </p>
          ) : report?.stok_menipis.length ? (
            <div className="cards" style={{ gap: 12 }}>
              {report.stok_menipis.map((part) => (
                <div className="cc row sp" key={part._id || part.id}>
                  <span>
                    <b>{part.nama}</b>
                    <br />
                    <span className="muted small">
                      stok {part.stok}, batas {part.batas_minimum}
                    </span>
                  </span>
                  <span className="lowst">MENIPIS</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Tidak ada suku cadang yang menipis.</p>
          )}
          <Link className="b b-g sm" style={{ marginTop: 14 }} href="/parts">
            Lihat semua stok
          </Link>
        </section>

        <section className="pn">
          <h2>Order Aktif per Status</h2>
          <p className="help" style={{ marginBottom: 16 }}>
            Data jumlah order per status masih contoh sementara.
          </p>
          <div className="cards" style={{ gap: 14 }}>
            {ACTIVE_STATUS_SAMPLE.map((item) => (
              <div
                className="row"
                key={item.status}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px minmax(40px, 1fr) 32px",
                  gap: 12,
                  fontWeight: 700,
                }}
              >
                <span>{item.status}</span>
                <span className="sk" style={{ height: 18, width: `${(item.total / maxActiveOrders) * 100}%` }} />
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {item.total}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* TODO: Tambahkan jumlah order aktif per status setelah API laporan menyediakannya. */}
    </div>
  );
}
