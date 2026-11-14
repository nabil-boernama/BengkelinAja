"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import StaffLayout from "@/components/layout/StaffLayout";
import StatusMarker from "@/components/ui/StatusMarker";
import { useAuth } from "@/context/AuthContext";
import usePolling from "@/hooks/usePolling";
import useDebounce from "@/hooks/useDebounce";
import { getOrders } from "@/lib/services/orderService";
import { formatTanggalPendek } from "@/lib/format";
import { STATUS_LIST } from "@/lib/constants";

const POLL_MS = 30000;

const jamFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function SkeletonRows({ cols, count = 5 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} aria-hidden="true">
      {Array.from({ length: cols }, (_, j) => (
        <td key={j}>
          <div className="sk" style={{ height: 14, width: j === 0 ? 40 : "70%" }} />
        </td>
      ))}
    </tr>
  ));
}

function OrdersContent() {
  const { role } = useAuth();
  const showMekanik = role !== "mekanik"; // mekanik hanya melihat order miliknya sendiri

  const [status, setStatus] = useState("");
  const [platInput, setPlatInput] = useState("");
  const plat = useDebounce(platInput.trim(), 400);

  const fetcher = useCallback(async () => {
    const items = await getOrders({ status, plat });
    return { items: Array.isArray(items) ? items : [], at: new Date() };
  }, [status, plat]);
  const { data, error, loading, refresh } = usePolling(fetcher, POLL_MS);

  const orders = data?.items ?? [];
  const hasFilter = Boolean(status || plat);
  const cols = showMekanik ? 8 : 7;

  let body;
  if (loading && !data) {
    body = <SkeletonRows cols={cols} />;
  } else if (!data) {
    body = null; // gagal pada muatan pertama: pesan error tampil di atas tabel
  } else {
    body = orders.map((o) => (
      <tr key={o._id}>
        <td className="num" data-l="No">
          #{o.no_antrean ?? "-"}
        </td>
        <td data-l="Tanggal">{formatTanggalPendek(o.tanggal)}</td>
        <td data-l="Plat">
          <b>{o.plat || "-"}</b>
        </td>
        <td data-l="Pelanggan">{o.customer?.nama || "-"}</td>
        <td className="trunc" data-l="Keluhan" title={o.keluhan}>
          {o.keluhan || "-"}
        </td>
        {showMekanik && <td data-l="Mekanik">{o.mekanik?.nama || "-"}</td>}
        <td>{o.status ? <StatusMarker status={o.status} /> : "-"}</td>
        <td>
          <div className="acts">
            <Link className="b b-g sm" href={`/orders/${encodeURIComponent(o._id)}`}>
              Detail
            </Link>
          </div>
        </td>
      </tr>
    ));
  }

  return (
    <>
      <div className="top">
        <div>
          <h1 className="pt">{role === "mekanik" ? "Order Saya" : "Daftar Order"}</h1>
        </div>
      </div>

      <div className="filters">
        <div className="seg" role="group" aria-label="Filter status">
          {["", ...STATUS_LIST].map((s) => (
            <button
              key={s || "semua"}
              type="button"
              className={status === s ? "on" : undefined}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {s || "Semua"}
            </button>
          ))}
        </div>
        <input
          className="in"
          type="search"
          placeholder="Cari plat nomor"
          aria-label="Cari plat nomor"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={15}
          value={platInput}
          onChange={(e) => setPlatInput(e.target.value)}
        />
        <div className="stamp">
          {data?.at && <span>Diperbarui {jamFmt.format(data.at).replace(/:/g, ".")}</span>}
          <button type="button" className="ib" onClick={refresh} aria-label="Muat ulang">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="ermsg on" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l10 18H2z" />
            <path d="M12 10v5M12 18.5v.1" />
          </svg>
          <span>
            {error.message || "Gagal memuat daftar order."}
            {data ? " Menampilkan data terakhir." : ""}
          </span>
        </div>
      )}

      <div className="pn">
        <div className="tw">
          <table className="rs" aria-busy={(loading && !data) || undefined}>
            <thead>
              <tr>
                <th>No. Antrean</th>
                <th>Tanggal</th>
                <th>Plat</th>
                <th>Pelanggan</th>
                <th>Keluhan</th>
                {showMekanik && <th>Mekanik</th>}
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>{body}</tbody>
          </table>
          {data && orders.length === 0 && (
            <p className="muted" style={{ padding: "24px 14px" }}>
              {hasFilter ? "Belum ada order pada filter ini." : "Belum ada order"}
            </p>
          )}
          {loading && !data && (
            <p className="muted small" role="status" style={{ padding: "12px 14px 0" }}>
              Memuat...
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <StaffLayout>
      <OrdersContent />
    </StaffLayout>
  );
}
