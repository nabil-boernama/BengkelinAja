"use client";

import { useEffect, useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { searchCustomers } from "@/services/customersService";
import { ApiError } from "@/lib/apiClient";
import styles from "./orderNew.module.css";

/**
 * Mode "Pelanggan lama": kotak cari + kartu hasil.
 * Menunggu 400 ms setelah berhenti mengetik (debounce), lalu minta daftar ke server.
 */
export default function CustomerSearchCards({
  query,
  onQueryChange,
  selectedId,
  onSelect,
}) {
  const debouncedQuery = useDebounce(query, 400);
  const q = debouncedQuery.trim().slice(0, 50);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchedFor, setFetchedFor] = useState("");

  useEffect(() => {
    if (!q) return undefined;

    let cancelled = false;

    /* eslint-disable react-hooks/set-state-in-effect -- mulai permintaan jaringan */
    setLoading(true);
    setError("");
    /* eslint-enable react-hooks/set-state-in-effect */

    searchCustomers(q)
      .then((data) => {
        if (cancelled) return;
        setResults(Array.isArray(data) ? data : []);
        setFetchedFor(q);
      })
      .catch((err) => {
        if (cancelled) return;
        setResults([]);
        setFetchedFor(q);
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal mencari pelanggan. Coba lagi."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q]);

  function handlePick(customer, e) {
    e.preventDefault();
    onSelect(customer);
  }

  const showResults = Boolean(q) && fetchedFor === q;
  const list = showResults ? results : [];

  return (
    <div>
      <label className="fld">
        <span>Cari pelanggan</span>
        <input
          className="in"
          value={query}
          maxLength={50}
          placeholder="Cari nama atau nomor WhatsApp"
          onChange={(e) => onQueryChange(e.target.value.slice(0, 50))}
          autoComplete="off"
        />
      </label>

      {error && showResults ? <div className="err">{error}</div> : null}

      {loading && q ? (
        <div className={`cards ${styles.cards}`} aria-busy="true">
          <div className="sk" style={{ height: 64 }} />
          <div className="sk" style={{ height: 64 }} />
        </div>
      ) : null}

      {!loading && showResults && list.length === 0 && !error ? (
        <p className="muted small" style={{ marginBottom: 20 }}>
          Tidak ada pelanggan yang cocok.
        </p>
      ) : null}

      {!loading && list.length > 0 ? (
        <div className={`cards ${styles.cards}`}>
          {list.map((c) => {
            const selected = selectedId === c._id;
            return (
              <a
                key={c._id}
                href="#"
                className={`cc ${selected ? styles.cardSelected : ""}`}
                style={{ padding: "14px 20px" }}
                onClick={(e) => handlePick(c, e)}
              >
                <b>{c.nama}</b>
                <div className="muted small">{c.no_wa || "Tanpa nomor WhatsApp"}</div>
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
