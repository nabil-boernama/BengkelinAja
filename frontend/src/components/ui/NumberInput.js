"use client";

import { useLayoutEffect, useRef } from "react";
import { formatRupiahInput } from "@/lib/currency";

// Input angka dengan pemisah ribuan otomatis (50000 -> 50.000).
// - value/onChange memakai string berformat ("50.000"); ubah ke angka dengan parseRupiah saat submit.
// - Saat fokus dan nilainya sama dengan emptyValue ("0"), field dikosongkan agar ketikan
//   tidak menjadi "050000". Saat blur dan kosong, dikembalikan ke emptyValue.
export default function NumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  emptyValue = "0",
  ...props
}) {
  const ref = useRef(null);
  // Jumlah digit di kiri kursor, dipakai untuk mengembalikan posisi kursor setelah diformat.
  const caretDigits = useRef(null);
  const display = formatRupiahInput(value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (caretDigits.current === null || !el || document.activeElement !== el) return;
    let seen = 0;
    let pos = 0;
    while (pos < display.length && seen < caretDigits.current) {
      if (/\d/.test(display[pos])) seen += 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
    caretDigits.current = null;
  }, [display]);

  function handleChange(e) {
    const { value: raw, selectionStart } = e.target;
    const before = raw.slice(0, selectionStart ?? raw.length);
    const digitsBefore = before.replace(/\D/g, "").replace(/^0+/, "").length;
    caretDigits.current = digitsBefore;
    onChange(formatRupiahInput(raw));
  }

  function handleFocus(e) {
    if (display === formatRupiahInput(emptyValue)) onChange("");
    onFocus?.(e);
  }

  function handleBlur(e) {
    if (display === "") onChange(formatRupiahInput(emptyValue));
    onBlur?.(e);
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      {...props}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
