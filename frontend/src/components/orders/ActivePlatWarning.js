"use client";

import Link from "next/link";
import styles from "./orderNew.module.css";

const WARN_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v5M12 18.5v.1" />
  </svg>
);

/**
 * Peringatan ORD-20: plat masih punya order aktif.
 * Bukan penghalang; Admin tetap boleh membuat order baru.
 */
export default function ActivePlatWarning({ order }) {
  if (!order) return null;

  const no = order.no_antrean != null ? `#${order.no_antrean}` : "aktif";

  return (
    <div className="warn" role="status">
      {WARN_ICON}
      <span>
        Plat ini masih punya order aktif ({no}).{" "}
        <Link href={`/orders/${order._id}`} className={styles.warnLink}>
          Lihat order.
        </Link>
      </span>
    </div>
  );
}
