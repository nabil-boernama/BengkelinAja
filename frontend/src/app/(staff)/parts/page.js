"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createPart, deletePart, listParts, updatePart } from "@/services/partsService";

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const EMPTY_FORM = {
  nama: "",
  harga: "",
  stok: "",
  batas_minimum: "",
};

function partId(part) {
  return part._id || part.id;
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

async function fetchParts() {
  const data = await listParts();
  if (!Array.isArray(data)) {
    throw new Error("Data suku cadang dari server tidak sesuai.");
  }
  return data;
}

export default function PartsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchParts()
      .then((data) => {
        if (cancelled) return;
        setParts(data);
        setLoadError("");
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(error, "Daftar suku cadang gagal dimuat."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockParts = parts.filter((part) => part.stok <= part.batas_minimum);
  const totalUnits = parts.reduce((total, part) => total + part.stok, 0);
  const filteredParts = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("id-ID");
    return parts
      .filter((part) => {
        const matchesName = !search || part.nama.toLocaleLowerCase("id-ID").includes(search);
        const isLow = part.stok <= part.batas_minimum;
        return matchesName && (!lowOnly || isLow);
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }, [parts, query, lowOnly]);

  function openAddDialog() {
    setSelectedPart(null);
    setForm(EMPTY_FORM);
    setActionError("");
    setNotice("");
    setDialog("form");
  }

  function openEditDialog(part) {
    setSelectedPart(part);
    setForm({
      nama: part.nama,
      harga: String(part.harga),
      stok: String(part.stok),
      batas_minimum: String(part.batas_minimum),
    });
    setActionError("");
    setNotice("");
    setDialog("form");
  }

  function openDeleteDialog(part) {
    setSelectedPart(part);
    setActionError("");
    setNotice("");
    setDialog("delete");
  }

  function closeDialog() {
    if (saving) return;
    setDialog(null);
    setActionError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;

    const payload = {
      nama: form.nama.trim(),
      harga: Number(form.harga),
      stok: Number(form.stok),
      batas_minimum: Number(form.batas_minimum),
    };

    const numbersValid =
      Number.isFinite(payload.harga) &&
      payload.harga >= 0 &&
      Number.isInteger(payload.stok) &&
      payload.stok >= 0 &&
      Number.isInteger(payload.batas_minimum) &&
      payload.batas_minimum >= 0;

    if (!payload.nama || !numbersValid) {
      setActionError("Lengkapi nama dan isi angka yang valid untuk harga dan stok.");
      return;
    }

    setSaving(true);
    setActionError("");
    try {
      if (selectedPart) {
        const updated = await updatePart(partId(selectedPart), payload);
        setParts((current) =>
          current.map((part) => (partId(part) === partId(selectedPart) ? updated : part))
        );
        setNotice("Perubahan suku cadang berhasil disimpan.");
      } else {
        const created = await createPart(payload);
        setParts((current) =>
          [...current, created].sort((a, b) => a.nama.localeCompare(b.nama, "id"))
        );
        setNotice("Suku cadang berhasil ditambahkan.");
      }
      setDialog(null);
    } catch (error) {
      setActionError(getErrorMessage(error, "Suku cadang gagal disimpan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedPart || saving) return;

    setSaving(true);
    setActionError("");
    try {
      await deletePart(partId(selectedPart));
      setParts((current) =>
        current.filter((part) => partId(part) !== partId(selectedPart))
      );
      setDialog(null);
      setNotice("Suku cadang berhasil dihapus.");
    } catch (error) {
      setActionError(getErrorMessage(error, "Suku cadang gagal dihapus."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setNotice("");
    try {
      setParts(await fetchParts());
      setLoadError("");
    } catch (error) {
      setLoadError(getErrorMessage(error, "Daftar suku cadang gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="row sp" style={{ marginBottom: 24 }}>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1.1 }}
        >
          Stok Suku Cadang
        </h1>
        <div className="row">
          <button className="b b-g sm" type="button" onClick={handleRefresh} disabled={loading}>
            Muat ulang
          </button>
          {isAdmin && (
            <button className="b b-p" type="button" onClick={openAddDialog}>
              Tambah Suku Cadang
            </button>
          )}
        </div>
      </div>

      <div
        className="cards"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 24 }}
      >
        <section className="cc">
          <p className="muted small">Stok menipis</p>
          <p style={{ fontSize: 36, fontWeight: 800 }}>{lowStockParts.length}</p>
        </section>
        <section className="cc">
          <p className="muted small">Jenis suku cadang</p>
          <p style={{ fontSize: 36, fontWeight: 800 }}>{parts.length}</p>
        </section>
        <section className="cc">
          <p className="muted small">Total unit di rak</p>
          <p style={{ fontSize: 36, fontWeight: 800 }}>{totalUnits}</p>
        </section>
      </div>

      {lowStockParts.length > 0 && (
        <div className="warn" style={{ marginBottom: 20 }}>
          <span>
            {lowStockParts.length} suku cadang hampir habis
          </span>
          <button
            className="b b-g sm"
            style={{ marginLeft: "auto" }}
            type="button"
            onClick={() => setLowOnly((current) => !current)}
          >
            {lowOnly ? "Tampilkan semua" : "Lihat yang menipis"}
          </button>
        </div>
      )}

      <div style={{ maxWidth: 420, marginBottom: 20 }}>
        <label className="fld" htmlFor="cari-suku-cadang">
          <span>Cari suku cadang</span>
          <input
            className="in"
            id="cari-suku-cadang"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Masukkan nama suku cadang"
          />
        </label>
      </div>

      {notice && (
        <p className="cnote" role="status" style={{ marginBottom: 16 }}>
          {notice}
        </p>
      )}
      {loadError && (
        <div className="ermsg" role="alert" style={{ marginBottom: 16 }}>
          <span>{loadError}</span>
        </div>
      )}

      <section className="pn">
        {loading ? (
          <p className="muted" role="status">
            Memuat daftar suku cadang...
          </p>
        ) : loadError ? null : filteredParts.length === 0 ? (
          <p className="muted">
            {parts.length === 0
              ? "Belum ada data suku cadang."
              : "Tidak ada suku cadang yang cocok."}
          </p>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Batas minimum</th>
                  <th>Status</th>
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => {
                  const isLow = part.stok <= part.batas_minimum;
                  return (
                    <tr key={partId(part)}>
                      <td data-l="Nama">
                        <b>{part.nama}</b>
                      </td>
                      <td data-l="Harga">{RUPIAH.format(part.harga)}</td>
                      <td className="num" data-l="Stok">{part.stok}</td>
                      <td data-l="Batas minimum">{part.batas_minimum}</td>
                      <td data-l="Status">
                        <span className={isLow ? "lowst" : "okst"}>
                          {isLow ? "MENIPIS" : "AMAN"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td data-l="Aksi">
                          <div className="acts">
                            <button
                              className="b b-g sm"
                              type="button"
                              onClick={() => openEditDialog(part)}
                            >
                              Ubah
                            </button>
                            <button
                              className="b b-d sm"
                              type="button"
                              onClick={() => openDeleteDialog(part)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog === "form" && (
        <div
          className="dlg"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section className="box" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <h2 id="dialog-title">
              {selectedPart ? "Ubah Suku Cadang" : "Tambah Suku Cadang"}
            </h2>
            <form onSubmit={handleSave}>
              <label className="fld" htmlFor="part-name">
                <span>Nama</span>
                <input
                  className="in"
                  id="part-name"
                  value={form.nama}
                  onChange={(event) => setForm({ ...form, nama: event.target.value })}
                  maxLength={100}
                  required
                />
              </label>
              <label className="fld" htmlFor="part-price">
                <span>Harga (Rp)</span>
                <input
                  className="in"
                  id="part-price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.harga}
                  onChange={(event) => setForm({ ...form, harga: event.target.value })}
                  required
                />
              </label>
              <label className="fld" htmlFor="part-stock">
                <span>{selectedPart ? "Stok" : "Stok awal"}</span>
                <input
                  className="in"
                  id="part-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stok}
                  onChange={(event) => setForm({ ...form, stok: event.target.value })}
                  required
                />
              </label>
              <label className="fld" htmlFor="part-minimum">
                <span>Batas minimum</span>
                <input
                  className="in"
                  id="part-minimum"
                  type="number"
                  min="0"
                  step="1"
                  value={form.batas_minimum}
                  onChange={(event) =>
                    setForm({ ...form, batas_minimum: event.target.value })
                  }
                  required
                />
                <span className="help">
                  Peringatan muncul bila stok sama dengan atau kurang dari angka ini.
                </span>
              </label>

              {actionError && (
                <div className="ermsg" role="alert">
                  <span>{actionError}</span>
                </div>
              )}

              <div className="row end">
                <button className="b b-g" type="button" onClick={closeDialog} disabled={saving}>
                  Batal
                </button>
                <button className="b b-p" type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {dialog === "delete" && selectedPart && (
        <div
          className="dlg"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section className="box" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <h2 id="delete-title">Hapus suku cadang</h2>
            <p>
              Hapus suku cadang {selectedPart.nama}? Tindakan ini tidak dapat dibatalkan.
            </p>
            {actionError && (
              <div className="ermsg" role="alert">
                <span>{actionError}</span>
              </div>
            )}
            <div className="row end">
              <button className="b b-g" type="button" onClick={closeDialog} disabled={saving}>
                Batal
              </button>
              <button className="b b-d" type="button" onClick={handleDelete} disabled={saving}>
                {saving ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
