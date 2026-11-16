"use client";

import { useEffect } from "react";

// Saat landing dibuka tanpa hash (#kontak, dll.), mulai dari paling atas
// alih-alih posisi scroll terakhir yang dipulihkan browser.
export default function ScrollTopOnLoad() {
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return null;
}
