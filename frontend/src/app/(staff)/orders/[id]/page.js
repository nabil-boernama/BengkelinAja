"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import StaffLayout from "@/components/layout/StaffLayout";
import StatusMarker from "@/components/ui/StatusMarker";
import StatusStepper from "@/components/ui/StatusStepper";
import Dialog from "@/components/ui/Dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import usePolling from "@/hooks/usePolling";
import { getOrderById, updateOrderStatus } from "@/lib/services/orderService";
import { formatRupiah, formatTanggal } from "@/lib/format";

const POLL_MS = 30000;

// Mengikuti aturan backend (PATCH /orders/:id/status):
// - Mekanik: maju satu tahap, Antre -> Diperiksa -> Dikerjakan -> Selesai
// - Admin: hanya Selesai -> Diambil
// - Owner: hanya lihat
const MEKANIK_NEXT = { Antre: "Diperiksa", Diperiksa: "Dikerjakan", Dikerjakan: "Selesai" };

function nextStatusOptions(role, status) {
  if (role === "mekanik" && MEKANIK_NEXT[status]) return [MEKANIK_NEXT[status]];
  if (role === "admin" && status === "Selesai") return ["Diambil"];
  return [];
}

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function BackLink() {
  return (
    <Link
      className="muted"
      href="/orders"
      style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 700, marginBottom: 16 }}
    >
      <svg width="18" height="18" strokeWidth="2.2" {...svgProps}>
        <path d="M15 5l-7 7 7 7" />
      </svg>
      Kembali ke daftar order
    </Link>
  );
}

function ErrorMessage({ children }) {
  return (
    <div className="ermsg on" role="alert">
      <svg strokeWidth="2" {...svgProps}>
        <path d="M12 3l10 18H2z" />
        <path d="M12 10v5M12 18.5v.1" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <p className="muted" role="status" style={{ marginBottom: 16 }}>
        Memuat...
      </p>
      <div className="sk" style={{ height: 52, width: 260, marginBottom: 28 }} />
      <div className="sk" style={{ height: 120, marginBottom: 20, borderRadius: 32 }} />
      <div className="two">
        <div className="sk" style={{ height: 320, borderRadius: 32 }} />
        <div className="sk" style={{ height: 320, borderRadius: 32 }} />
      </div>
    </div>
  );
}

