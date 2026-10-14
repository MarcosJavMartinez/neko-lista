"use strict";

// Prueba de seguridad de las listas de los usuarios.
//
// Las listas viven solo en el navegador de cada persona: si una
// actualización borra o cambia algo, no hay forma de recuperarlo. Esta
// prueba abre la app con listas guardadas de muchas formas distintas
// (tests/casos.js) y verifica que:
//   1. la app las lea, las guarde y las vuelva a abrir EXACTAMENTE igual que
//      la versión de referencia (tests/esperado.json);
//   2. se cumplan reglas fijas que nunca pueden romperse (clave de guardado,
//      versión del catálogo, listas válidas intactas, ajustes intactos).
//
// Uso:
//   node tests/listas-seguras.test.js              -> prueba (falla si algo cambió)
//   node tests/listas-seguras.test.js --actualizar -> regraba la referencia
//
// Regrabar la referencia es aceptar que las listas de la gente cambien:
// solo con la versión publicada, o con un cambio revisado y aprobado.

const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { chromium } = require("playwright");
const CASOS = require("./casos.js");

const RAIZ = path.resolve(__dirname, "..");
const ESPERADO = path.join(__dirname, "esperado.json");
const ACTUALIZAR = process.argv.includes("--actualizar");
const CLAVE_LISTA = "listaCompras.productos";
const AJUSTES_QUE_NO_SE_TOCAN = [
  "listaCompras.lang",
  "listaCompras.theme",
  "listaCompras.palette",
  "listaCompras.soundEnabled",
  "listaCompras.vibrationEnabled",
  "listaCompras.onboardingSeen",
];

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

function servir() {
  const vercel = JSON.parse(fs.readFileSync(path.join(RAIZ, "vercel.json"), "utf8"));
  const cabeceras = vercel.headers[0].headers;
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    const archivo = path.join(RAIZ, p);
    if (!archivo.startsWith(RAIZ) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    const h = { "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream", "Cache-Control": "no-store" };
    cabeceras.forEach((c) => (h[c.key] = c.value));
    res.writeHead(200, h);
    fs.createReadStream(archivo).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// Los ids que la app inventa (productos sin id, o repetidos) son al azar:
// se reemplazan por una marca fija para poder comparar.
function normalizar(storage, idsDeEntrada) {
  const out = {};
  for (const clave of Object.keys(storage).sort()) {
    let valor = storage[clave];
    if (clave === CLAVE_LISTA) {
      try {
        valor = JSON.parse(valor);
        if (Array.isArray(valor)) {
          valor = valor.map((p) => (p && !idsDeEntrada.has(p.id) ? { ...p, id: "<id-generado>" } : p));
        }
      } catch {
        valor = { noEsJson: valor };
      }
    }
    out[clave] = valor;
  }
  return out;
}

async function leerStorage(page) {
  return page.evaluate(() => {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      o[k] = localStorage.getItem(k);
    }
    return o;
  });
}

async function correrCaso(browser, base, caso) {
  const context = await browser.newContext({ serviceWorkers: "block", locale: "es-AR" });
  const page = await context.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.route("**/*", (route) =>
    route.request().url().startsWith(base) ? route.continue() : route.abort()
  );
  await page.addInitScript((storage) => {
    if (sessionStorage.getItem("__cargado")) return;
    sessionStorage.setItem("__cargado", "1");
    localStorage.clear();
    for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v);
  }, caso.storage);

  const abrir = async () => {
    await page.goto(base, { waitUntil: "load" });
    await page.waitForFunction(() => typeof products !== "undefined" && typeof saveToLocalStorage === "function");
    await page.waitForTimeout(400);
  };

  await abrir();
  const constantes = await page.evaluate(() => ({ STORAGE_KEY, CATALOG_VERSION }));
  const alAbrir = await leerStorage(page);
  // Cualquier acción de la persona (tildar, agregar, editar) guarda la lista
  // entera tal como la tiene la app en memoria: forzamos ese guardado.
  await page.evaluate(() => saveToLocalStorage());
  const despuesDeGuardar = await leerStorage(page);
  await abrir();
  const alReabrir = await leerStorage(page);
  await context.close();

  let idsDeEntrada = new Set();
  try {
    const entrada = JSON.parse(caso.storage[CLAVE_LISTA] || "[]");
    if (Array.isArray(entrada)) idsDeEntrada = new Set(entrada.filter(Boolean).map((p) => p.id));
  } catch {
    /* lista de entrada dañada a propósito */
  }

  return {
    constantes,
    errores,
    alAbrir: normalizar(alAbrir, idsDeEntrada),
    despuesDeGuardar: normalizar(despuesDeGuardar, idsDeEntrada),
    alReabrir: normalizar(alReabrir, idsDeEntrada),
  };
}

