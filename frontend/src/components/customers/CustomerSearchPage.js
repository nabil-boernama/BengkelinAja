"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import StatusMarker from "@/components/ui/StatusMarker";
import { searchCustomers } from "@/services/customersService";
import { listOrders } from "@/services/ordersService";
import useDebounce from "@/hooks/useDebounce";

// Menyamarkan nomor WhatsApp untuk Mekanik: "081234567890" -> "0812 **** 7890"
function maskWa(no_wa) {
  if (!no_wa) return null;
  const digits = no_wa.replace(/\D/g, "");
  if (digits.length < 5) return no_wa;
  return digits.slice(0, 4) + " **** " + digits.slice(-4);
}

// ---- Tab Pelanggan ----
function CustomerList({ q }) {
  const { role } = useAuth();
  const [result, setResult] = useState(null); // null = belum pernah cari
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchCustomers(q)
      .then((data) => {
        if (!cancelled) setResult(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Gagal memuat data pelanggan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [q]);

  if (!q) {
    return <p className="muted">Ketik minimal 1 karakter.</p>;
  }
  if (loading) {
    return (
      <div className="cards" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc" aria-hidden="true">
            <div className="row sp">
              <div>
                <div className="sk" style={{ height: 18, width: 160, marginBottom: 8 }} />
                <div className="sk" style={{ height: 14, width: 110 }} />
              </div>
              <div className="sk" style={{ height: 14, width: 50 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="ermsg on" role="alert">{error}</p>;
  }
  if (result !== null && result.length === 0) {
    return <p className="muted">Pelanggan tidak ditemukan.</p>;
  }
  if (!result) return null;

  return (
    <div className="cards">
      {result.map((c) => {
        const wa =
          role === "mekanik"
            ? maskWa(c.no_wa)
            : c.no_wa;
        return (
          <Link key={c._id} className="cc" href={`/customers/${encodeURIComponent(c._id)}`}>
            <div className="row sp">
              <div>
                <b style={{ fontSize: 18 }}>{c.nama}</b>
                {wa && <div className="muted">{wa}</div>}
              </div>
              {typeof c.jumlah_order === "number" && (
                <span className="muted" style={{ fontWeight: 700 }}>
                  {c.jumlah_order} order
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---- Tab Plat ----
function PlatList({ q }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listOrders({ plat: q })
      .then((data) => {
        if (!cancelled) setResult(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Gagal memuat data order.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [q]);

  if (!q) {
    return <p className="muted">Ketik minimal 1 karakter.</p>;
  }
  if (loading) {
    return (
      <div className="cards" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc" aria-hidden="true">
            <div className="row sp">
              <div>
                <div className="sk" style={{ height: 18, width: 120, marginBottom: 8 }} />
                <div className="sk" style={{ height: 14, width: 180 }} />
              </div>
              <div className="sk" style={{ height: 20, width: 80 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="ermsg on" role="alert">{error}</p>;
  }
  if (result !== null && result.length === 0) {
    return <p className="muted">Plat nomor tidak ditemukan.</p>;
  }
  if (!result) return null;

  return (
    <div className="cards">
      {result.map((o) => (
        <Link key={o._id} className="cc" href={`/orders/${encodeURIComponent(o._id)}`}>
          <div className="row sp">
            <div>
              <b style={{ fontSize: 18 }}>{o.plat}</b>
              <div className="muted">
                #{o.no_antrean} | {o.customer?.nama || "-"} | {o.mekanik?.nama || "-"}
              </div>
            </div>
            {o.status && <StatusMarker status={o.status} />}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ---- Halaman utama ----
export default function CustomerSearchPage() {
  const [tab, setTab] = useState("c"); // "c" = pelanggan, "p" = plat
  const [input, setInput] = useState("");
  const q = useDebounce(input.trim(), 400);

  const switchTab = useCallback((newTab) => {
    setTab(newTab);
    setInput("");
  }, []);

  return (
    <>
      <div className="top">
        <h1 className="pt">Riwayat</h1>
      </div>

      {/* Tab pilih mode pencarian */}
      <div className="seg" role="group" aria-label="Mode pencarian" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={tab === "c" ? "on" : undefined}
          aria-pressed={tab === "c"}
          onClick={() => switchTab("c")}
        >
          Cari Pelanggan
        </button>
        <button
          type="button"
          className={tab === "p" ? "on" : undefined}
          aria-pressed={tab === "p"}
          onClick={() => switchTab("p")}
        >
          Cari Plat Nomor
        </button>
      </div>

      {/* Input pencarian */}
      <div style={{ maxWidth: 560, marginBottom: 20 }}>
        <input
          className="in"
          type="search"
          placeholder={tab === "c" ? "Cari nama atau nomor WhatsApp" : "Cari plat nomor"}
          aria-label={tab === "c" ? "Cari nama atau nomor WhatsApp" : "Cari plat nomor"}
          autoCapitalize={tab === "p" ? "characters" : "words"}
          autoCorrect="off"
          spellCheck={false}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {/* Hasil pencarian */}
      {tab === "c" ? <CustomerList q={q} /> : <PlatList q={q} />}
    </>
  );
}
