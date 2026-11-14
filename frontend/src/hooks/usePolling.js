"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Panggil `fetcher` sekarang, lalu ulangi setiap `intervalMs` ms.
 *
 * - Jadwal berikutnya baru dibuat setelah request selesai, jadi request tidak menumpuk.
 * - Berhenti sementara saat tab tidak terlihat, dan langsung fetch ulang saat tab aktif lagi.
 * - `fetcher` sebaiknya dibungkus useCallback; polling dimulai ulang bila identitasnya berubah.
 *
 * const { data, error, loading, refresh } = usePolling(
 *   useCallback(() => listOrders({ status }), [status]),
 *   10000
 * );
 */
export default function usePolling(fetcher, intervalMs, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef(() => {});

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let timer = null;
    let inFlight = false;

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(tick, intervalMs);
    };

    async function tick() {
      if (cancelled || inFlight) return;
      if (typeof document !== "undefined" && document.hidden) return; // lanjut saat tab aktif
      inFlight = true;
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        inFlight = false;
        if (!cancelled) {
          setLoading(false);
          schedule();
        }
      }
    }

    const onVisibility = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        tick();
      }
    };

    refreshRef.current = () => {
      clearTimeout(timer);
      tick();
    };

    tick();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      refreshRef.current = () => {};
    };
  }, [fetcher, intervalMs, enabled]);

  // fetch ulang segera, mis. setelah mengubah status order
  const refresh = useCallback(() => refreshRef.current(), []);

  return { data, error, loading, refresh };
}
