"use client";

import { useCallback, useEffect, useState } from "react";
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
import { recordService, cancelOrder } from "@/services/ordersService";
import { listParts } from "@/services/partsService";
import { formatRupiah, formatTanggal } from "@/lib/format";

const POLL_MS = 30000;

const MEKANIK_NEXT = { Antre: "Diperiksa", Diperiksa: "Dikerjakan", Dikerjakan: "Selesai" };
const FINAL_STATUS = ["Diambil", "Dibatalkan"];
const CANCEL_ALLOWED = ["Antre", "Diperiksa"];

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

function SearchableSelect({ parts, value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = parts.find((p) => p._id === value);
  const displayValue = open ? query : selected ? selected.nama : "";

  const filtered = parts.filter((p) =>
    p.nama.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(part) {
    onChange(part._id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        className="in"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        placeholder="Ketik nama suku cadang..."
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#1e2528",
            border: "1px solid #333",
            borderRadius: 8,
            zIndex: 100,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {filtered.map((p) => (
            <div
              key={p._id}
              onMouseDown={() => handleSelect(p)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #2a2a2a",
                fontSize: 14,
              }}
            >
              {p.nama} (stok: {p.stok}) - {formatRupiah(p.harga)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CatatServisForm({ orderId, initialItems, initialBiayaJasa, onSaved }) {
  const toast = useToast();

  const [parts, setParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(true);

  const [rows, setRows] = useState(() =>
    Array.isArray(initialItems) && initialItems.length > 0
      ? initialItems.map((it) => ({ part: it.part_id || "", jumlah: it.jumlah || 1 }))
      : []
  );
  const [biayaJasa, setBiayaJasa] = useState(initialBiayaJasa ?? 0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listParts()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setParts(list);
      })
      .catch(() => setParts([]))
      .finally(() => setLoadingParts(false));
  }, []);

  function addRow() {
    setRows((prev) => [...prev, { part: "", jumlah: 1 }]);
  }

  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx, field, value) {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  }

  async function handleSave() {
    setSaveError("");

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].part) {
        setSaveError(`Baris ${i + 1}: pilih suku cadang terlebih dahulu.`);
        return;
      }
      if (!rows[i].jumlah || rows[i].jumlah < 1) {
        setSaveError(`Baris ${i + 1}: jumlah minimal 1.`);
        return;
      }
    }

    const parsedBiaya = Number(biayaJasa);
    if (isNaN(parsedBiaya) || parsedBiaya < 0) {
      setSaveError("Biaya jasa tidak boleh negatif.");
      return;
    }

    setSaving(true);
    try {
      await recordService(orderId, {
        items: rows.map((r) => ({ part: r.part, jumlah: Number(r.jumlah) })),
        biaya_jasa: parsedBiaya,
      });
      toast.success("Rincian servis berhasil disimpan.");
      onSaved();
    } catch (err) {
      setSaveError(err?.message || "Gagal menyimpan rincian servis.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pn" style={{ marginTop: 20 }}>
      <h2 style={{ marginBottom: 16 }}>Catat Rincian Servis</h2>

      {loadingParts ? (
        <p className="muted">Memuat daftar suku cadang...</p>
      ) : (
        <>
          {rows.length === 0 && (
            <p className="muted" style={{ marginBottom: 12 }}>
              Belum ada suku cadang. Klik &ldquo;Tambah Suku Cadang&rdquo; untuk menambahkan.
            </p>
          )}

          {rows.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px auto",
                gap: 10,
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <SearchableSelect
                parts={parts}
                value={row.part}
                onChange={(id) => updateRow(idx, "part", id)}
                disabled={saving}
              />

              <input
                type="number"
                className="in"
                min={1}
                value={row.jumlah}
                onChange={(e) => updateRow(idx, "jumlah", e.target.value)}
                disabled={saving}
                placeholder="Jml"
                style={{ textAlign: "center" }}
              />

              <button
                type="button"
                className="b b-g sm"
                onClick={() => removeRow(idx)}
                disabled={saving}
                aria-label="Hapus baris"
                style={{ padding: "8px 12px" }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            className="b b-g sm"
            onClick={addRow}
            disabled={saving}
            style={{ marginBottom: 20 }}
          >
            + Tambah Suku Cadang
          </button>

          <div className="fld" style={{ maxWidth: 300 }}>
            <label htmlFor="biaya-jasa">
              <span>Biaya jasa (Rp)</span>
              <input
                id="biaya-jasa"
                type="number"
                className="in"
                min={0}
                value={biayaJasa}
                onChange={(e) => setBiayaJasa(e.target.value)}
                disabled={saving}
                placeholder="0"
              />
            </label>
          </div>

          {saveError && (
            <div style={{ marginTop: 12 }}>
              <ErrorMessage>{saveError}</ErrorMessage>
            </div>
          )}

          <div className="row" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="b b-r"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan Rincian"}
            </button>
          </div>
        </>
      )}
    </div>
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

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
  const isFinal = FINAL_STATUS.includes(status);

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

  async function handleCancel() {
    if (!alasan.trim()) {
      setCancelError("Alasan pembatalan wajib diisi.");
      return;
    }
    setCancelling(true);
    setCancelError("");
    try {
      await cancelOrder(order._id, alasan.trim());
      toast.success(`Order #${order.no_antrean} berhasil dibatalkan.`);
      setCancelOpen(false);
      refresh();
    } catch (err) {
      setCancelError(err?.message || "Gagal membatalkan order.");
    } finally {
      setCancelling(false);
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

      {role === "admin" && !isFinal && (
        <CatatServisForm
          key={order._id}
          orderId={order._id}
          initialItems={order.items}
          initialBiayaJasa={order.biaya_jasa}
          onSaved={refresh}
        />
      )}

      <div className="row" style={{ marginTop: 24 }}>
        {options.length > 0 && (
          <button type="button" className="b b-r" onClick={openDialog}>
            Ubah Status
          </button>
        )}
        {role === "admin" && CANCEL_ALLOWED.includes(status) && (
          <button
            type="button"
            className="b b-g"
            onClick={() => {
              setAlasan("");
              setCancelError("");
              setCancelOpen(true);
            }}
          >
            Batalkan Order
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

      <Dialog
        open={cancelOpen}
        title="Batalkan order"
        message={`Order #${order.no_antrean} (${order.plat}) akan dibatalkan. Tindakan ini tidak bisa diurungkan.`}
        confirmLabel="Ya, Batalkan"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      >
        <label className="fld" htmlFor="alasan-batal">
          <span>Alasan pembatalan</span>
          <input
            id="alasan-batal"
            type="text"
            className="in"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            disabled={cancelling}
            placeholder="Contoh: pelanggan tidak jadi servis"
          />
        </label>
        {cancelError && <ErrorMessage>{cancelError}</ErrorMessage>}
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