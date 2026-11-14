"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "ba_draft:";

function readDraft(storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * State form yang otomatis disimpan ke sessionStorage, supaya isian tidak hilang
 * saat halaman dimuat ulang. Draft hilang sendiri saat tab ditutup.
 *
 * const [form, setForm, { clearDraft, restored }] = useFormDraft("order-baru", { plat: "", keluhan: "" });
 * setForm((f) => ({ ...f, plat: "AB 1234 CD" }));
 * // setelah submit berhasil: clearDraft();
 *
 * `restored` bernilai true bila ada draft lama yang dipulihkan.
 * Jangan simpan data sensitif (mis. password) dengan hook ini.
 */
export default function useFormDraft(key, initialValue) {
  const storageKey = `${PREFIX}${key}`;
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);

  // Pulihkan draft setelah mount (sessionStorage tidak ada di server, dan membacanya
  // saat render pertama akan membuat hasil hydration berbeda dari server).
  useEffect(() => {
    const saved = readDraft(storageKey);
    /* eslint-disable react-hooks/set-state-in-effect -- sinkronisasi sekali dari sessionStorage */
    if (saved !== undefined) {
      setValue(saved);
      setRestored(true);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);

  // Simpan setiap perubahan, tapi baru setelah draft lama selesai dibaca agar tidak tertimpa.
  // Nilai awal (termasuk setelah clearDraft) tidak disimpan, supaya tidak muncul draft kosong.
  useEffect(() => {
    if (!ready || value === initialRef.current) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, [storageKey, value, ready]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    setValue(initialRef.current);
    setRestored(false);
  }, [storageKey]);

  return [value, setValue, { clearDraft, restored }];
}
