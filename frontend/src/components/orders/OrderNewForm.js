"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useDebounce from "@/hooks/useDebounce";
import useFormDraft from "@/hooks/useFormDraft";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/apiClient";
import {
  createOrder,
  getMechanicWorkload,
  listOrders,
} from "@/services/ordersService";
import ActivePlatWarning from "./ActivePlatWarning";
import CustomerSearchCards from "./CustomerSearchCards";
import styles from "./orderNew.module.css";

const FINAL_STATUS = new Set(["Diambil", "Dibatalkan"]);

const INITIAL = {
  mode: "baru",
  nama: "",
  no_wa: "",
  search: "",
  selectedId: "",
  selectedNama: "",
  plat: "",
  keluhan: "",
  mekanik: "",
};

const ARROW = (
  <span className="ar" aria-hidden="true">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  </span>
);

function isActiveOrder(order) {
  return order && !FINAL_STATUS.has(order.status);
}

/**
 * Form buat order: pelanggan baru/lama, plat, keluhan, mekanik.
 * onSuccess(order, { typedNama, mode }) dipanggil setelah POST berhasil.
 */
export default function OrderNewForm({ onSuccess }) {
  const toast = useToast();
  const [form, setForm, { clearDraft }] = useFormDraft("order-baru", INITIAL);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [mechanics, setMechanics] = useState([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(true);
  const [mechanicsError, setMechanicsError] = useState("");

  const [activeOrder, setActiveOrder] = useState(null);
  const [activeForPlat, setActiveForPlat] = useState("");
  const debouncedPlat = useDebounce(form.plat, 400);

  // Muat daftar mekanik + jumlah order aktif (ORD-5)
  useEffect(() => {
    let cancelled = false;

    getMechanicWorkload()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setMechanics(list);
        // Pertahankan draft bila masih valid; kalau kosong, pilih mekanik pertama (seperti prototype)
        setForm((prev) => {
          if (prev.mekanik) {
            const stillThere = list.some(
              (m) => String(m.id || m._id) === String(prev.mekanik)
            );
            return stillThere ? prev : { ...prev, mekanik: list[0] ? String(list[0].id || list[0]._id) : "" };
          }
          if (!list.length) return prev;
          return { ...prev, mekanik: String(list[0].id || list[0]._id) };
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setMechanics([]);
        setMechanicsError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat daftar mekanik."
        );
      })
      .finally(() => {
        if (!cancelled) setMechanicsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setForm]);

  // ORD-20: cek plat yang masih punya order aktif
  const platKey = String(debouncedPlat || "")
    .replace(/\s+/g, "")
    .toUpperCase();

  useEffect(() => {
    if (platKey.length < 3) return undefined;

    let cancelled = false;
    listOrders({ plat: platKey })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const found = list.find(isActiveOrder) || null;
        setActiveOrder(found);
        setActiveForPlat(platKey);
      })
      .catch(() => {
        if (cancelled) return;
        setActiveOrder(null);
        setActiveForPlat(platKey);
      });

    return () => {
      cancelled = true;
    };
  }, [platKey]);

  const shownActiveOrder =
    platKey.length >= 3 && activeForPlat === platKey ? activeOrder : null;

  function patch(partial) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function setMode(mode) {
    setErrors({});
    patch({
      mode,
      selectedId: mode === "baru" ? "" : form.selectedId,
      selectedNama: mode === "baru" ? "" : form.selectedNama,
    });
  }

  function validate() {
    const next = {};
    const plat = form.plat.trim();
    const keluhan = form.keluhan.trim();

    if (form.mode === "baru") {
      const nama = form.nama.trim();
      if (!nama) next.nama = "Nama pelanggan wajib diisi";
      else if (nama.length > 100) next.nama = "Nama pelanggan maksimal 100 karakter";
    }

    if (!plat) next.plat = "Plat nomor wajib diisi";
    else if (plat.length < 3 || plat.length > 15) next.plat = "Plat nomor tidak valid";

    if (!keluhan) next.keluhan = "Keluhan wajib diisi";
    else if (keluhan.length > 500) next.keluhan = "Keluhan maksimal 500 karakter";

    if (!form.mekanik) next.mekanik = "Mekanik wajib dipilih";

    setErrors(next);

    if (form.mode === "lama" && !form.selectedId) {
      toast.error("Pilih pelanggan terlebih dahulu");
      return false;
    }

    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    const plat = form.plat.trim().toUpperCase();
    const keluhan = form.keluhan.trim();
    const typedNama = form.nama.trim();

    const payload = {
      plat,
      keluhan,
      mekanik: form.mekanik,
    };

    if (form.mode === "lama") {
      payload.customer = { id: form.selectedId };
    } else {
      const customer = { nama: typedNama };
      const wa = form.no_wa.trim();
      if (wa) customer.no_wa = wa;
      payload.customer = customer;
    }

    setSubmitting(true);
    try {
      const order = await createOrder(payload);
      clearDraft();
      onSuccess(order, { typedNama, mode: form.mode });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.errors?.length) {
        const fieldMap = {};
        for (const item of err.errors) {
          if (!item?.field) continue;
          // Backend field bisa "customer.nama" atau "plat"
          const key = String(item.field).includes("nama")
            ? "nama"
            : String(item.field).includes("mekanik")
              ? "mekanik"
              : String(item.field).includes("keluhan")
                ? "keluhan"
                : String(item.field).includes("plat")
                  ? "plat"
                  : item.field;
          fieldMap[key] = item.message;
        }
        if (Object.keys(fieldMap).length) {
          setErrors((prev) => ({ ...prev, ...fieldMap }));
        } else {
          toast.error(err.message || "Gagal membuat order.");
        }
      } else {
        toast.error(
          err instanceof ApiError
            ? err.message
            : "Gagal membuat order. Coba lagi."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const keluhanLen = form.keluhan.length;

  return (
    <form className={`pn ${styles.wrap}`} onSubmit={handleSubmit} noValidate>
      <div className={`seg ${styles.seg}`} role="tablist" aria-label="Jenis pelanggan">
        <button
          type="button"
          role="tab"
          className={form.mode === "baru" ? "on" : ""}
          aria-selected={form.mode === "baru"}
          onClick={() => setMode("baru")}
        >
          Pelanggan baru
        </button>
        <button
          type="button"
          role="tab"
          className={form.mode === "lama" ? "on" : ""}
          aria-selected={form.mode === "lama"}
          onClick={() => setMode("lama")}
        >
          Pelanggan lama
        </button>
      </div>

      {form.mode === "baru" ? (
        <div>
          <label className="fld">
            <span>Nama pelanggan</span>
            <input
              className="in"
              value={form.nama}
              maxLength={100}
              placeholder="Budi Santoso"
              onChange={(e) => {
                patch({ nama: e.target.value });
                if (errors.nama) setErrors((p) => ({ ...p, nama: "" }));
              }}
              autoComplete="name"
            />
            {errors.nama ? <div className="err">{errors.nama}</div> : null}
          </label>

          <label className="fld">
            <span>Nomor WhatsApp (opsional)</span>
            <input
              className="in"
              value={form.no_wa}
              maxLength={20}
              placeholder="0812 3456 7890"
              inputMode="tel"
              onChange={(e) => patch({ no_wa: e.target.value })}
              autoComplete="tel"
            />
            <div className="help">
              Awali dengan 08 atau 62. Dipakai untuk pemberitahuan WhatsApp dan
              mencocokkan riwayat.
            </div>
          </label>
        </div>
      ) : (
        <CustomerSearchCards
          query={form.search}
          onQueryChange={(search) => patch({ search })}
          selectedId={form.selectedId}
          onSelect={(c) =>
            patch({
              selectedId: c._id,
              selectedNama: c.nama || "",
            })
          }
        />
      )}

      <label className="fld">
        <span>Plat nomor</span>
        <input
          className="in"
          value={form.plat}
          maxLength={15}
          placeholder="AB 1234 CD"
          style={{ textTransform: "uppercase" }}
          onChange={(e) => {
            patch({ plat: e.target.value.toUpperCase() });
            if (errors.plat) setErrors((p) => ({ ...p, plat: "" }));
          }}
          autoComplete="off"
        />
        <ActivePlatWarning order={shownActiveOrder} />
        {errors.plat ? <div className="err">{errors.plat}</div> : null}
      </label>

      <label className="fld">
        <span>Keluhan</span>
        <textarea
          className="in"
          value={form.keluhan}
          maxLength={500}
          placeholder="Jelaskan keluhan motor"
          rows={4}
          onChange={(e) => {
            patch({ keluhan: e.target.value.slice(0, 500) });
            if (errors.keluhan) setErrors((p) => ({ ...p, keluhan: "" }));
          }}
        />
        <div className="help">
          {keluhanLen} / 500
        </div>
        {errors.keluhan ? <div className="err">{errors.keluhan}</div> : null}
      </label>

      <label className="fld">
        <span>Mekanik</span>
        {mechanicsLoading ? (
          <div className={`sk ${styles.skSelect}`} aria-busy="true" />
        ) : (
          <select
            className="in"
            value={form.mekanik}
            onChange={(e) => {
              patch({ mekanik: e.target.value });
              if (errors.mekanik) setErrors((p) => ({ ...p, mekanik: "" }));
            }}
          >
            {mechanics.length === 0 ? (
              <option value="">Tidak ada mekanik aktif</option>
            ) : null}
            {mechanics.map((m) => {
              const id = String(m.id || m._id);
              const aktif = m.order_aktif ?? 0;
              return (
                <option key={id} value={id}>
                  {m.nama} ({aktif} order aktif)
                </option>
              );
            })}
          </select>
        )}
        {mechanicsError ? <div className="err">{mechanicsError}</div> : null}
        {errors.mekanik ? <div className="err">{errors.mekanik}</div> : null}
      </label>

      <div className="row">
        <button
          type="submit"
          className={`b b-r big ${styles.submitBtn}`}
          disabled={submitting || mechanicsLoading}
        >
          {submitting ? "Menyimpan…" : <>Buat Order{ARROW}</>}
        </button>
        <Link href="/orders" className="b b-g">
          Batal
        </Link>
      </div>
    </form>
  );
}
