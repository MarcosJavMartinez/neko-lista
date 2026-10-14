"use strict";

// Listas guardadas tal como las tiene la gente en su navegador. Cada caso es
// el contenido de localStorage antes de abrir la app. La prueba carga la app
// con eso y verifica que la lista salga igual que con la versión de
// referencia (tests/esperado.json).
//
// Si agregás un caso, corré `node tests/listas-seguras.test.js --actualizar`
// UNA vez con la versión publicada (antes de tu cambio) para registrar cómo
// la trata hoy, y recién después hacé el cambio.

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const AJUSTES = {
  "listaCompras.lang": "es",
  "listaCompras.theme": "dark",
  "listaCompras.palette": "oceano",
  "listaCompras.soundEnabled": "true",
  "listaCompras.vibrationEnabled": "false",
  "listaCompras.onboardingSeen": "true",
};

function lista(productos, extra = {}) {
  return {
    "listaCompras.productos": JSON.stringify(productos),
    "listaCompras.catalogVersion": "3",
    ...AJUSTES,
    ...extra,
  };
}

const listaActual = [
  { id: "1760000000001-aaaaaaa", name: "Leche Tregar 1 L", quantity: 2, price: 2150, purchased: false, category: "Almacén", priority: true, icon: "🥛", key: "milk_tregar" },
  { id: "1760000000002-bbbbbbb", name: "Manteca 200 g", quantity: 1, price: 3484.15, purchased: true, category: "Almacén", priority: false, icon: "🧈" },
  { id: "1760000000003-ccccccc", name: "Tomate perita", quantity: 3, price: 0, purchased: false, category: "Verdulería", priority: false, icon: "🍅" },
  { id: "1760000000004-ddddddd", name: "Asado de tira", quantity: 1, price: 18999.99, purchased: false, category: "Carnicería", priority: true, icon: "🥩" },
  { id: "1760000000005-eeeeeee", name: "Pan francés", quantity: 1, price: 2500, purchased: true, category: "Panadería", priority: false, icon: "🥖" },
  { id: "1760000000006-fffffff", name: "Lavandina Ayudín", quantity: 1, price: 1850, purchased: false, category: "Limpieza", priority: false, icon: "🧴" },
  { id: "1760000000007-ggggggg", name: "Ibuprofeno 400", quantity: 1, price: 5200, purchased: false, category: "Farmacia y Perfumería", priority: false, icon: "💊" },
  { id: "1760000000008-hhhhhhh", name: "Regalo cumple de la abuela 🎁", quantity: 1, price: 25000, purchased: false, category: "Otros", priority: true, icon: "🎁" },
  { id: "1760000000009-iiiiiii", name: "Ñoquis caseros \"del 29\"", quantity: 9999, price: 1e9, purchased: false, category: "Almacén", priority: false, icon: "🥟" },
  { id: "1760000000010-jjjjjjj", name: "Foto propia", quantity: 1, price: 100, purchased: false, category: "Otros", priority: false, icon: PNG_1PX },
  { id: "1760000000011-kkkkkkk", name: "卵パック", quantity: 1, price: 6500, purchased: false, category: "Almacén", priority: false, icon: "🥚", key: "eggs_carton" },
  { id: "1760000000012-lllllll", name: "Молоко", quantity: 1, price: 1, purchased: true, category: "Almacén", priority: false, icon: "🥛" },
];

// Como guardaban las versiones viejas: sin key, sin ícono, sin categoría,
// sin prioridad.
const listaVieja = [
  { id: "1700000000001-old0001", name: "Yerba", quantity: 1, price: 4200, purchased: false },
  { id: "1700000000002-old0002", name: "Azúcar 1 kg", quantity: 2, price: 2200, purchased: true },
  { id: "1700000000003-old0003", name: "Café La Virginia 100 g", quantity: 1, price: 0, purchased: false },
  { id: "1700000000004-old0004", name: "fideos", quantity: 1, price: 1500, purchased: false, category: "Almacén" },
];

const valoresRaros = [
  { id: "r1", name: "  Espacios alrededor  ", quantity: "3", price: "1500", purchased: "true", category: "Almacén", priority: "true", icon: "🧂" },
  { id: "r2", name: "Precio negativo", quantity: -4, price: -50, purchased: false, category: "Categoría que no existe", icon: "" },
  { id: "r3", name: "Cantidad decimal", quantity: 2.6, price: 10.555, purchased: false, icon: "🧪🧪🧪🧪🧪🧪🧪🧪🧪" },
  { id: "r1", name: "Id repetido", quantity: 1, price: 1, purchased: false, icon: "🔁" },
  { id: "r5", name: "", quantity: 1, price: 1 },
  { id: "r6", quantity: 1, price: 1 },
  null,
  "texto suelto",
  { id: "r9", name: "x".repeat(250), quantity: 1, price: 1, icon: "data:text/html;base64,PHA+aG9sYTwvcD4=" },
];

const grande = Array.from({ length: 2100 }, (_, i) => ({
  id: `big-${i}`,
  name: `Producto ${i}`,
  quantity: (i % 5) + 1,
  price: i * 10.5,
  purchased: i % 3 === 0,
  category: "Almacén",
  priority: i % 7 === 0,
  icon: "🛒",
}));

module.exports = [
  { nombre: "lista actual completa", storage: lista(listaActual), identica: true },
  { nombre: "lista guardada por versiones viejas", storage: lista(listaVieja) },
  { nombre: "valores raros", storage: lista(valoresRaros) },
  { nombre: "lista vacía (la persona borró todo)", storage: lista([]), identica: true },
  { nombre: "lista de 2100 productos", storage: lista(grande) },
  { nombre: "lista guardada que no se puede leer", storage: { ...lista([]), "listaCompras.productos": "[{\"id\":\"x\",\"name\":\"Leche\"" } },
  { nombre: "catálogo viejo (versión 2)", storage: lista(listaVieja, { "listaCompras.catalogVersion": "2" }) },
  { nombre: "primera vez que se abre la app", storage: {} },
];
