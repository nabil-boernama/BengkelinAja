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
import {
  recordService,
  cancelOrder,
  updateOrder,
  getMechanicWorkload,
  getReceiptPdf,
  sendReceiptToWhatsApp,
} from "@/services/ordersService";
import { listParts } from "@/services/partsService";
import { formatPlat, formatRupiah, formatTanggal } from "@/lib/format";

const POLL_MS = 30000;
const DESKRIPSI_MAX = 500; // sama dengan batas di backend

const MEKANIK_NEXT = { Antre: "Diperiksa", Diperiksa: "Dikerjakan", Dikerjakan: "Selesai" };
const FINAL_STATUS = ["Diambil", "Dibatalkan"];
const RECEIPT_AVAILABLE_STATUSES = ["Selesai", "Diambil"];
const CANCEL_ALLOWED = ["Antre", "Diperiksa"];
// Data order (pelanggan, kendaraan, keluhan, mekanik) hanya bisa diubah sebelum Selesai
const EDIT_ALLOWED = ["Antre", "Diperiksa", "Dikerjakan"];

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
  // Order dibatalkan: tidak ada suku cadang maupun biaya jasa yang ditagihkan
  if (order.status === "Dibatalkan") {
    return <p className="muted">Order dibatalkan, tidak ada rincian biaya.</p>;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <>
      {items.length === 0 ? (
        <p className="muted">Belum ada rincian suku cadang.</p>
      ) : (
        <div className="tw" style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
          <table style={{minWidth:440}}>
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
        <div>Jasa servis</div>
        <div style={{ textAlign: "right", whiteSpace: "pre-line" }}>{order.deskripsi_jasa || "-"}</div>
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
        autoComplete="off"
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

// Kondisi default form: rincian yang sudah tersimpan di order (atau kosong)
function toRows(items) {
  return Array.isArray(items) && items.length > 0
    ? items.map((it) => ({ part: it.part_id || "", jumlah: it.jumlah || 1 }))
    : [];
}

function CatatServisForm({ orderId, initialItems, initialBiayaJasa, initialDeskripsiJasa, onSaved }) {
  const toast = useToast();

  const [parts, setParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(true);

  const [rows, setRows] = useState(() => toRows(initialItems));
  const [biayaJasa, setBiayaJasa] = useState(initialBiayaJasa ?? 0);
  const [deskripsiJasa, setDeskripsiJasa] = useState(initialDeskripsiJasa ?? "");
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

    if (deskripsiJasa.trim().length > DESKRIPSI_MAX) {
      setSaveError(`Deskripsi jasa maksimal ${DESKRIPSI_MAX} karakter.`);
      return;
    }

    setSaving(true);
    try {
      await recordService(orderId, {
        items: rows.map((r) => ({ part: r.part, jumlah: Number(r.jumlah) })),
        biaya_jasa: parsedBiaya,
        deskripsi_jasa: deskripsiJasa.trim(),
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
                autoComplete="off"
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

          <div className="fld" style={{ marginBottom: 12 }}>
            <label htmlFor="deskripsi-jasa">
              <span>Deskripsi jasa servis</span>
              <textarea
                id="deskripsi-jasa"
                className="in"
                autoComplete="off"
                rows={3}
                maxLength={DESKRIPSI_MAX}
                value={deskripsiJasa}
                onChange={(e) => setDeskripsiJasa(e.target.value)}
                disabled={saving}
                placeholder="Contoh: ganti oli, cek rem, servis karburator"
                style={{ resize: "vertical" }}
              />
            </label>
          </div>

          <div className="fld" style={{ maxWidth: 300 }}>
            <label htmlFor="biaya-jasa">
              <span>Biaya jasa (Rp)</span>
              <input
                id="biaya-jasa"
                type="number"
                className="in"
                autoComplete="off"
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

// Form ubah data order (pelanggan, WhatsApp, kendaraan, keluhan, mekanik).
// Di-mount hanya saat dialog dibuka, jadi isinya selalu mulai dari data order terbaru.
function EditOrderDialog({ order, onClose, onSaved }) {
  const toast = useToast();

  const [nama, setNama] = useState(order.customer?.nama || "");
  const [noWa, setNoWa] = useState(order.customer?.no_wa || "");
  const [plat, setPlat] = useState(formatPlat(order.plat) === "-" ? "" : formatPlat(order.plat));
  const [keluhan, setKeluhan] = useState(order.keluhan || "");
  const [mekanik, setMekanik] = useState(String(order.mekanik?._id || ""));
  const [mechanics, setMechanics] = useState([]);
  const [loadingMechanics, setLoadingMechanics] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getMechanicWorkload()
      .then((data) => setMechanics(Array.isArray(data) ? data : []))
      .catch(() => setMechanics([]))
      .finally(() => setLoadingMechanics(false));
  }, []);

  // mekanik saat ini tetap jadi pilihan walau sudah tidak aktif
  const currentId = String(order.mekanik?._id || "");
  const mechanicOptions =
    currentId && !mechanics.some((m) => String(m.id || m._id) === currentId)
      ? [{ id: currentId, nama: order.mekanik?.nama || "Mekanik saat ini" }, ...mechanics]
      : mechanics;

  async function handleSave() {
    if (saving) return;
    setFormError("");

    const namaTrim = nama.trim();
    const waTrim = noWa.trim();
    const platKey = plat.replace(/\s+/g, "").toUpperCase();
    const keluhanTrim = keluhan.trim();

    if (!namaTrim) return setFormError("Nama pelanggan wajib diisi.");
    if (waTrim && !/^\+?[0-9\s-]{8,20}$/.test(waTrim)) {
      return setFormError("Nomor WhatsApp tidak valid.");
    }
    if (platKey.length < 3 || platKey.length > 15) return setFormError("Plat nomor tidak valid.");
    if (!keluhanTrim) return setFormError("Keluhan wajib diisi.");
    if (!mekanik) return setFormError("Pilih mekanik.");

    // kirim hanya field yang berubah
    const payload = {};
    const customer = {};
    if (namaTrim !== (order.customer?.nama || "")) customer.nama = namaTrim;
    if (waTrim !== (order.customer?.no_wa || "")) customer.no_wa = waTrim;
    if (Object.keys(customer).length > 0) payload.customer = customer;
    if (platKey !== String(order.plat || "").replace(/\s+/g, "").toUpperCase()) payload.plat = platKey;
    if (keluhanTrim !== (order.keluhan || "")) payload.keluhan = keluhanTrim;
    if (mekanik !== currentId) payload.mekanik = mekanik;

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await updateOrder(order._id, payload);
      toast.success(`Data order #${order.no_antrean} diperbarui.`);
      onSaved();
      onClose();
    } catch (err) {
      setFormError(
        err?.status === 409
          ? "Nomor WhatsApp sudah dipakai pelanggan lain."
          : err?.message || "Gagal menyimpan perubahan."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      title="Ubah data order"
      message={`Order #${order.no_antrean}. Perubahan nama dan nomor WhatsApp berlaku untuk data pelanggan ini di semua order.`}
      confirmLabel="Simpan"
      loading={saving}
      onConfirm={handleSave}
      onCancel={onClose}
    >
      <label className="fld" htmlFor="edit-nama" style={{ marginBottom: 12 }}>
        <span>Pelanggan</span>
        <input
          id="edit-nama"
          className="in"
          autoComplete="off"
          maxLength={100}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          disabled={saving}
        />
      </label>
      <label className="fld" htmlFor="edit-wa" style={{ marginBottom: 12 }}>
        <span>WhatsApp (opsional)</span>
        <input
          id="edit-wa"
          className="in"
          autoComplete="off"
          inputMode="tel"
          maxLength={20}
          placeholder="0812 3456 7890"
          value={noWa}
          onChange={(e) => setNoWa(e.target.value)}
          disabled={saving}
        />
      </label>
      <label className="fld" htmlFor="edit-plat" style={{ marginBottom: 12 }}>
        <span>Kendaraan (plat nomor)</span>
        <input
          id="edit-plat"
          className="in"
          autoComplete="off"
          maxLength={15}
          value={plat}
          onChange={(e) => setPlat(e.target.value.toUpperCase())}
          disabled={saving}
        />
      </label>
      <label className="fld" htmlFor="edit-keluhan" style={{ marginBottom: 12 }}>
        <span>Keluhan</span>
        <textarea
          id="edit-keluhan"
          className="in"
          autoComplete="off"
          rows={3}
          maxLength={500}
          value={keluhan}
          onChange={(e) => setKeluhan(e.target.value)}
          disabled={saving}
          style={{ resize: "vertical" }}
        />
      </label>
      <label className="fld" htmlFor="edit-mekanik" style={{ marginBottom: 12 }}>
        <span>Mekanik</span>
        {loadingMechanics ? (
          <p className="muted">Memuat daftar mekanik...</p>
        ) : (
          <select
            id="edit-mekanik"
            className="in"
            value={mekanik}
            onChange={(e) => setMekanik(e.target.value)}
            disabled={saving}
          >
            {mechanicOptions.map((m) => {
              const mid = String(m.id || m._id);
              return (
                <option key={mid} value={mid}>
                  {m.nama}
                  {m.order_aktif !== undefined ? ` (${m.order_aktif} order aktif)` : ""}
                </option>
              );
            })}
          </select>
        )}
      </label>
      {formError && <ErrorMessage>{formError}</ErrorMessage>}
    </Dialog>
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
  const [editOpen, setEditOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  // Jangan tampilkan data order lain selama data order ini belum termuat
  if (order && String(order._id) !== String(id)) {
    return (
      <>
        <BackLink />
        <DetailSkeleton />
      </>
    );
  }

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
      // Modal ini tanpa titik di akhir kalimat, termasuk pesan error umum dari apiClient
      setSaveError((err?.message || "Gagal mengubah status").replace(/\.\s*$/, ""));
    } finally {
      setSaving(false);
    }
  }

  // Buka struk PDF di tab baru; bila pop-up diblokir, unduh sebagai file.
  async function handlePrintReceipt() {
    if (printing) return;
    // tab dibuka langsung saat klik supaya tidak dianggap pop-up oleh browser
    const tab = window.open("", "_blank");
    setPrinting(true);
    try {
      const blob = await getReceiptPdf(order._id);
      const url = URL.createObjectURL(blob);
      if (tab) {
        tab.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `struk-${order.no_antrean}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      tab?.close();
      toast.error(err?.message || "Gagal membuat struk.");
    } finally {
      setPrinting(false);
    }
  }

  async function handleSendReceipt() {
    if (sendingReceipt) return;
    setSendingReceipt(true);
    try {
      const result = await sendReceiptToWhatsApp(order._id);
      toast.success(result?.message || "Permintaan kirim struk diterima Fonnte.");
    } catch (err) {
      toast.error(err?.message || "Gagal mengirim struk ke WhatsApp.");
    } finally {
      setSendingReceipt(false);
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
              <b>{formatPlat(order.plat)}</b>
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
          <h2>Rincian Servis</h2>
          <Rincian order={order} />
        </div>
      </div>

      {role === "admin" && !isFinal && (
        <CatatServisForm
          // key per order: form di-mount ulang dengan kondisi default tiap kali order berganti
          key={order._id}
          orderId={order._id}
          initialItems={order.items}
          initialBiayaJasa={order.biaya_jasa}
          initialDeskripsiJasa={order.deskripsi_jasa}
          onSaved={refresh}
        />
      )}

      <div className="order-acts" style={{ marginTop: 24 }}>
        <div className="order-acts-primary">
          {role === "admin" && EDIT_ALLOWED.includes(status) && (
            <button type="button" className="b b-g" onClick={() => setEditOpen(true)}>
              Ubah Data Order
            </button>
          )}
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
        <div className="order-acts-receipt">
          {role === "admin" && RECEIPT_AVAILABLE_STATUSES.includes(status) && (
            <button type="button" className="b b-ol" onClick={handlePrintReceipt} disabled={printing}>
              {printing ? "Menyiapkan Struk..." : "Cetak Struk"}
            </button>
          )}
          {role === "admin" && status === "Selesai" && (
            <button
              type="button"
              className="b b-wa"
              onClick={handleSendReceipt}
              disabled={sendingReceipt}
            >
              {sendingReceipt ? "Mengirim Pesan..." : "Kirim Struk Teks ke WhatsApp"}
            </button>
          )}
        </div>
      </div>

      {role === "mekanik" && MEKANIK_NEXT[status] && (
        <div className="cnote" style={{ marginTop: 16 }}>
          Anda hanya dapat memajukan tahap order milik Anda. Rincian suku cadang dicatat Admin.
        </div>
      )}

      {editOpen && (
        <EditOrderDialog order={order} onClose={() => setEditOpen(false)} onSaved={refresh} />
      )}

      <Dialog
        open={dialogOpen}
        title="Ubah status"
        message={`Order #${order.no_antrean} (${formatPlat(order.plat)}) saat ini berstatus ${status}`}
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
        message={`Order #${order.no_antrean} (${formatPlat(order.plat)}) akan dibatalkan. Tindakan ini tidak bisa diurungkan.`}
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
  const { id } = useParams();
  return (
    <StaffLayout>
      {/* key per order: seluruh state halaman (form, dialog, data polling) mulai dari awal saat ID berubah */}
      <OrderDetailContent key={id} />
    </StaffLayout>
  );
}