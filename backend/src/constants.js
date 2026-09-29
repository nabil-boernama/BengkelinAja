const ROLES = Object.freeze({
  ADMIN: "Admin",
  MEKANIK: "Mekanik",
  OWNER: "Owner",
});

const ORDER_STATUS = Object.freeze({
  ANTRE: "Antre",
  DIPERIKSA: "Diperiksa",
  DIKERJAKAN: "Dikerjakan",
  SELESAI: "Selesai",
  DIAMBIL: "Diambil",
});

module.exports = { ROLES, ORDER_STATUS };
