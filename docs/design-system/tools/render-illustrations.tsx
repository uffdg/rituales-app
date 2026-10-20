// Exporta a SVG estáticos las ilustraciones que viven como componentes React,
// para la galería de assets. Lo corre build-galeria.py; no se usa en la app.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { ArcanaArt, ArcanaBack, ARCANA_IDS } from "../../../src/app/components/arcana/ArcanaArt";
import { MoonPhaseIcon } from "../../../src/app/components/MoonPhaseIcon";

const outDir = process.argv[2];
mkdirSync(outDir, { recursive: true });

function save(name: string, element: React.ReactElement) {
  const markup = renderToStaticMarkup(element).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  writeFileSync(join(outDir, `${name}.svg`), markup);
}

save("arcano-dorso", <ArcanaBack width={200} />);
for (const id of ARCANA_IDS) save(`arcano-${id}`, <ArcanaArt id={id} width={200} />);

const PHASES = [
  "Luna nueva",
  "Creciente",
  "Cuarto creciente",
  "Gibosa creciente",
  "Luna llena",
  "Gibosa menguante",
  "Cuarto menguante",
  "Menguante",
];
for (const phase of PHASES) {
  const slug = phase.toLowerCase().replace(/\s+/g, "-");
  save(`luna-${slug}`, <MoonPhaseIcon phase={phase} size={64} />);
  save(`luna-${slug}-oscuro`, <MoonPhaseIcon phase={phase} size={64} darkTheme />);
}

console.log(JSON.stringify({ arcana: ARCANA_IDS, phases: PHASES }));
