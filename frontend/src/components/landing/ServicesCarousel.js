"use client";

import { useEffect, useRef } from "react";

// Durasi satu putaran penuh, sama dengan animasi CSS .mtrack.slow sebelumnya.
const LOOP_SECONDS = 90;
// Jeda sebelum auto-scroll jalan lagi setelah selesai digeser.
const RESUME_DELAY_MS = 1200;

// Marquee layanan yang berjalan otomatis dan bisa digeser dengan mouse atau sentuhan.
// Posisi dikendalikan JS (bukan animasi CSS) supaya geseran manual dan auto-scroll
// memakai satu offset yang sama dan tidak meloncat saat dilepas.
export default function ServicesCarousel({ items }) {
  const trackRef = useRef(null);
  const offset = useRef(0);
  const drag = useRef({ active: false, startX: 0, startOffset: 0, pointerId: null });
  const hovering = useRef(false);
  const pausedUntil = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();

    // Isi kartu diulang dua kali; satu periode = lebar satu set + satu gap.
    const period = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return (track.scrollWidth + gap) / 2;
    };

    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const p = period();
      if (p > 0) {
        const idle = !drag.current.active && !hovering.current && now >= pausedUntil.current;
        if (idle && !reduceMotion) offset.current += (p / LOOP_SECONDS) * dt;
        offset.current = ((offset.current % p) + p) % p;
        track.style.transform = `translate3d(${-offset.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { active: true, startX: e.clientX, startOffset: offset.current, pointerId: e.pointerId };
    trackRef.current.setPointerCapture(e.pointerId);
    trackRef.current.classList.add("grabbing");
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    offset.current = d.startOffset - (e.clientX - d.startX);
  }

  function endDrag(e) {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    d.active = false;
    pausedUntil.current = performance.now() + RESUME_DELAY_MS;
    trackRef.current.classList.remove("grabbing");
  }

  return (
    <div
      className="marq marq-drag"
      onPointerEnter={(e) => e.pointerType === "mouse" && (hovering.current = true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && (hovering.current = false)}
    >
      <div
        className="mtrack mtrack-drag"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {[...items, ...items].map(([nama, img], i) => (
          <article key={i} className="sc" aria-hidden={i >= items.length || undefined}>
            <img src={`/img/${img}`} alt={nama} draggable={false} />
            <div className="cap">
              <h3>{nama}</h3>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
