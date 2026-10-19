import { useState } from "react";
import { ArcanaArt, ArcanaBack, ARCANA_IDS } from "../../components/arcana/ArcanaArt";

// Solo en desarrollo (/dev/arcanos): los 22 arcanos juntos para revisar los
// dibujos. "Repetir animación" vuelve a montar las ilustraciones.
export function ArcanaGallery() {
  const [run, setRun] = useState(0);

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "#0b0a09", color: "#f3ede2" }}>
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[32px]" style={{ fontWeight: 400 }}>Arcanos mayores</h1>
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="rounded-full px-4 py-2 font-sans text-[13px] font-light"
            style={{ border: "1px solid rgba(201,166,107,0.6)", color: "#c9a66b" }}
          >
            Repetir animación
          </button>
        </div>
        <div className="grid gap-x-6 gap-y-10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          <figure className="flex flex-col items-center gap-3">
            <ArcanaBack width={150} />
            <figcaption className="font-sans text-[12px] font-light opacity-70">Dorso</figcaption>
          </figure>
          {ARCANA_IDS.map((id) => (
            <figure key={`${id}-${run}`} className="flex flex-col items-center gap-3">
              <ArcanaArt id={id} animate width={150} />
              <figcaption className="font-sans text-[12px] font-light opacity-70">{id}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
