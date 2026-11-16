"use client";

import { useCallback, useEffect, useState } from "react";
import StaffLayout from "@/components/layout/StaffLayout";
import Dialog from "@/components/ui/Dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { createStaff, listStaff, toggleStaffAktif, updateStaff } from "@/services/staffService";

const PERAN = ["Admin", "Mekanik", "Owner"];
const PERAN_ORDER = { Owner: 0, Admin: 1, Mekanik: 2 };
const EMPTY_FORM = { nama: "", username: "", password: "", peran: "Mekanik" };

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

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

function SkeletonRows({ cols, count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} aria-hidden="true">
      {Array.from({ length: cols }, (_, j) => (
        <td key={j}>
          <div className="sk" style={{ height: 14, width: "70%" }} />
        </td>
      ))}
    </tr>
  ));
}

function sortStaff(list) {
  return [...list].sort(
    (a, b) =>
      (PERAN_ORDER[a.peran] ?? 9) - (PERAN_ORDER[b.peran] ?? 9) ||
      String(a.nama).localeCompare(String(b.nama), "id")
  );
}

// Pesan error dari backend: utamakan pesan per field (validasi zod), lalu pesan umum
function errorText(err, fallback) {
  const first = Array.isArray(err?.errors) ? err.errors.find((e) => e?.message) : null;
  return first?.message || err?.message || fallback;
}

