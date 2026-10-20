// Capturas de las pantallas públicas de la app (sin login), para el antes y
// después de la migración al design system (06-migracion.html).
// Uso, con la app corriendo en localhost:5173:
//   node docs/design-system/tools/capture-screens.cjs <carpeta-destino>
const path = require("path");
const { chromium } = require(path.resolve(__dirname, "../../../node_modules/playwright-core"));

const SCREENS = [
  ["home", "/"],
  ["explorar", "/explorar"],
  ["calendario", "/calendario-cosmico"],
  ["wiki", "/wiki"],
  ["login", "/login"],
];

(async () => {
  const outDir = process.argv[2];
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  // Fondo de Home y demás elecciones al azar: siempre las mismas.
  await context.addInitScript(() => { Math.random = () => 0.42; });
  const page = await context.newPage();
  for (const [name, route] of SCREENS) {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, `${name}.jpg`), type: "jpeg", quality: 70, fullPage: true });
    console.log("ok", name);
  }
  await browser.close();
})();
