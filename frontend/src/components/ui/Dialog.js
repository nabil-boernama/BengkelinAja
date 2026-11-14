"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Modal konfirmasi. Memakai kelas .dlg.on dari app.css.
 *
 * <Dialog
 *   open={confirmOpen}
 *   title="Batalkan order?"
 *   message="Order yang dibatalkan tidak bisa diproses lagi."
 *   confirmLabel="Ya, batalkan"
 *   danger
 *   loading={saving}
 *   onConfirm={handleCancel}
 *   onCancel={() => setConfirmOpen(false)}
 * />
 *
 * Esc atau klik di luar kotak = onCancel. `children` (opsional) tampil di bawah pesan,
 * mis. textarea alasan pembatalan.
 */
export default function Dialog({
  open = true,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  danger = false,
  loading = false,
  children,
}) {
  const titleId = useId();
  const msgId = useId();
  const cancelRef = useRef(null);
  const boxRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const loadingRef = useRef(loading);

  useEffect(() => {
    onCancelRef.current = onCancel;
    loadingRef.current = loading;
  });

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // fokus awal ke "Batal": aman untuk aksi yang merusak
    cancelRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape" && !loadingRef.current) {
        e.preventDefault();
        onCancelRef.current?.();
      }
      // jaga fokus tetap di dalam dialog
      if (e.key === "Tab" && boxRef.current) {
        const focusable = boxRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="dlg on"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel?.();
      }}
    >
      <div
        ref={boxRef}
        className="box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? msgId : undefined}
      >
        <h3 id={titleId}>{title}</h3>
        {message && <p id={msgId}>{message}</p>}
        {children}
        <div className="row end">
          <button ref={cancelRef} type="button" className="b b-g sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`b sm ${danger ? "b-d" : "b-p"}`}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
