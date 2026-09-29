const TZ = "Asia/Jakarta";

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
}

module.exports = { TZ, dateKey };