function reglasFijas(caso, r) {
  const fallas = [];
  const chequear = (desc, fn) => {
    try {
      fn();
    } catch (e) {
      fallas.push(`${desc}\n${e.message}`);
    }
  };

  chequear("La lista se tiene que seguir guardando en 'listaCompras.productos'", () =>
    assert.strictEqual(r.constantes.STORAGE_KEY, CLAVE_LISTA)
  );
  chequear("CATALOG_VERSION no puede cambiar: subirlo mete productos de ejemplo en la lista de todos", () =>
    assert.strictEqual(r.constantes.CATALOG_VERSION, 3)
  );
  chequear("La app no puede tirar errores al abrir", () => assert.deepStrictEqual(r.errores, []));

  for (const clave of AJUSTES_QUE_NO_SE_TOCAN) {
    if (!(clave in caso.storage)) continue;
    for (const momento of ["alAbrir", "despuesDeGuardar", "alReabrir"]) {
      chequear(`El ajuste ${clave} no puede cambiar (${momento})`, () =>
        assert.strictEqual(r[momento][clave], caso.storage[clave])
      );
    }
  }

  if (caso.identica) {
    const entrada = JSON.parse(caso.storage[CLAVE_LISTA]);
    for (const momento of ["alAbrir", "despuesDeGuardar", "alReabrir"]) {
      chequear(`Una lista válida tiene que quedar idéntica, producto por producto (${momento})`, () =>
        assert.deepStrictEqual(r[momento][CLAVE_LISTA], entrada)
      );
    }
  }

  chequear("Volver a abrir la app no puede cambiar nada de lo guardado", () =>
    assert.deepStrictEqual(r.alReabrir, r.despuesDeGuardar)
  );
  return fallas;
}

(async () => {
  const server = await servir();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const resultados = {};
  let fallas = 0;

  try {
    for (const caso of CASOS) {
      const r = await correrCaso(browser, base, caso);
      resultados[caso.nombre] = r;
      const problemas = reglasFijas(caso, r);
      problemas.forEach((p) => console.error(`✗ [${caso.nombre}] ${p}\n`));
      fallas += problemas.length;
    }

    if (ACTUALIZAR) {
      if (fallas) throw new Error("No se regraba la referencia: hay reglas fijas rotas.");
      fs.writeFileSync(ESPERADO, JSON.stringify(resultados, null, 1) + "\n");
      console.log(`Referencia regrabada con ${CASOS.length} casos.`);
      return;
    }

    const esperado = JSON.parse(fs.readFileSync(ESPERADO, "utf8"));
    for (const caso of CASOS) {
      if (!(caso.nombre in esperado)) {
        console.error(`✗ [${caso.nombre}] caso nuevo sin referencia: corré con --actualizar ANTES de cambiar la app.`);
        fallas++;
        continue;
      }
      try {
        assert.deepStrictEqual(resultados[caso.nombre], esperado[caso.nombre]);
        console.log(`✓ ${caso.nombre}`);
      } catch (e) {
        console.error(`✗ [${caso.nombre}] la app ya no trata esta lista igual que antes:\n${e.message.slice(0, 3000)}\n`);
        fallas++;
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (fallas) {
    console.error(`\n${fallas} problema(s). NO publicar: este cambio puede afectar las listas de los usuarios.`);
    process.exit(1);
  }
  console.log("\nTodas las listas quedan intactas.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
