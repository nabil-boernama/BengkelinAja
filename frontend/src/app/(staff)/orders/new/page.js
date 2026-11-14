"use client";

import { useState } from "react";
import Link from "next/link";
import StaffLayout from "@/components/layout/StaffLayout";
import { useAuth } from "@/context/AuthContext";
import OrderNewForm from "@/components/orders/OrderNewForm";
import OrderNewSuccess from "@/components/orders/OrderNewSuccess";
import styles from "@/components/orders/orderNew.module.css";

/**
 * Halaman Order Baru (/orders/new).
 * Hanya Admin yang boleh membuat order (cek di isi halaman).
 * Kerangka sidebar + AuthGuard dari (staff)/layout + StaffLayout.
 */
function OrderNewContent() {
  const { role, loading } = useAuth();
  const [created, setCreated] = useState(null);
  const [formKey, setFormKey] = useState(0);

  if (loading) {
    return (
      <div className={styles.loadingBox}>
        <p className="muted" role="status">
          Memuat…
        </p>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className={`pn ${styles.noAccess}`}>
        <h1 className={styles.noAccessTitle}>Anda tidak punya akses</h1>
        <p className={`muted ${styles.noAccessBody}`}>
          Hanya Admin yang dapat membuat order baru.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/orders" className="b b-g sm">
            Kembali ke daftar order
          </Link>
        </div>
      </div>
    );
  }

  function handleSuccess(order, meta) {
    let linkedNote = "";
    if (
      meta?.mode === "baru" &&
      meta?.typedNama &&
      order?.customer?.nama &&
      order.customer.nama !== meta.typedNama
    ) {
      linkedNote = `Order dikaitkan ke pelanggan yang sudah ada: ${order.customer.nama}`;
    } else if (meta?.mode === "lama") {
      linkedNote = "Order dikaitkan ke pelanggan yang sudah ada";
    }
    setCreated({ order, linkedNote });
  }

  function handleCreateAnother() {
    setCreated(null);
    setFormKey((k) => k + 1);
  }

  return (
    <>
      <div className="top">
        <h1 className="pt">Order Baru</h1>
      </div>

      {created ? (
        <OrderNewSuccess
          order={created.order}
          linkedNote={created.linkedNote}
          onCreateAnother={handleCreateAnother}
        />
      ) : (
        <OrderNewForm key={formKey} onSuccess={handleSuccess} />
      )}
    </>
  );
}

export default function OrderNewPage() {
  return (
    <StaffLayout>
      <OrderNewContent />
    </StaffLayout>
  );
}
