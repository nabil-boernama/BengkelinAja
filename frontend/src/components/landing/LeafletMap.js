"use client";

import { useEffect, useRef, useState } from "react";

const LOCATION = [-7.766, 110.374];

export default function LeafletMap() {
  const mapElement = useRef(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map;

    import("leaflet")
      .then(({ default: L }) => {
        if (cancelled || !mapElement.current) return;

        map = L.map(mapElement.current, { scrollWheelZoom: false }).setView(LOCATION, 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        L.circleMarker(LOCATION, {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: "#e11d48",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup("Fakultas Teknik UGM");
      })
      .catch((error) => {
        console.error("Gagal memuat peta lokasi:", error);
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <>
      <div
        className="leaflet-map"
        ref={mapElement}
        role="region"
        aria-label="Peta Fakultas Teknik UGM"
      />
      {mapError && (
        <p className="map-error" role="status">
          Peta tidak dapat dimuat. Buka tautan Google Maps untuk melihat lokasi.
        </p>
      )}
    </>
  );
}
