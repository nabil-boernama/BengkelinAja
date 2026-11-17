// Helper untuk field input angka/biaya.
// Tampilan input memakai titik sebagai pemisah ribuan (format Indonesia),
// sedangkan nilai yang dikirim ke API selalu angka murni.
//
// Catatan: formatRupiah di lib/format.js tetap dipakai untuk TAMPILAN ("Rp 150.000");
// formatRupiahInput di sini khusus untuk isi field input (tanpa "Rp").

// Ambil digit saja, buang nol di depan: "0050.000x" -> "50000", "000" -> "0", "" -> ""
export function onlyDigits(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/^0+(?=\d)/, "");
}

// 50000 / "50000" / "50.000" -> "50.000"; kosong -> ""
export function formatRupiahInput(value) {
  const digits = onlyDigits(value);
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// "1.500.000" -> 1500000; kosong/tidak valid -> 0
export function parseRupiah(value) {
  const digits = onlyDigits(value);
  return digits === "" ? 0 : Number(digits);
}
