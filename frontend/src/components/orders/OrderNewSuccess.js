"use client";

import Link from "next/link";
import styles from "./orderNew.module.css";

/**
 * Layar setelah order berhasil dibuat: nomor antrean besar + petunjuk ke pelanggan.
 */
export default function OrderNewSuccess({ order, linkedNote, onCreateAnother }) {
  const no = order?.no_antrean;
  const plat = order?.plat || "";
  const customerNama = order?.customer?.nama || "";
  const mekanikNama = order?.mekanik?.nama || "";

  const ringkas = [customerNama, mekanikNama].filter(Boolean).join(" | ");

  return (
    <div className={`pn ${styles.wrap} ${styles.success}`}>
      <div className={`muted ${styles.antreanLabel}`}>NOMOR ANTREAN</div>
      <div className="big404" style={{ color: "#fff" }}>
        {no != null ? `#${no}` : "#"}
      </div>
      <h2 className={styles.successPlat}>{plat}</h2>
      <p className="muted">
        {ringkas}
        {linkedNote ? `. ${linkedNote}` : ""}
      </p>
      <p className={styles.successHint}>
        Sampaikan nomor antrean dan plat nomor ini kepada pelanggan untuk cek
        status di halaman utama.
      </p>
      <div className={`row ${styles.actions}`}>
        <Link href={`/orders/${order._id}`} className="b b-r">
          Lihat Detail
        </Link>
        <button type="button" className="b b-g" onClick={onCreateAnother}>
          Buat Order Lain
        </button>
      </div>
    </div>
  );
}