// Form tambah/edit staf dalam dialog. Di-mount hanya saat dibuka, jadi isinya selalu segar.
// staff = null -> tambah; staff = objek -> edit (password tidak bisa diubah di sini).
function StaffFormDialog({ staff, isSelf, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(staff);

  const [form, setForm] = useState(
    isEdit ? { nama: staff.nama || "", username: staff.username || "", password: "", peran: staff.peran } : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const patch = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSave() {
    if (saving) return;
    setFormError("");

    const nama = form.nama.trim();
    const username = form.username.trim().toLowerCase();

    if (!nama) return setFormError("Nama wajib diisi.");
    if (username.length < 3) return setFormError("Username minimal 3 karakter.");
    if (!/^[a-z0-9._-]+$/.test(username)) {
      return setFormError("Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip.");
    }
    if (!isEdit && form.password.length < 6) return setFormError("Password minimal 6 karakter.");
    if (!PERAN.includes(form.peran)) return setFormError("Pilih peran staf.");

    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        // kirim hanya field yang berubah
        const payload = {};
        if (nama !== staff.nama) payload.nama = nama;
        if (username !== staff.username) payload.username = username;
        if (form.peran !== staff.peran) payload.peran = form.peran;
        if (Object.keys(payload).length === 0) {
          onClose();
          return;
        }
        saved = await updateStaff(staff._id, payload);
        toast.success(`Data ${saved.nama} diperbarui.`);
      } else {
        saved = await createStaff({ nama, username, password: form.password, peran: form.peran });
        toast.success(`Akun ${saved.nama} berhasil ditambahkan.`);
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      setFormError(errorText(err, "Gagal menyimpan data staf."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      title={isEdit ? "Edit staf" : "Tambah staf"}
      message={isEdit ? "Password tidak bisa diubah dari sini." : "Akun baru langsung aktif dan bisa dipakai login."}
      confirmLabel={isEdit ? "Simpan" : "Tambah Staf"}
      loading={saving}
      onConfirm={handleSave}
      onCancel={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <label className="fld" htmlFor="staf-nama" style={{ marginBottom: 12 }}>
          <span>Nama</span>
          <input
            id="staf-nama"
            className="in"
            autoComplete="off"
            maxLength={100}
            value={form.nama}
            onChange={patch("nama")}
            disabled={saving}
          />
        </label>
        <label className="fld" htmlFor="staf-username" style={{ marginBottom: 12 }}>
          <span>Username</span>
          <input
            id="staf-username"
            className="in"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={50}
            value={form.username}
            onChange={patch("username")}
            disabled={saving}
          />
          <span className="help">Huruf, angka, titik, garis bawah, atau strip. Disimpan dalam huruf kecil.</span>
        </label>
        {!isEdit && (
          <label className="fld" htmlFor="staf-password" style={{ marginBottom: 12 }}>
            <span>Password</span>
            <input
              id="staf-password"
              className="in"
              type="password"
              autoComplete="new-password"
              maxLength={100}
              value={form.password}
              onChange={patch("password")}
              disabled={saving}
            />
            <span className="help">Minimal 6 karakter.</span>
          </label>
        )}
        <label className="fld" htmlFor="staf-peran" style={{ marginBottom: 12 }}>
          <span>Peran</span>
          <select
            id="staf-peran"
            className="in"
            value={form.peran}
            onChange={patch("peran")}
            disabled={saving}
          >
            {PERAN.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {isSelf && form.peran !== "Owner" && (
            <span className="help">Peran Anda akan berubah dan Anda tidak bisa membuka halaman ini lagi.</span>
          )}
        </label>
        {/* tombol submit tersembunyi supaya Enter di dalam form ikut menyimpan */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
      {formError && <ErrorMessage>{formError}</ErrorMessage>}
    </Dialog>
  );
}

function StaffContent() {
  const { user } = useAuth();
  const toast = useToast();

  const [staff, setStaff] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [formTarget, setFormTarget] = useState(null); // null = tertutup, "new" = tambah, objek = edit
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const myId = String(user?._id || user?.id || "");
  const isSelf = (s) => myId !== "" && String(s._id) === myId;

  // Ambil daftar staf; state hanya diubah di callback promise (aman dipanggil dari effect)
  const fetchStaff = useCallback(
    (isCancelled = () => false) =>
      listStaff()
        .then((data) => {
          if (isCancelled()) return;
          setStaff(sortStaff(Array.isArray(data) ? data : []));
          setLoadError("");
          setLoaded(true);
        })
        .catch((err) => {
          if (!isCancelled()) setLoadError(errorText(err, "Gagal memuat daftar staf."));
        })
        .finally(() => {
          if (!isCancelled()) setLoading(false);
        }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    fetchStaff(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchStaff]);

  function load() {
    setLoading(true);
    fetchStaff();
  }

  function upsert(saved) {
    setStaff((list) =>
      sortStaff(list.some((s) => s._id === saved._id) ? list.map((s) => (s._id === saved._id ? saved : s)) : [...list, saved])
    );
  }

  async function handleToggle() {
    if (!toggleTarget || toggling) return;
    setToggling(true);
    setToggleError("");
    try {
      const saved = await toggleStaffAktif(toggleTarget._id);
      upsert(saved);
      toast.success(`Akun ${saved.nama} ${saved.aktif ? "diaktifkan" : "dinonaktifkan"}.`);
      setToggleTarget(null);
    } catch (err) {
      setToggleError(errorText(err, "Gagal mengubah status akun."));
    } finally {
      setToggling(false);
    }
  }

  const aktifCount = staff.filter((s) => s.aktif).length;

  return (
    <>
      <div className="top">
        <div>
          <h1 className="pt">Kelola Staf</h1>
          {loaded && (
            <p className="muted" style={{ marginTop: 10 }}>
              {staff.length} akun · {aktifCount} aktif
            </p>
          )}
        </div>
        <div className="row">
          <button type="button" className="b b-r" onClick={() => setFormTarget("new")}>
            Tambah Staf
          </button>
        </div>
      </div>

      {loadError && (
        <ErrorMessage>
          {loadError}
          {loaded ? " Menampilkan data terakhir." : ""}
        </ErrorMessage>
      )}

      <div className="pn">
        <div className="tw">
          <table className="rs" aria-busy={(loading && !loaded) || undefined}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && !loaded ? (
                <SkeletonRows cols={5} />
              ) : (
                staff.map((s) => (
                  <tr key={s._id}>
                    <td data-l="Nama">
                      <b>{s.nama}</b>
                      {isSelf(s) && <span className="muted small"> (Anda)</span>}
                    </td>
                    <td data-l="Username">{s.username}</td>
                    <td data-l="Peran">{s.peran}</td>
                    <td data-l="Status">
                      <span className={s.aktif ? "okst" : "lowst"}>{s.aktif ? "AKTIF" : "NONAKTIF"}</span>
                    </td>
                    <td>
                      <div className="acts">
                        <button type="button" className="b b-g sm" onClick={() => setFormTarget(s)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className={s.aktif ? "b b-d sm" : "b b-g sm"}
                          onClick={() => {
                            setToggleError("");
                            setToggleTarget(s);
                          }}
                          disabled={s.aktif && isSelf(s)}
                          title={s.aktif && isSelf(s) ? "Anda tidak bisa menonaktifkan akun sendiri" : undefined}
                        >
                          {s.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {loaded && staff.length === 0 && (
            <p className="muted" style={{ padding: "24px 14px" }}>
              Belum ada staf.
            </p>
          )}
        </div>
      </div>

      {formTarget && (
        <StaffFormDialog
          staff={formTarget === "new" ? null : formTarget}
          isSelf={formTarget !== "new" && isSelf(formTarget)}
          onClose={() => setFormTarget(null)}
          onSaved={upsert}
        />
      )}

      <Dialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.aktif ? "Nonaktifkan akun" : "Aktifkan akun"}
        message={
          toggleTarget?.aktif
            ? `${toggleTarget?.nama} (${toggleTarget?.username}) tidak akan bisa login sampai akunnya diaktifkan lagi.`
            : `${toggleTarget?.nama} (${toggleTarget?.username}) akan bisa login kembali.`
        }
        confirmLabel={toggleTarget?.aktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        danger={Boolean(toggleTarget?.aktif)}
        loading={toggling}
        onConfirm={handleToggle}
        onCancel={() => setToggleTarget(null)}
      >
        {toggleError && <ErrorMessage>{toggleError}</ErrorMessage>}
      </Dialog>
    </>
  );
}

export default function StaffPage() {
  return (
    <StaffLayout>
      <StaffContent />
    </StaffLayout>
  );
}
