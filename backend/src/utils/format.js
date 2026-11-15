// Plat nomor Indonesia untuk tampilan: "AB1234CD" -> "AB 1234 CD", "B168UJ" -> "B 168 UJ".
// Sama dengan formatPlat di frontend (src/lib/format.js). Bila tidak cocok pola, dikembalikan apa adanya.
function formatPlat(plat) {
  if (plat === null || plat === undefined || plat === '') return '-';
  const raw = String(plat);
  const m = raw
    .replace(/\s+/g, '')
    .toUpperCase()
    .match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/);
  return m ? [m[1], m[2], m[3]].filter(Boolean).join(' ') : raw;
}

// 150000 -> "Rp150.000"
function formatRupiah(n) {
  return `Rp${(Number(n) || 0).toLocaleString('id-ID')}`;
}

module.exports = { formatPlat, formatRupiah };
