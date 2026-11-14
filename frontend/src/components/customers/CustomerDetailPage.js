"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StatusMarker from "@/components/ui/StatusMarker";
import Dialog from "@/components/ui/Dialog";
import { useToast } from "@/hooks/useToast";
import { getCustomerOrders, updateCustomer } from "@/services/customersService";
import { formatTanggalPendek, formatRupiah } from "@/lib/format";

// Menyamarkan nomor WhatsApp untuk Mekanik
function maskWa(no_wa) {
  if (!no_wa) return null;
  const digits = no_wa.replace(/\D/g, "");
  if (digits.length < 5) return no_wa;
  return digits.slice(0, 4) + " **** " + digits.slice(-4);
}

// Hitung total order di klien: biaya_jasa + jumlah × harga_satuan tiap suku cadang
function hitungTotal(order) {
  const jasaNum = Number(order.biaya_jasa) || 0;
  const partsNum = Array.isArray(order.items)
    ? order.items.reduce((sum, it) => sum + (Number(it.harga_satuan) || 0) * (Number(it.jumlah) || 0), 0)
    : 0;
  return jasaNum + partsNum;
}

// Ringkasan suku cadang: "Kampas rem x1, Oli mesin 1 L x2"
function ringkasanItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items.map((it) => `${it.part?.nama || it.part || "-"} x${it.jumlah}`).join(", ");
}

// ---- Dialog Ubah Pelanggan ----
function UbahPelangganDialog({ customer, open, onClose, onSaved }) {
  const toast = useToast();
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [saving, setSaving] = useState(false);
  const [waError, setWaError] = useState("");

  // Isi form saat dialog dibuka
  useEffect(() => {
    if (open) {
      setNama(customer?.nama || "");
      setNoWa(customer?.no_wa || "");
      setWaError("");
    }
  }, [open, customer]);

  const handleSave = useCallback(async () => {
    setWaError("");
    const payload = {};
    const namaTrim = nama.trim();
    const waTrim = noWa.trim();
    if (namaTrim) payload.nama = namaTrim;
    // Kirim no_wa meski kosong (artinya hapus nomor); hanya kalau ada perubahan
    if (waTrim !== (customer?.no_wa || "").trim()) payload.no_wa = waTrim;

    if (!namaTrim) {
      setWaError("Nama pelanggan tidak boleh kosong.");
      return;
    }
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCustomer(customer._id, payload);
      toast.success("Data pelanggan diperbarui.");
      onSaved(updated);
      onClose();
    } catch (err) {
      if (err.status === 409) {
        setWaError("Nomor WhatsApp sudah dipakai pelanggan lain.");
      } else {
        toast.error(err.message || "Gagal menyimpan data.");
      }
    } finally {
      setSaving(false);
    }
  }, [nama, noWa, customer, onClose, onSaved, toast]);

  return (
    <Dialog
      open={open}
      title="Ubah Pelanggan"
      confirmLabel="Simpan"
      loading={saving}
      onConfirm={handleSave}
      onCancel={onClose}
    >
      <label className="fld" style={{ marginBottom: 12 }}>
        <span>Nama pelanggan</span>
        <input
          className="in"
          value={nama}
          maxLength={100}
          onChange={(e) => setNama(e.target.value)}
          disabled={saving}
          autoFocus
        />
      </label>
      <label className="fld">
        <span>Nomor WhatsApp</span>
        <input
          className="in"
          value={noWa}
          maxLength={20}
          onChange={(e) => { setNoWa(e.target.value); setWaError(""); }}
          disabled={saving}
        />
        {waError && <div className="err on">{waError}</div>}
      </label>
    </Dialog>
  );
}

// ---- Kartu order di halaman detail ----
function OrderCard({ order }) {
  const total = hitungTotal(order);
  const ringkasan = ringkasanItems(order.items);

  return (
    <Link className="cc" href={`/orders/${encodeURIComponent(order._id)}`}>
      <div className="row sp">
        <div>
          <div className="muted small" style={{ fontWeight: 700 }}>
            {formatTanggalPendek(order.tanggal)} | #{order.no_antrean ?? "-"}
          </div>
          <b style={{ fontSize: 18 }}>{order.plat}</b>
          {order.keluhan && <div>{order.keluhan}</div>}
          <div className="muted small">
            Mekanik: {order.mekanik?.nama || "-"}
            {ringkasan && <> | {ringkasan}</>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {order.status && <StatusMarker status={order.status} />}
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>
            {total > 0 ? formatRupiah(total) : "-"}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---- Komponen utama halaman detail ----
export default function CustomerDetailPage() {
  const { id: customerId } = useParams();
  const { role } = useAuth();
  const toast = useToast();
  const isAdmin = role === "admin";
  const isMekanik = role === "mekanik";

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerOrders(customerId);
      setCustomer(data.customer);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err.message || "Gagal memuat data pelanggan.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  // Perbarui data customer setelah dialog simpan berhasil
  const handleSaved = useCallback((updated) => {
    setCustomer((prev) => ({ ...prev, ...updated }));
  }, []);

  const wa = isMekanik ? maskWa(customer?.no_wa) : customer?.no_wa;

  return (
    <>
      {/* Tombol kembali */}
      <Link
        className="muted"
        href="/customers"
        style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 700, marginBottom: 16 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Kembali ke riwayat
      </Link>

      {/* Judul */}
      <div className="top">
        <h1 className="pt">
          {customer ? `Riwayat ${customer.nama}` : loading ? "Memuat..." : "Riwayat Pelanggan"}
        </h1>
      </div>

      {/* Pesan error muatan pertama */}
      {error && !loading && (
        <p className="ermsg on" role="alert">{error}</p>
      )}

      {/* Skeleton saat loading */}
      {loading && (
        <div className="pn" style={{ marginBottom: 20 }}>
          <div className="sk" style={{ height: 24, width: 200, marginBottom: 8 }} />
          <div className="sk" style={{ height: 16, width: 140 }} />
        </div>
      )}

      {/* Panel info pelanggan */}
      {!loading && customer && (
        <div className="pn" style={{ marginBottom: 20 }}>
          <div className="row sp">
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{customer.nama}</div>
              {wa ? (
                <div className="muted">WhatsApp: {wa}</div>
              ) : (
                <div className="muted">Tanpa nomor WhatsApp</div>
              )}
            </div>
            {isAdmin && (
              <button
                type="button"
                className="b b-p"
                onClick={() => setDialogOpen(true)}
              >
                Ubah
              </button>
            )}
          </div>
        </div>
      )}

      {/* Daftar order */}
      {!loading && !error && (
        orders.length > 0 ? (
          <div className="cards">
            {orders.map((o) => (
              <OrderCard key={o._id} order={o} />
            ))}
          </div>
        ) : (
          customer && (
            <p className="muted">Belum ada order untuk pelanggan ini.</p>
          )
        )
      )}

      {/* Dialog ubah pelanggan */}
      {isAdmin && customer && (
        <UbahPelangganDialog
          customer={customer}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
