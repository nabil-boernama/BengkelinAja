"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import StatusMarker from "@/components/ui/StatusMarker";
import { searchCustomerPlates, searchCustomers } from "@/services/customersService";
import { listOrders } from "@/services/ordersService";
import useDebounce from "@/hooks/useDebounce";
import { formatPlat, formatTanggal } from "@/lib/format";

// Waktu cetak saat ini, mis. "16 Nov 2026, 14.05 WIB"
function nowPrintDate() {
  return formatTanggal(new Date().toISOString());
}

// Escape teks sebelum disisipkan ke HTML jendela cetak (keluhan/nama diisi pengguna)
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Menyamarkan nomor WhatsApp untuk Mekanik: "081234567890" -> "0812 **** 7890"
function maskWa(no_wa) {
  if (!no_wa) return null;
  const digits = no_wa.replace(/\D/g, "");
  if (digits.length < 5) return no_wa;
  return digits.slice(0, 4) + " **** " + digits.slice(-4);
}

// ---- Tab Pelanggan ----
function CustomerList({ q }) {
  const { role } = useAuth();
  const [result, setResult] = useState(null); // null = belum pernah cari
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) {
      /* eslint-disable react-hooks/set-state-in-effect -- kosongkan hasil saat pencarian dikosongkan */
      setResult(null);
      setError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchCustomers(q)
      .then((data) => {
        if (!cancelled) setResult(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Gagal memuat data pelanggan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [q]);

  if (!q) {
    return <p className="muted">Ketik minimal 1 karakter.</p>;
  }
  if (loading) {
    return (
      <div className="cards" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc" aria-hidden="true">
            <div className="row sp">
              <div>
                <div className="sk" style={{ height: 18, width: 160, marginBottom: 8 }} />
                <div className="sk" style={{ height: 14, width: 110 }} />
              </div>
              <div className="sk" style={{ height: 14, width: 50 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="ermsg on" role="alert">{error}</p>;
  }
  if (result !== null && result.length === 0) {
    return <p className="muted">Pelanggan tidak ditemukan.</p>;
  }
  if (!result) return null;

  return (
    <div className="cards">
      {result.map((c) => {
        const wa =
          role === "mekanik"
            ? maskWa(c.no_wa)
            : c.no_wa;
        return (
          <Link key={c._id} className="cc" href={`/customers/${encodeURIComponent(c._id)}`}>
            <div className="row sp">
              <div>
                <b style={{ fontSize: 18 }}>{c.nama}</b>
                {wa && <div className="muted">{wa}</div>}
              </div>
              {typeof c.jumlah_order === "number" && (
                <span className="muted" style={{ fontWeight: 700 }}>
                  {c.jumlah_order} order
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---- Tab Plat ----
function PlatList({ q }) {
  const [plates, setPlates] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- mulai permintaan jaringan */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    searchCustomerPlates(q)
      .then((data) => {
        if (!cancelled) setPlates(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Gagal memuat daftar plat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [q]);

  async function openPlate(plate) {
    setSelectedPlate(plate);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await listOrders({ plat: plate });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setDetailError(err.message || "Gagal memuat riwayat servis.");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCetakRiwayat() {
    const printDate = nowPrintDate();
    const ownerName = orders[0]?.customer?.nama || "-";
    const totalServis = orders.length;
    const latestDate = orders.length > 0 ? formatTanggal(orders[0].tanggal) : "-";

    const rows = orders.map((order, idx) => `
    <tr>
      <td class="rno">${idx + 1}</td>
      <td class="rtgl">${esc(formatTanggal(order.tanggal))}</td>
      <td>${esc(order.keluhan || "-")}</td>
      <td>${esc(order.deskripsi_jasa || "-")}</td>
      <td>${esc(order.status)}</td>
    </tr>
  `).join("");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Riwayat Servis - ${esc(formatPlat(selectedPlate))}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#fff;color:#111;padding:32px}
.page{max-width:700px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:40px;height:40px;background:#D32F2F;border-radius:9px;display:flex;align-items:center;justify-content:center}
.logo-name{font-size:18px;font-weight:700;letter-spacing:-.5px}
.logo-name span{color:#D32F2F}
.hdr-right{text-align:right}
.doc-title{font-size:18px;font-weight:700;margin-bottom:4px}
.doc-date{font-size:12px;color:#666}
hr{border:none;border-top:1.5px solid #E0E0E0;margin:16px 0}
.vc{background:#F5F5F5;border-radius:10px;padding:18px 22px;display:grid;grid-template-columns:1fr auto 1fr;gap:0 20px;margin-bottom:18px}
.vcol{display:flex;flex-direction:column;gap:14px}
.vdiv{width:1px;background:#E0E0E0}
.fl{font-size:11px;color:#666;margin-bottom:3px}
.fv{font-size:19px;font-weight:700}
.stats{display:flex;margin-bottom:18px}
.stat{flex:1}
.stat+.stat{border-left:1.5px solid #E0E0E0;padding-left:22px}
.sl{font-size:11px;color:#666;margin-bottom:2px}
.sv{font-size:22px;font-weight:700}
.sv.sm{font-size:17px}
.sec{font-size:16px;font-weight:700;margin-bottom:12px;padding-left:10px;border-left:4px solid #D32F2F}
table{width:100%;border-collapse:collapse;font-size:13px}
thead tr{background:#F5F5F5}
th{font-weight:600;text-align:left;padding:10px 12px;font-size:12px}
td{padding:11px 12px;vertical-align:top;border-bottom:1px solid #E0E0E0}
tbody tr:last-child td{border-bottom:none}
.rno{width:40px;color:#666}
.rtgl{white-space:nowrap;width:110px}
.foot{display:flex;align-items:center;justify-content:space-between;gap:14px;background:#F5F5F5;border-radius:10px;padding:12px 18px;margin-top:20px;font-size:12px;color:#666}
.sig{text-align:right}
.sig-name{font-weight:700;font-size:13px;color:#111}
.bar{height:7px;background:#D32F2F;border-radius:4px;margin-top:20px}
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="logo">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <div class="logo-name">BENGKELIN<span>AJA</span></div>
    </div>
    <div class="hdr-right">
      <div class="doc-title">Riwayat Servis Kendaraan</div>
      <div class="doc-date">Dicetak pada: ${esc(printDate)}</div>
    </div>
  </div>
  <hr>
  <div class="vc">
    <div class="vcol"><div><div class="fl">Nomor Plat</div><div class="fv">${esc(formatPlat(selectedPlate))}</div></div></div>
    <div class="vdiv"></div>
    <div class="vcol"><div><div class="fl">Nama Pemilik</div><div class="fv">${esc(ownerName)}</div></div></div>
  </div>
  <div class="stats">
    <div class="stat"><div class="sl">Total Servis</div><div class="sv">${totalServis}</div></div>
    <div class="stat"><div class="sl">Servis Terakhir</div><div class="sv sm">${esc(latestDate)}</div></div>
  </div>
  <hr>
  <div class="sec">Daftar Riwayat Servis</div>
  <table>
    <thead><tr>
      <th class="rno">No.</th>
      <th class="rtgl">Tanggal</th>
      <th>Keluhan</th>
      <th>Keterangan Jasa</th>
      <th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="foot">
    <span>Terima kasih telah mempercayakan perawatan kendaraan Anda kepada BengkelinAja.</span>
    <div class="sig"><div>Salam hangat,</div><div class="sig-name">BengkelinAja</div></div>
  </div>
  <div class="bar"></div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);window.onafterprint=function(){window.close();}}<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  if (selectedPlate) {
    return (
      <section>
        <div className="row" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="b b-g sm"
            onClick={() => setSelectedPlate("")}
          >
            Kembali ke daftar plat
          </button>
          <button
            type="button"
            className="b b-g sm"
            onClick={handleCetakRiwayat}
          >
            Cetak Riwayat
          </button>
        </div>
        <h2 style={{ margin: "0 0 16px" }} className="print-plat-title">{formatPlat(selectedPlate)}</h2>
        {detailLoading && <p className="muted" role="status">Memuat riwayat…</p>}
        {detailError && <p className="ermsg on" role="alert">{detailError}</p>}
        {!detailLoading && !detailError && orders.length === 0 && (
          <p className="muted">Belum ada riwayat untuk plat ini.</p>
        )}
        {!detailLoading && !detailError && orders.length > 0 && (
          <div className="cards">
            {orders.map((order) => (
              <Link key={order._id} className="cc" href={`/orders/${encodeURIComponent(order._id)}`}>
                <div className="row sp">
                  <div>
                    <b style={{ fontSize: 18 }}>#{order.no_antrean}</b>
                    <div className="muted">
                      {order.customer?.nama || "-"} · {order.mekanik?.nama || "-"}
                    </div>
                    {order.tanggal && (
                      <div className="muted" style={{ fontSize: 13 }}>
                        {new Date(order.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    )}
                    {order.keluhan && <div>{order.keluhan}</div>}
                  </div>
                  {order.status && <StatusMarker status={order.status} />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (loading) {
    return (
      <div className="cards" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc" aria-hidden="true">
            <div className="row sp">
              <div>
                <div className="sk" style={{ height: 18, width: 120, marginBottom: 8 }} />
                <div className="sk" style={{ height: 14, width: 180 }} />
              </div>
              <div className="sk" style={{ height: 20, width: 80 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="ermsg on" role="alert">{error}</p>;
  }
  if (plates.length === 0) return <p className="muted">Plat nomor tidak ditemukan.</p>;

  return (
    <div className="cards">
      {plates.map(({ plat }) => (
        <button
          key={plat}
          type="button"
          className="cc"
          style={{ color: "#fff", textAlign: "left", cursor: "pointer" }}
          onClick={() => openPlate(plat)}
        >
          <b style={{ fontSize: 18 }}>{formatPlat(plat)}</b>
        </button>
      ))}
    </div>
  );
}

// ---- Halaman utama ----
export default function CustomerSearchPage() {
  const [tab, setTab] = useState("p"); // "c" = pelanggan, "p" = plat
  const [input, setInput] = useState("");
  const q = useDebounce(input.trim(), 400);

  const switchTab = useCallback((newTab) => {
    setTab(newTab);
    setInput("");
  }, []);

  return (
    <>
      <div className="top">
        <h1 className="pt">Riwayat</h1>
      </div>

      {/* Tab pilih mode pencarian */}
      <div className="seg" role="group" aria-label="Mode pencarian" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={tab === "c" ? "on" : undefined}
          aria-pressed={tab === "c"}
          onClick={() => switchTab("c")}
        >
          Cari Pelanggan
        </button>
        <button
          type="button"
          className={tab === "p" ? "on" : undefined}
          aria-pressed={tab === "p"}
          onClick={() => switchTab("p")}
        >
          Cari Plat Nomor
        </button>
      </div>

      {/* Input pencarian */}
      <div style={{ maxWidth: 560, marginBottom: 20 }}>
        <input
          className="in"
          type="search"
          placeholder={tab === "c" ? "Cari nama atau nomor WhatsApp" : "Cari plat nomor"}
          aria-label={tab === "c" ? "Cari nama atau nomor WhatsApp" : "Cari plat nomor"}
          autoCapitalize={tab === "p" ? "characters" : "words"}
          autoCorrect="off"
          spellCheck={false}
          value={input}
          maxLength={tab === "p" ? 15 : 50}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {/* Hasil pencarian */}
      {tab === "c" ? <CustomerList q={q} /> : <PlatList q={q} />}
    </>
  );
}
