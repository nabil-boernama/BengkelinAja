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
import { searchCustomerPlates } from "@/services/customersService";
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
  selectedNoWa: "",
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

function formatPlatInput(value) {
  const normalized = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const prefix = normalized.match(/^[A-Z]{1,2}/)?.[0] || "";
  const rest = normalized.slice(prefix.length);
  const digits = rest.match(/^\d{1,4}/)?.[0] || "";
  const suffix = rest.slice(digits.length).replace(/[^A-Z]/g, "").slice(0, 3);
  return [prefix, digits, suffix].filter(Boolean).join(" ");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
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
  const [plateSuggestions, setPlateSuggestions] = useState([]);
  const [plateSuggestionsFor, setPlateSuggestionsFor] = useState("");
  const [plateSuggestionsError, setPlateSuggestionsError] = useState("");
  const [selectedPlateLoading, setSelectedPlateLoading] = useState(false);
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
  const currentPlatKey = String(form.plat || "")
    .replace(/\s+/g, "")
    .toUpperCase();

  useEffect(() => {
    if (form.mode !== "lama" || !platKey) {
      setPlateSuggestions([]);
      setPlateSuggestionsFor("");
      setPlateSuggestionsError("");
      return undefined;
    }

    let cancelled = false;
    setPlateSuggestionsError("");
    searchCustomerPlates(platKey)
      .then((data) => {
        if (cancelled) return;
        setPlateSuggestions(Array.isArray(data) ? data : []);
        setPlateSuggestionsFor(platKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setPlateSuggestions([]);
        setPlateSuggestionsFor(platKey);
        setPlateSuggestionsError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat saran plat nomor."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [form.mode, platKey]);

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
    if (mode === form.mode) return;
    setErrors({});
    setPlateSuggestionsFor("");
    setForm((prev) => ({
      ...prev,
      mode,
      nama: "",
      no_wa: "",
      search: "",
      selectedId: "",
      selectedNama: "",
      selectedNoWa: "",
      plat: "",
      keluhan: "",
    }));
  }

  function validate() {
    const next = {};
    const plat = form.plat.trim();
    const keluhan = form.keluhan.trim();
    const noWa = normalizePhone(
      form.mode === "baru" ? form.no_wa : form.selectedNoWa
    );

    if (form.mode === "baru") {
      const nama = form.nama.trim();
      if (!nama) next.nama = "Nama pelanggan wajib diisi";
      else if (nama.length > 100) next.nama = "Nama pelanggan maksimal 100 karakter";
    }

    if (!noWa) next.no_wa = "Nomor WhatsApp wajib diisi";
    else if (noWa.length < 8 || noWa.length > 13) {
      next.no_wa = "Nomor WhatsApp harus berisi 8 sampai 13 digit";
    }

    if (!plat) next.plat = "Plat nomor wajib diisi";
    else if (!/^[A-Z]{1,2}\s+\d{1,4}(?:\s+[A-Z]{1,3})?$/i.test(plat)) {
      next.plat = "Gunakan format plat Indonesia, misalnya AB 1234 CD";
    }

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
      payload.customer = {
        nama: typedNama,
        no_wa: normalizePhone(form.no_wa),
      };
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
            : String(item.field).includes("no_wa")
              ? "no_wa"
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
      } else if (err instanceof ApiError && err.status === 409) {
        setErrors((prev) => ({ ...prev, no_wa: err.message }));
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

  async function selectRegisteredPlate(plate) {
    setSelectedPlateLoading(true);
    setPlateSuggestionsFor("");
    setPlateSuggestionsError("");
    try {
      const orders = await listOrders({ plat: plate });
      const latest = Array.isArray(orders) ? orders[0] : null;
      if (!latest?.customer?._id) {
        throw new Error("Data pelanggan untuk plat tersebut tidak ditemukan.");
      }
      patch({
        selectedId: latest.customer._id,
        selectedNama: latest.customer.nama || "",
        selectedNoWa: normalizePhone(latest.customer.no_wa),
        nama: latest.customer.nama || "",
        no_wa: normalizePhone(latest.customer.no_wa),
        search: latest.customer.nama || "",
        plat: formatPlatInput(plate),
      });
      setErrors((prev) => ({ ...prev, no_wa: "" }));
    } catch (err) {
      setPlateSuggestionsError(
        err instanceof ApiError
          ? err.message
          : err.message || "Gagal memilih plat nomor."
      );
    } finally {
      setSelectedPlateLoading(false);
    }
  }

  function selectCustomer(customer) {
    setPlateSuggestionsFor("");
    patch({
      selectedId: customer._id,
      selectedNama: customer.nama || "",
      selectedNoWa: normalizePhone(customer.no_wa),
      nama: customer.nama || "",
      no_wa: normalizePhone(customer.no_wa),
      plat: customer.plat_terakhir
        ? formatPlatInput(customer.plat_terakhir)
        : form.plat,
    });
    setErrors((prev) => ({ ...prev, no_wa: "" }));
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
              required
              onChange={(e) => {
                patch({ nama: e.target.value });
                if (errors.nama) setErrors((p) => ({ ...p, nama: "" }));
              }}
              autoComplete="name"
            />
            {errors.nama ? <div className="err on" role="alert">{errors.nama}</div> : null}
          </label>

          <label className="fld">
            <span>Nomor WhatsApp</span>
            <input
              className="in"
              value={form.no_wa}
              maxLength={13}
              placeholder="081234567890"
              inputMode="tel"
              required
              onChange={(e) => {
                patch({ no_wa: normalizePhone(e.target.value).slice(0, 13) });
                if (errors.no_wa) setErrors((prev) => ({ ...prev, no_wa: "" }));
              }}
              autoComplete="tel"
            />
            <div className="help">
              Masukkan 8–13 digit. Nomor harus unik untuk setiap pelanggan.
            </div>
            {errors.no_wa ? <div className="err on" role="alert">{errors.no_wa}</div> : null}
          </label>
        </div>
      ) : form.selectedId ? (
        <div className="cc" style={{ marginBottom: 20 }}>
          <div className="muted small">Pelanggan dipilih</div>
          <b>{form.selectedNama}</b>
          <div className="muted">
            {form.selectedNoWa || "Nomor WhatsApp belum terdaftar"}
          </div>
          <button
            type="button"
            className="b b-g sm"
            style={{ marginTop: 12 }}
            onClick={() => patch({
              selectedId: "",
              selectedNama: "",
              selectedNoWa: "",
              nama: "",
              no_wa: "",
              search: "",
            })}
          >
            Ganti pelanggan
          </button>
        </div>
      ) : (
        <CustomerSearchCards
          query={form.search}
          onQueryChange={(search) => patch({ search })}
          selectedId={form.selectedId}
          onSelect={selectCustomer}
        />
      )}

      {form.mode === "lama" && errors.no_wa ? (
        <div className="err on" role="alert" style={{ marginTop: -12, marginBottom: 20 }}>
          {errors.no_wa}
        </div>
      ) : null}
      <label className="fld">
        <span>Plat nomor</span>
        <input
          className="in"
          value={form.plat}
          maxLength={11}
          placeholder="AB 1234 CD"
          required
          style={{ textTransform: "uppercase" }}
          onChange={(e) => {
            patch({ plat: formatPlatInput(e.target.value) });
            if (errors.plat) setErrors((p) => ({ ...p, plat: "" }));
          }}
          autoComplete="off"
        />
      </label>
      {form.mode === "lama" &&
      plateSuggestionsFor === platKey &&
      platKey === currentPlatKey &&
      plateSuggestions.length > 0 ? (
        <div
          className={`cards ${styles.cards}`}
          role="listbox"
          aria-label="Plat yang pernah didaftarkan"
        >
          {plateSuggestions.map(({ plat }) => (
            <button
              key={plat}
              type="button"
              className="cc"
              role="option"
              aria-selected={currentPlatKey === plat}
              style={{ textAlign: "left", cursor: "pointer", padding: "12px 16px" }}
              disabled={selectedPlateLoading}
              onClick={() => selectRegisteredPlate(plat)}
            >
              {formatPlatInput(plat)}
            </button>
          ))}
        </div>
      ) : null}
      {form.mode === "lama" && plateSuggestionsError ? (
        <div className="err on" role="alert">{plateSuggestionsError}</div>
      ) : null}
      {form.mode === "lama" && selectedPlateLoading ? (
        <div className="help" role="status">Memuat data pelanggan…</div>
      ) : null}
      <ActivePlatWarning order={shownActiveOrder} />
      {errors.plat ? <div className="err on" role="alert">{errors.plat}</div> : null}

      <label className="fld">
        <span>Keluhan</span>
        <textarea
          className="in"
          value={form.keluhan}
          maxLength={500}
          placeholder="Jelaskan keluhan motor"
          rows={4}
          required
          onChange={(e) => {
            patch({ keluhan: e.target.value.slice(0, 500) });
            if (errors.keluhan) setErrors((p) => ({ ...p, keluhan: "" }));
          }}
        />
        <div className="help">
          {keluhanLen} / 500
        </div>
        {errors.keluhan ? <div className="err on" role="alert">{errors.keluhan}</div> : null}
      </label>

      <label className="fld">
        <span>Mekanik</span>
        {mechanicsLoading ? (
          <div className={`sk ${styles.skSelect}`} aria-busy="true" />
        ) : (
          <select
            className="in"
            value={form.mekanik}
            required
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
        {mechanicsError ? <div className="err on" role="alert">{mechanicsError}</div> : null}
        {errors.mekanik ? <div className="err on" role="alert">{errors.mekanik}</div> : null}
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