function Rincian({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <>
      {items.length === 0 ? (
        <p className="muted">Belum ada rincian suku cadang.</p>
      ) : (
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Suku cadang</th>
                <th>Jml</th>
                <th>Harga satuan</th>
                <th style={{ textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.part_id || i}>
                  <td>{it.part || "-"}</td>
                  <td>{it.jumlah}</td>
                  <td>{formatRupiah(it.harga_satuan)}</td>
                  <td style={{ textAlign: "right" }}>{formatRupiah(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="kv" style={{ gridTemplateColumns: "1fr auto", marginTop: items.length ? 6 : 12 }}>
        <div>Biaya jasa</div>
        <div style={{ textAlign: "right" }}>{formatRupiah(order.biaya_jasa ?? 0)}</div>
        <div>
          <b style={{ fontSize: 20 }}>Total biaya</b>
        </div>
        <div style={{ textAlign: "right" }}>
          <b style={{ fontSize: 26 }}>{formatRupiah(order.total_biaya ?? order.biaya_jasa ?? 0)}</b>
        </div>
      </div>
    </>
  );
}

function OrderDetailContent() {
  const { id } = useParams();
  const { role } = useAuth();
  const toast = useToast();

  const fetcher = useCallback(() => getOrderById(id), [id]);
  const { data: order, error, loading, refresh } = usePolling(fetcher, POLL_MS);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  if (loading && !order) {
    return (
      <>
        <BackLink />
        <DetailSkeleton />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <BackLink />
        <ErrorMessage>{error?.message || "Gagal memuat detail order."}</ErrorMessage>
        <button type="button" className="b b-g sm" onClick={refresh}>
          Coba lagi
        </button>
      </>
    );
  }

  const status = order.status;
  const options = nextStatusOptions(role, status);
  const cancelled = status === "Dibatalkan";

  function openDialog() {
    setTarget(options[0]);
    setSaveError("");
    setDialogOpen(true);
  }

  async function handleUpdateStatus() {
    if (!target || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateOrderStatus(order._id, target);
      toast.success(`Status order #${order.no_antrean} menjadi ${target}`);
      setDialogOpen(false);
      refresh();
    } catch (err) {
      setSaveError(err?.message || "Gagal mengubah status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BackLink />

      <div className="top">
        <div>
          <h1 className="pt">Order #{order.no_antrean ?? "-"}</h1>
          <div style={{ marginTop: 14 }}>{status && <StatusMarker status={status} big />}</div>
        </div>
      </div>

      {error && <ErrorMessage>{error.message || "Gagal memperbarui data."} Menampilkan data terakhir.</ErrorMessage>}

      <div className="pn" style={{ marginBottom: 20 }}>
        {cancelled ? (
          <span className="muted">Order ini dibatalkan, tahap servis dihentikan.</span>
        ) : (
          <StatusStepper status={status} />
        )}
      </div>

      {cancelled && (
        <div className="pn" style={{ marginBottom: 20 }}>
          <div className="mk cx" style={{ fontSize: 20, gap: 10 }}>
            Order dibatalkan
          </div>
          <div className="kv" style={{ marginTop: 12 }}>
            <div className="l">Alasan</div>
            <div>{order.alasan_batal || "-"}</div>
            <div className="l">Waktu</div>
            <div>{formatTanggal(order.dibatalkan_pada)}</div>
          </div>
        </div>
      )}

      <div className="two">
        <div className="pn">
          <div className="kv">
            <div className="l">Pelanggan</div>
            <div>{order.customer?.nama || "-"}</div>
            <div className="l">WhatsApp</div>
            <div className={role === "mekanik" ? "mask" : undefined}>{order.customer?.no_wa || "-"}</div>
            <div className="l">Kendaraan</div>
            <div>
              <b>{order.plat || "-"}</b>
            </div>
            <div className="l">Keluhan</div>
            <div>{order.keluhan || "-"}</div>
            <div className="l">Mekanik</div>
            <div>{order.mekanik?.nama || "-"}</div>
            <div className="l">Tanggal masuk</div>
            <div>{formatTanggal(order.tanggal)}</div>
          </div>
        </div>
        <div className="pn alt" style={{ background: "#161C1F" }}>
          <h2>Rincian</h2>
          <Rincian order={order} />
        </div>
      </div>

      <div className="row" style={{ marginTop: 24 }}>
        {options.length > 0 && (
          <button type="button" className="b b-r" onClick={openDialog}>
            Ubah Status
          </button>
        )}
        <Link className="b b-g" href="/orders">
          Kembali
        </Link>
      </div>

      {role === "mekanik" && MEKANIK_NEXT[status] && (
        <div className="cnote" style={{ marginTop: 16 }}>
          Anda hanya dapat memajukan tahap order milik Anda. Rincian suku cadang dicatat Admin.
        </div>
      )}

      <Dialog
        open={dialogOpen}
        title="Ubah status"
        message={`Order #${order.no_antrean} (${order.plat}) saat ini berstatus ${status}.`}
        confirmLabel="Ubah Status"
        loading={saving}
        onConfirm={handleUpdateStatus}
        onCancel={() => setDialogOpen(false)}
      >
        <label className="fld" htmlFor="status-baru">
          <span>Status baru</span>
          <select
            id="status-baru"
            className="in"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={saving}
          >
            {options.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {saveError && <ErrorMessage>{saveError}</ErrorMessage>}
      </Dialog>
    </>
  );
}

export default function OrderDetailPage() {
  return (
    <StaffLayout>
      <OrderDetailContent />
    </StaffLayout>
  );
}
