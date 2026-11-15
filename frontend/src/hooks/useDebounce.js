"use client";

import { useEffect, useState } from "react";

// Nilai yang baru ikut berubah setelah `value` diam selama `delay` ms.
// Contoh: const q = useDebounce(search, 300); lalu fetch saat q berubah.
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
