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
    // La captura completa agranda la ventana al alto de la página; lo que mide
    // "100% de la pantalla" (el fondo de Home) se fija al alto de un teléfono.
    await page.addStyleTag({ content: ".h-\\[100svh\\] { height: 844px !important; } .min-h-screen { min-height: 844px !important; }" });
    // Las fotos con carga diferida no cargan sin scrollear: se fuerzan.
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = "eager"; }));
    await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 15000 }).catch(() => {});
    // Con decoding="async", Chrome no pinta en la captura las fotos fuera de pantalla.
    await page.evaluate(() => Promise.all([...document.images].map((img) => { img.decoding = "sync"; return img.decode().catch(() => {}); })));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, `${name}.jpg`), type: "jpeg", quality: 70, fullPage: true });
    console.log("ok", name);
  }
  await browser.close();
})();
