import { STATUS_LEVEL } from "@/lib/constants";

export default function StatusMarker({ status, big = false, showBars = true }) {
  const level = STATUS_LEVEL[status] ?? 0;
  const cls = ["mk", status === "Dibatalkan" ? "cx" : "", big ? "big" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls}>
      {showBars && (
        <span className="bars">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className={i < level ? "f" : ""} />
          ))}
        </span>
      )}
      {status.toUpperCase()}
    </span>
  );
}