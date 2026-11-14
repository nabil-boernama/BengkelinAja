import PageBackground from "@/components/layout/PageBackground";
import StatusMarker from "@/components/ui/StatusMarker";
import StatusStepper from "@/components/ui/StatusStepper";

export default function Home() {
  return (
    <>
      <PageBackground />
      <main style={{ position: "relative", zIndex: 2, padding: "120px 24px" }}>
        <div className="pn" style={{ maxWidth: 520 }}>
          <StatusMarker status="Dikerjakan" big showBars={false} />
          <StatusStepper status="Dikerjakan" />
          <div className="kv" style={{ marginTop: 20 }}>
            <div className="l">Tanggal masuk</div>
            <div>12 Nov 2026, 09.15 WIB</div>
            <div className="l">Mekanik</div>
            <div>Rudi Hartono</div>
          </div>
        </div>
      </main>
    </>
  );
}