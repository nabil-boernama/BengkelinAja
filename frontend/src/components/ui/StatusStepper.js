const STEPS = ["Antre", "Diperiksa", "Dikerjakan", "Selesai", "Diambil"];

export default function StatusStepper({ status }) {
  const idx = STEPS.indexOf(status);
  const allDone = status === "Diambil";

  return (
    <div className="stp">
      {STEPS.map((step, i) => {
        const state = i < idx || allDone ? "d" : i === idx ? "n" : "";
        return (
          <div key={step} className={state}>
            <b>
              {state === "d" && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
              {state === "n" && (
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              )}
            </b>
            {step}
          </div>
        );
      })}
    </div>
  );
}