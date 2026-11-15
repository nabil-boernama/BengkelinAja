// Semua tanggal ditampilkan dalam WIB (Asia/Jakarta), apa pun zona waktu perangkat.
const TZ = "Asia/Jakarta";
const EMPTY = "-";

const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const tanggalFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toDate(iso) {
  if (iso === null || iso === undefined || iso === "") return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parts(d) {
  const p = {};
  for (const { type, value } of tanggalFmt.formatToParts(d)) p[type] = value;
  return p;
}

// 150000 -> "Rp 150.000" (spasi biasa, tanpa desimal)
export function formatRupiah(angka) {
  const n = Number(angka);
  if (angka === null || angka === undefined || angka === "" || Number.isNaN(n)) return EMPTY;
  return rupiahFmt.format(n).replace(/ /g, " ");
}

// "2026-11-12T02:15:00Z" -> "12 Nov 2026, 09.15 WIB"
export function formatTanggal(iso) {
  const d = toDate(iso);
  if (!d) return EMPTY;
  const p = parts(d);
  return `${p.day} ${p.month} ${p.year}, ${p.hour}.${p.minute} WIB`;
}

// "2026-11-12T02:15:00Z" -> "12 Nov 2026"
export function formatTanggalPendek(iso) {
  const d = toDate(iso);
  if (!d) return EMPTY;
  const p = parts(d);
  return `${p.day} ${p.month} ${p.year}`;
}
