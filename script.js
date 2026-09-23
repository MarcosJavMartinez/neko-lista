"use strict";

/* ==========================================================================
   Marca
   ========================================================================== */

// Datos de identidad de marca, centralizados para no repetir strings sueltos.
const BRAND = {
  companyName: "Neko Tools",
  appName: "Neko Lista",
  tagline: "Tu lista. Tu presupuesto. Sin complicaciones.",
  donationUrl: "https://ko-fi.com/nekotools",
  websiteUrl: "https://nekotools.site",
  // A donde manda "Compartir": la sección de Neko Lista en la página de
  // Neko Tools, no un link directo a la app. Así quien recibe el link
  // conoce la marca y el resto de las herramientas antes de entrar.
  shareUrl: "https://nekotools.site/#producto",
};

/* ==========================================================================
   Constantes y estado
   ========================================================================== */

const STORAGE_KEY = "listaCompras.productos";
const THEME_KEY = "listaCompras.theme";
const BG_COLOR_KEY = "listaCompras.bgColor";
const PALETTE_KEY = "listaCompras.palette";
const CUSTOM_COLOR_KEY = "listaCompras.customColor";
const SOUND_ENABLED_KEY = "listaCompras.soundEnabled";
const VIBRATION_ENABLED_KEY = "listaCompras.vibrationEnabled";
const ONBOARDING_SEEN_KEY = "listaCompras.onboardingSeen";
const SOUND_CHECK_CUSTOM_KEY = "listaCompras.soundCheckCustom";
const SOUND_UNCHECK_CUSTOM_KEY = "listaCompras.soundUncheckCustom";
const SOUND_PRESET_KEY = "listaCompras.soundPreset";

const SVG_ICON_SUN =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
const SVG_ICON_MOON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
const BG_IMAGE_CHOICE_KEY = "listaCompras.bgImageChoice";
const BG_IMAGE_CUSTOM_KEY = "listaCompras.bgImageCustom";
const DEFAULT_BG_LIGHT = "#f5f3ee";
const DEFAULT_BG_DARK = "#10140e";
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

// Seis plantillas de color bien diferenciadas. Cada una define el acento
// (primario) para modo día y modo noche; el resto de la paleta (fondos,
// tarjetas, bordes) no cambia, solo el color de marca en toda la app.
const COLOR_PALETTES = [
  {
    id: "verde",
    swatch: "#2f9e44",
    light: { primary: "#2f9e44", primaryDark: "#1f7a34", primarySoft: "#e8f4ea" },
    dark: { primary: "#52c374", primaryDark: "#3a9c58", primarySoft: "#1e2b20" },
  },
  {
    id: "oceano",
    swatch: "#1c7ed6",
    light: { primary: "#1c7ed6", primaryDark: "#145a9e", primarySoft: "#e3f1fc" },
    dark: { primary: "#4dabf7", primaryDark: "#2f8fd6", primarySoft: "#132534" },
  },
  {
    id: "atardecer",
    swatch: "#e8590c",
    light: { primary: "#e8590c", primaryDark: "#b7440a", primarySoft: "#fdebe0" },
    dark: { primary: "#ff922b", primaryDark: "#e8720f", primarySoft: "#3a2415" },
  },
  {
    id: "uva",
    swatch: "#7048c2",
    light: { primary: "#7048c2", primaryDark: "#56349c", primarySoft: "#f0e9fb" },
    dark: { primary: "#a389f0", primaryDark: "#8264d6", primarySoft: "#251c3a" },
  },
  {
    id: "frambuesa",
    swatch: "#e64980",
    light: { primary: "#e64980", primaryDark: "#b93867", primarySoft: "#fde3ee" },
    dark: { primary: "#f783ac", primaryDark: "#e0628e", primarySoft: "#3a1f28" },
  },
  {
    id: "grafito",
    swatch: "#495057",
    light: { primary: "#495057", primaryDark: "#343a40", primarySoft: "#eef0f1" },
    dark: { primary: "#adb5bd", primaryDark: "#868e96", primarySoft: "#22262a" },
  },
];

// Patrón de fondo por defecto: siluetas de comida (manzana, pan, caja de
// leche, muslo de pollo, baguette) desperdigadas como textura sutil.
// Imágenes provistas por el usuario (generadas con IA): frutas, panificados,
// carnes, leche y baquitas dibujadas como contornos, una versión por tema.
const FOOD_PATTERN_LIGHT = "img/bg-pattern-light.jpg";
const FOOD_PATTERN_DARK = "img/bg-pattern-dark.jpg";

const DEFAULT_ICON = "🛒";
const DEFAULT_CATEGORY = "Otros";

const CATEGORY_COLORS = {
  "Verdulería": { bg: "#eef2d1", fg: "#5a6b1f" },
  "Carnicería": { bg: "#fbe4e4", fg: "#b3261e" },
  "Panadería": { bg: "#f6e9d8", fg: "#8a5a2b" },
  "Almacén": { bg: "#e0f0f5", fg: "#1f6d7a" },
  "Limpieza": { bg: "#ede4f7", fg: "#6a3fa0" },
  "Farmacia y Perfumería": { bg: "#fbe4ef", fg: "#a0356a" },
  Otros: { bg: "#ececeb", fg: "#6c757d" },
};

// Se evalúa en orden: la primera coincidencia de palabra clave gana.
// Cada regla asocia un producto a un ícono y a la categoría donde se suele comprar.
const PRODUCT_RULES = [
  { keywords: ["huevo"], icon: "🥚", category: "Almacén" },
  { keywords: ["afeitar", "gillette", "rasuradora", "maquinita"], icon: "🪒", category: "Farmacia y Perfumería" },
  { keywords: ["crema de afeitar"], icon: "🪒", category: "Farmacia y Perfumería" },
  { keywords: ["jabon para ropa", "jabón para ropa"], icon: "🧺", category: "Limpieza" },
  { keywords: ["jabon", "jabón"], icon: "🧼", category: "Farmacia y Perfumería" },
  { keywords: ["aceite"], icon: "🫒", category: "Almacén" },
  { keywords: ["leche"], icon: "🥛", category: "Almacén" },
  { keywords: ["yogur", "yogurt"], icon: "🥣", category: "Almacén" },
  { keywords: ["cafe", "café"], icon: "☕", category: "Almacén" },
  { keywords: ["azucar", "azúcar"], icon: "🧂", category: "Almacén" },
  { keywords: ["manteca", "margarina"], icon: "🧈", category: "Almacén" },
  { keywords: ["queso"], icon: "🧀", category: "Almacén" },
  { keywords: ["caldo", "sopa"], icon: "🍲", category: "Almacén" },
  { keywords: ["rollo de cocina", "rollos de cocina", "papel cocina"], icon: "🧻", category: "Limpieza" },
  { keywords: ["papel higienico", "papel higiénico"], icon: "🧻", category: "Limpieza" },
  { keywords: ["pasta dental", "dentifrico", "dentífrico"], icon: "🪥", category: "Farmacia y Perfumería" },
  { keywords: ["cepillo de dientes"], icon: "🪥", category: "Farmacia y Perfumería" },
  { keywords: ["pañuelos descartables"], icon: "🤧", category: "Limpieza" },
  { keywords: ["pan lactal", "pan"], icon: "🍞", category: "Panadería" },
  { keywords: ["fideos", "tallarin", "tallarín", "ravioles", "ñoquis"], icon: "🍝", category: "Almacén" },
  { keywords: ["arroz"], icon: "🍚", category: "Almacén" },
  { keywords: ["pure de tomate", "puré de tomate", "salsa de tomate"], icon: "🍅", category: "Almacén" },
  { keywords: ["tomate"], icon: "🍅", category: "Verdulería" },
  { keywords: ["atun", "atún"], icon: "🐟", category: "Carnicería" },
  { keywords: ["pescado", "merluza", "salmon", "salmón"], icon: "🐟", category: "Carnicería" },
  { keywords: ["pollo"], icon: "🍗", category: "Carnicería" },
  { keywords: ["carne", "milanesa", "asado", "bife"], icon: "🥩", category: "Carnicería" },
  { keywords: ["lavandina", "cloro"], icon: "🧴", category: "Limpieza" },
  { keywords: ["detergente", "limpiador", "desinfectante", "lysoform", "pino luz", "pinolux"], icon: "🧴", category: "Limpieza" },
  { keywords: ["suavizante"], icon: "🧴", category: "Limpieza" },
  { keywords: ["esponja"], icon: "🧽", category: "Limpieza" },
  { keywords: ["birulana"], icon: "🧽", category: "Limpieza" },
  { keywords: ["mopa"], icon: "🧹", category: "Limpieza" },
  { keywords: ["trapo de piso"], icon: "🧹", category: "Limpieza" },
  { keywords: ["plumero"], icon: "🪶", category: "Limpieza" },
  { keywords: ["perfume para ropa"], icon: "🌸", category: "Limpieza" },
  { keywords: ["ala para lavar ropa"], icon: "🧺", category: "Limpieza" },
  { keywords: ["shampoo", "champú", "champu", "acondicionador"], icon: "🧴", category: "Farmacia y Perfumería" },
  { keywords: ["desodorante"], icon: "🧴", category: "Farmacia y Perfumería" },
  { keywords: ["talco"], icon: "🧴", category: "Farmacia y Perfumería" },
  { keywords: ["preservativos"], icon: "🛡️", category: "Farmacia y Perfumería" },
  { keywords: ["vitamina"], icon: "💊", category: "Farmacia y Perfumería" },
  { keywords: ["enjuague dental", "hilo dental"], icon: "🪥", category: "Farmacia y Perfumería" },
  { keywords: ["crema", "pomada", "alergia"], icon: "💊", category: "Farmacia y Perfumería" },
  { keywords: ["cebolla"], icon: "🧅", category: "Verdulería" },
  { keywords: ["mayo de ajo"], icon: "🧄", category: "Almacén" },
  { keywords: ["ajo"], icon: "🧄", category: "Verdulería" },
  { keywords: ["morron", "morrón", "pimiento"], icon: "🫑", category: "Verdulería" },
  { keywords: ["aji molido", "ají molido", "pimenton", "pimentón", "picante"], icon: "🌶️", category: "Almacén" },
  { keywords: ["jengibre"], icon: "🫚", category: "Verdulería" },
  { keywords: ["bolson de verduras", "bolsón de verduras"], icon: "🥦", category: "Verdulería" },
  { keywords: ["papa", "patata"], icon: "🥔", category: "Verdulería" },
  { keywords: ["zanahoria"], icon: "🥕", category: "Verdulería" },
  { keywords: ["manzana"], icon: "🍎", category: "Verdulería" },
  { keywords: ["banana", "platano", "plátano"], icon: "🍌", category: "Verdulería" },
  { keywords: ["naranja"], icon: "🍊", category: "Verdulería" },
  { keywords: ["limon", "limón"], icon: "🍋", category: "Verdulería" },
  { keywords: ["palta", "aguacate"], icon: "🥑", category: "Verdulería" },
  { keywords: ["lechuga"], icon: "🥬", category: "Verdulería" },
  { keywords: ["manzanilla"], icon: "🌼", category: "Almacén" },
  { keywords: ["hierbas digestivas"], icon: "🌿", category: "Almacén" },
  { keywords: ["yerba"], icon: "🧉", category: "Almacén" },
  { keywords: ["agua"], icon: "💧", category: "Almacén" },
  { keywords: ["gaseosa", "cola", "sprite", "fanta"], icon: "🥤", category: "Almacén" },
  { keywords: ["cerveza"], icon: "🍺", category: "Almacén" },
  { keywords: ["vino"], icon: "🍷", category: "Almacén" },
  { keywords: ["chocolate"], icon: "🍫", category: "Almacén" },
  { keywords: ["galletita", "galleta"], icon: "🍪", category: "Almacén" },
  { keywords: ["pure instantaneo", "puré instantáneo"], icon: "🥔", category: "Almacén" },
  { keywords: ["mister musculo", "mister músculo"], icon: "🧴", category: "Limpieza" },
  { keywords: ["mayoliva"], icon: "🫒", category: "Almacén" },
  { keywords: ["bicarbonato"], icon: "🧂", category: "Almacén" },
  { keywords: ["vinagre"], icon: "🍶", category: "Almacén" },
  { keywords: ["miel"], icon: "🍯", category: "Almacén" },
  { keywords: ["sal fina", "sal gruesa"], icon: "🧂", category: "Almacén" },
  { keywords: ["capuchino"], icon: "☕", category: "Almacén" },
  { keywords: ["escarbadientes"], icon: "🥢", category: "Almacén" },
  { keywords: ["salchicha"], icon: "🌭", category: "Carnicería" },
  { keywords: ["cinta adhesiva"], icon: "🧷", category: "Otros" },
  { keywords: ["boxer", "bóxer"], icon: "👖", category: "Otros" },
  { keywords: ["pepino"], icon: "🥒", category: "Verdulería" },
  { keywords: ["maiz", "maíz", "choclo"], icon: "🌽", category: "Verdulería" },
  { keywords: ["hongos", "champiñones", "champinones"], icon: "🍄", category: "Verdulería" },
  { keywords: ["berenjena"], icon: "🍆", category: "Verdulería" },
  { keywords: ["mango"], icon: "🥭", category: "Verdulería" },
  { keywords: ["ananá", "anana", "piña", "pina"], icon: "🍍", category: "Verdulería" },
  { keywords: ["uva"], icon: "🍇", category: "Verdulería" },
  { keywords: ["durazno"], icon: "🍑", category: "Verdulería" },
  { keywords: ["cereza"], icon: "🍒", category: "Verdulería" },
  { keywords: ["frutilla"], icon: "🍓", category: "Verdulería" },
  { keywords: ["kiwi"], icon: "🥝", category: "Verdulería" },
  { keywords: ["pera"], icon: "🍐", category: "Verdulería" },
  { keywords: ["melon"], icon: "🍈", category: "Verdulería" },
  { keywords: ["sandia", "sandía"], icon: "🍉", category: "Verdulería" },
  { keywords: ["medialuna", "factura"], icon: "🥐", category: "Panadería" },
  { keywords: ["baguette", "flauta"], icon: "🥖", category: "Panadería" },
  { keywords: ["torta"], icon: "🍰", category: "Panadería" },
  { keywords: ["magdalena", "cupcake"], icon: "🧁", category: "Panadería" },
  { keywords: ["donut", "dona"], icon: "🍩", category: "Panadería" },
  { keywords: ["tostada", "grisin", "grisín"], icon: "🫓", category: "Panadería" },
  { keywords: ["bagel"], icon: "🥯", category: "Panadería" },
  { keywords: ["panceta", "bacon"], icon: "🥓", category: "Carnicería" },
  { keywords: ["hamburguesa"], icon: "🍔", category: "Carnicería" },
  { keywords: ["camaron", "camarón", "langostino"], icon: "🍤", category: "Carnicería" },
  { keywords: ["huevo frito"], icon: "🍳", category: "Almacén" },
  { keywords: ["pochoclo", "pop corn", "palomitas"], icon: "🍿", category: "Almacén" },
  { keywords: ["helado"], icon: "🍨", category: "Almacén" },
  { keywords: ["flan"], icon: "🍮", category: "Almacén" },
  { keywords: ["caramelo", "golosina"], icon: "🍬", category: "Almacén" },
  { keywords: ["mani", "maní"], icon: "🥜", category: "Almacén" },
  { keywords: ["porotos", "lentejas", "garbanzos"], icon: "🫘", category: "Almacén" },
  { keywords: ["ensalada"], icon: "🥗", category: "Almacén" },
  { keywords: ["jugo en caja", "jugo"], icon: "🧃", category: "Almacén" },
  { keywords: ["mamadera"], icon: "🍼", category: "Otros" },
  { keywords: ["pilas", "baterias", "baterías"], icon: "🔋", category: "Otros" },
  { keywords: ["foco", "lamparita", "lampara led", "lámpara led"], icon: "💡", category: "Otros" },
  { keywords: ["velas"], icon: "🕯️", category: "Otros" },
  { keywords: ["hilo y aguja", "hilo de coser"], icon: "🧵", category: "Otros" },
  { keywords: ["medias"], icon: "🧦", category: "Otros" },
  { keywords: ["gorra"], icon: "🧢", category: "Otros" },
  { keywords: ["regalo"], icon: "🎁", category: "Otros" },
  { keywords: ["destornillador", "herramienta"], icon: "🔧", category: "Otros" },
  { keywords: ["curitas", "curita", "banditas"], icon: "🩹", category: "Farmacia y Perfumería" },
  { keywords: ["alcohol en gel", "alcohol gel"], icon: "🧴", category: "Farmacia y Perfumería" },
  { keywords: ["comida para perro", "alimento balanceado", "balanceado perro"], icon: "🐕", category: "Otros" },
  { keywords: ["arena para gato", "alimento para gato", "balanceado gato"], icon: "🐈", category: "Otros" },
];

// Íconos adicionales para el selector que no tienen (todavía) una regla de
// auto-detección propia, pero conviene tener a mano para elegir a mano.
const EXTRA_ICON_OPTIONS = [
  "🍆", "🥒", "🌽", "🍄", "🥭", "🍍", "🍇", "🍑", "🍒", "🍓", "🥝", "🍐", "🍈", "🍉",
  "🥞", "🥐", "🥖", "🧇", "🥯", "🍰", "🧁", "🍩", "🥧", "🫓",
  "🍔", "🌮", "🌯", "🍕", "🥓", "🍖", "🦴", "🍤", "🦐", "🦀", "🦑", "🍳",
  "🍱", "🥫", "🍿", "🍮", "🍭", "🍬", "🍨", "🍦", "🧊", "🥜", "🌰", "🫘", "🥗", "🍹", "🧃", "🍼",
  "🔋", "💡", "🕯️", "🧵", "🧶", "🪡", "🧦", "👕", "🧢", "🎁", "🔧", "🔨", "🪛", "🧰",
  "🐾", "🐕", "🐈", "🌡️", "🩹",
];

const ALL_ICONS = Array.from(
  new Set([DEFAULT_ICON, ...PRODUCT_RULES.map((rule) => rule.icon), ...EXTRA_ICON_OPTIONS])
);

const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

function normalizeText(str) {
  return str.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX, "");
}

function matchProductRule(name) {
  const normalized = normalizeText(name);
  return PRODUCT_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
  );
}

function getProductIcon(name) {
  const rule = matchProductRule(name);
  return rule ? rule.icon : DEFAULT_ICON;
}

function getProductCategory(name) {
  const rule = matchProductRule(name);
  return rule ? rule.category : DEFAULT_CATEGORY;
}

// Un ícono de producto es o bien un emoji (string corto) o una imagen que
// subió el usuario, guardada como data URL. Esto decide cuál es cuál.
function isImageIcon(icon) {
  return typeof icon === "string" && icon.startsWith("data:image/");
}

// Pinta un ícono (emoji o imagen) dentro de `el`, sea el ícono de una fila
// de producto o el botón de vista previa del selector.
function renderIconInto(el, icon) {
  if (isImageIcon(icon)) {
    let img = el.querySelector("img");
    if (!img) {
      el.textContent = "";
      img = document.createElement("img");
      img.alt = "";
      el.appendChild(img);
    }
    img.src = icon;
  } else {
    el.textContent = icon;
  }
}

// Reescala y recorta a cuadrado una imagen elegida por el usuario para
// usarla como ícono de producto, devolviendo un data URL liviano.
function fileToIconDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const size = 96;
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Catálogo de ejemplo que se usa para sembrar la lista de alguien que
// recién entra. `key` es un identificador estable e interno (nunca se
// traduce ni se muestra) que se usa para saber "¿esto ya lo tiene?" en
// mergeNewCatalogProducts, independiente del nombre visible (que si se
// traduce o el usuario lo renombra). `name` es el canónico en español,
// usado también para matchear la categoría en PRODUCT_RULES; `names` trae
// la versión mostrada en cada idioma.
const DEFAULT_PRODUCTS_RAW = [
  { key: "eggs_carton", name: "Maple de huevos", quantity: 1, price: 6500, names: { en: "Carton of eggs", pt: "Cartela de ovos", tr: "Yumurta kolisi", ru: "Лоток яиц", ja: "卵パック" } },
  { key: "razor_gillette", name: "Máquina de afeitar Gillette x3", quantity: 1, price: 5895, names: { en: "Gillette razor x3", pt: "Aparelho de barbear Gillette x3", tr: "Gillette tıraş bıçağı x3", ru: "Бритвенный станок Gillette x3", ja: "ジレット カミソリ x3" } },
  { key: "soap_dove", name: "Jabón Dove", quantity: 1, price: 2350, names: { en: "Dove soap", pt: "Sabonete Dove", tr: "Dove sabun", ru: "Мыло Dove", ja: "ダヴ石鹸" } },
  { key: "oil_canuelas", name: "Aceite Cañuelas 900 ml", quantity: 1, price: 4115, names: { en: "Cañuelas oil 900 ml", pt: "Óleo Cañuelas 900 ml", tr: "Cañuelas yağı 900 ml", ru: "Масло Cañuelas 900 мл", ja: "カニュエラス油 900ml" } },
  { key: "milk_tregar", name: "Leche Tregar 1 L", quantity: 1, price: 2150, names: { en: "Tregar milk 1 L", pt: "Leite Tregar 1 L", tr: "Tregar süt 1 L", ru: "Молоко Tregar 1 л", ja: "トレガル牛乳 1L" } },
  { key: "coffee_la_virginia", name: "Café La Virginia 100 g", quantity: 1, price: 3500, names: { en: "La Virginia coffee 100 g", pt: "Café La Virginia 100 g", tr: "La Virginia kahve 100 g", ru: "Кофе La Virginia 100 г", ja: "ラ・ビルヒニア コーヒー 100g" } },
  { key: "sugar", name: "Azúcar 1 kg", quantity: 1, price: 2200, names: { en: "Sugar 1 kg", pt: "Açúcar 1 kg", tr: "Şeker 1 kg", ru: "Сахар 1 кг", ja: "砂糖 1kg" } },
  { key: "butter", name: "Manteca 200 g", quantity: 1, price: 3484.15, names: { en: "Butter 200 g", pt: "Manteiga 200 g", tr: "Tereyağı 200 g", ru: "Сливочное масло 200 г", ja: "バター 200g" } },
  { key: "veggie_stock", name: "Caldo de verduras x12", quantity: 1, price: 1879, names: { en: "Vegetable stock cubes x12", pt: "Caldo de legumes x12", tr: "Sebze suyu tableti x12", ru: "Овощной бульон x12", ja: "野菜だしキューブ x12" } },
  { key: "paper_towel", name: "Rollos de cocina x3", quantity: 1, price: 2343.2, names: { en: "Paper towel rolls x3", pt: "Rolos de papel toalha x3", tr: "Kağıt havlu x3", ru: "Бумажные полотенца x3", ja: "キッチンペーパー x3" } },
  { key: "toilet_paper", name: "Papel higiénico x4", quantity: 1, price: 3231.2, names: { en: "Toilet paper x4", pt: "Papel higiênico x4", tr: "Tuvalet kağıdı x4", ru: "Туалетная бумага x4", ja: "トイレットペーパー x4" } },
  { key: "toothpaste_colgate", name: "Pasta dental Colgate", quantity: 1, price: 3900, names: { en: "Colgate toothpaste", pt: "Creme dental Colgate", tr: "Colgate diş macunu", ru: "Зубная паста Colgate", ja: "コルゲート 歯磨き粉" } },
  { key: "bread_bimbo", name: "Pan lactal Bimbo integral", quantity: 1, price: 4293, names: { en: "Bimbo whole wheat sandwich bread", pt: "Pão de forma integral Bimbo", tr: "Bimbo tam buğday tost ekmeği", ru: "Хлеб цельнозерновой Bimbo", ja: "ビンボー 全粒粉食パン" } },
  { key: "tomato_puree", name: "Puré de tomate", quantity: 1, price: 1110, names: { en: "Tomato purée", pt: "Molho de tomate", tr: "Domates püresi", ru: "Томатное пюре", ja: "トマトピューレ" } },
  { key: "tuna", name: "Atún", quantity: 2, price: 1750, names: { en: "Tuna", pt: "Atum", tr: "Ton balığı", ru: "Тунец", ja: "ツナ缶" } },
  { key: "bleach", name: "Lavandina", quantity: 1, price: 1850, names: { en: "Bleach", pt: "Água sanitária", tr: "Çamaşır suyu", ru: "Отбеливатель", ja: "漂白剤" } },
  { key: "onion_1kg", name: "1 kg de cebolla", quantity: 1, price: 2000, names: { en: "1 kg of onions", pt: "1 kg de cebola", tr: "1 kg soğan", ru: "1 кг лука", ja: "玉ねぎ 1kg" } },
  { key: "garlic_2heads", name: "2 cabezas de ajo", quantity: 1, price: 900, names: { en: "2 heads of garlic", pt: "2 cabeças de alho", tr: "2 baş sarımsak", ru: "2 головки чеснока", ja: "にんにく 2玉" } },
  { key: "bell_pepper", name: "1 morrón", quantity: 1, price: 1200, names: { en: "1 bell pepper", pt: "1 pimentão", tr: "1 dolmalık biber", ru: "1 болгарский перец", ja: "ピーマン 1個" } },
  { key: "chili_ground", name: "Ají molido", quantity: 1, price: 2200, names: { en: "Ground chili pepper", pt: "Pimenta em pó", tr: "Toz biber", ru: "Молотый перец чили", ja: "唐辛子パウダー" } },
  { key: "pinolux", name: "Pinolux", quantity: 1, price: 2800, names: { en: "Pinolux cleaner", pt: "Pinolux (limpador)", tr: "Pinolux temizleyici", ru: "Чистящее средство Pinolux", ja: "ピノルックス 洗剤" } },
  { key: "cream_cheese", name: "Queso para untar", quantity: 1, price: 3200, names: { en: "Cream cheese", pt: "Queijo cremoso", tr: "Kremalı peynir", ru: "Плавленый сыр", ja: "クリームチーズ" } },
  { key: "allergy_cream", name: "Crema para alergia", quantity: 1, price: 4500, names: { en: "Allergy cream", pt: "Creme para alergia", tr: "Alerji kremi", ru: "Крем от аллергии", ja: "アレルギー用クリーム" } },
  { key: "rice", name: "Arroz", quantity: 1, price: 4580, names: { en: "Rice", pt: "Arroz", tr: "Pirinç", ru: "Рис", ja: "米" } },
  { key: "pasta_x3", name: "Fideos x3", quantity: 1, price: 3600, names: { en: "Pasta x3", pt: "Macarrão x3", tr: "Makarna x3", ru: "Макароны x3", ja: "パスタ x3" } },
  { key: "instant_mashed_potato", name: "Puré instantáneo", quantity: 1, price: 2800, names: { en: "Instant mashed potatoes", pt: "Purê instantâneo", tr: "Hazır patates püresi", ru: "Картофельное пюре быстрого приготовления", ja: "インスタントマッシュポテト" } },
  { key: "mister_musculo_bath", name: "Mister Músculo baño", quantity: 1, price: 4200, names: { en: "Mister Músculo bathroom cleaner", pt: "Mister Músculo banheiro", tr: "Mister Músculo banyo temizleyici", ru: "Mister Músculo для ванной", ja: "ミスタームスクロ 浴室用" } },
  { key: "mister_musculo_kitchen", name: "Mister Músculo cocina", quantity: 1, price: 4200, names: { en: "Mister Músculo kitchen cleaner", pt: "Mister Músculo cozinha", tr: "Mister Músculo mutfak temizleyici", ru: "Mister Músculo для кухни", ja: "ミスタームスクロ キッチン用" } },
  { key: "digestive_tea", name: "Té de hierbas digestivas", quantity: 1, price: 2600, names: { en: "Digestive herbal tea", pt: "Chá de ervas digestivas", tr: "Sindirim bitki çayı", ru: "Травяной чай для пищеварения", ja: "消化ハーブティー" } },
  { key: "gluten_free_bread", name: "Pan sin TACC", quantity: 1, price: 6500, names: { en: "Gluten-free bread", pt: "Pão sem glúten", tr: "Glutensiz ekmek", ru: "Хлеб без глютена", ja: "グルテンフリーパン" } },
  { key: "veggie_bag", name: "Bolsón de verduras", quantity: 1, price: 8000, names: { en: "Bag of mixed vegetables", pt: "Saco de verduras", tr: "Sebze paketi", ru: "Пакет овощей", ja: "野菜セット" } },
  { key: "laundry_soap", name: "Jabón para ropa", quantity: 1, price: 1800, names: { en: "Laundry soap", pt: "Sabão em pedra", tr: "Çamaşır sabunu", ru: "Хозяйственное мыло", ja: "洗濯石鹸" } },
  { key: "garlic_mayo", name: "Mayo de ajo", quantity: 1, price: 2400, names: { en: "Garlic mayonnaise", pt: "Maionese de alho", tr: "Sarımsaklı mayonez", ru: "Чесночный майонез", ja: "ガーリックマヨネーズ" } },
  { key: "roquefort_spread", name: "Queso untable Roquefort", quantity: 1, price: 4800, names: { en: "Roquefort spreadable cheese", pt: "Queijo cremoso Roquefort", tr: "Roquefort sürülebilir peynir", ru: "Сыр Рокфор для намазывания", ja: "ロックフォール クリームチーズ" } },
  { key: "baking_soda", name: "Bicarbonato", quantity: 1, price: 1500, names: { en: "Baking soda", pt: "Bicarbonato de sódio", tr: "Karbonat", ru: "Пищевая сода", ja: "重曹" } },
  { key: "white_vinegar", name: "Vinagre de alcohol", quantity: 1, price: 1400, names: { en: "White vinegar", pt: "Vinagre de álcool", tr: "Alkol sirkesi", ru: "Уксус спиртовой", ja: "穀物酢" } },
  { key: "mop_head", name: "Cabezal de mopa", quantity: 1, price: 5500, names: { en: "Mop head refill", pt: "Refil de esfregão", tr: "Paspas başlığı", ru: "Насадка для швабры", ja: "モップヘッド" } },
  { key: "condoms", name: "Preservativos", quantity: 1, price: 4200, names: { en: "Condoms", pt: "Preservativos", tr: "Prezervatif", ru: "Презервативы", ja: "コンドーム" } },
  { key: "honey_solid", name: "Miel sólida", quantity: 1, price: 3800, names: { en: "Creamed honey", pt: "Mel cremoso", tr: "Katı bal", ru: "Кремовый мёд", ja: "クリーム状はちみつ" } },
  { key: "tape_adhesive", name: "Cinta adhesiva papel/clásica", quantity: 1, price: 2100, names: { en: "Adhesive tape (paper/classic)", pt: "Fita adesiva (papel/comum)", tr: "Yapışkan bant (kağıt/klasik)", ru: "Клейкая лента (бумажная/обычная)", ja: "粘着テープ（紙/普通）" } },
  { key: "boxers", name: "Bóxer", quantity: 1, price: 6500, names: { en: "Boxer shorts", pt: "Cueca boxer", tr: "Boxer", ru: "Боксеры", ja: "ボクサーパンツ" } },
  { key: "sausages", name: "Salchichas", quantity: 1, price: 2900, names: { en: "Sausages", pt: "Salsichas", tr: "Sosis", ru: "Сосиски", ja: "ソーセージ" } },
  { key: "mayoliva", name: "Mayoliva", quantity: 1, price: 2600, names: { en: "Mayoliva (olive mayo)", pt: "Mayoliva (maionese de oliva)", tr: "Mayoliva (zeytinyağlı mayonez)", ru: "Mayoliva (майонез с оливковым маслом)", ja: "マヨリバ（オリーブマヨネーズ）" } },
  { key: "olive_oil", name: "Aceite de oliva", quantity: 1, price: 7500, names: { en: "Olive oil", pt: "Azeite de oliva", tr: "Zeytinyağı", ru: "Оливковое масло", ja: "オリーブオイル" } },
  { key: "ginger", name: "Jengibre", quantity: 1, price: 1800, names: { en: "Ginger", pt: "Gengibre", tr: "Zencefil", ru: "Имбирь", ja: "生姜" } },
  { key: "talc", name: "Talco", quantity: 1, price: 2400, names: { en: "Talcum powder", pt: "Talco", tr: "Talk pudrası", ru: "Тальк", ja: "ベビーパウダー" } },
  { key: "dish_soap", name: "Detergente", quantity: 1, price: 3000, names: { en: "Dish soap", pt: "Detergente", tr: "Bulaşık deterjanı", ru: "Средство для мытья посуды", ja: "食器用洗剤" } },
  { key: "floor_cloth", name: "Trapo de piso", quantity: 1, price: 2200, names: { en: "Floor cloth", pt: "Pano de chão", tr: "Yer bezi", ru: "Тряпка для пола", ja: "床拭き雑巾" } },
  { key: "disposable_tissues", name: "Pañuelos descartables", quantity: 1, price: 2100, names: { en: "Disposable tissues", pt: "Lenços de papel", tr: "Kağıt mendil", ru: "Одноразовые салфетки", ja: "ティッシュ" } },
  { key: "fine_salt", name: "Sal fina", quantity: 1, price: 1200, names: { en: "Fine salt", pt: "Sal fino", tr: "İnce tuz", ru: "Мелкая соль", ja: "精製塩" } },
  { key: "scouring_pad", name: "Birulana", quantity: 1, price: 1900, names: { en: "Scouring pad", pt: "Esponja de aço", tr: "Bulaşık teli", ru: "Металлическая мочалка", ja: "スチールたわし" } },
  { key: "cappuccino", name: "Capuchino", quantity: 1, price: 3500, names: { en: "Cappuccino mix", pt: "Cappuccino", tr: "Kapuçino", ru: "Капучино", ja: "カプチーノ" } },
  { key: "blen_original", name: "Blen original", quantity: 1, price: 4500, names: { en: "Blen original bleach", pt: "Blen original", tr: "Blen original", ru: "Blen original (отбеливатель)", ja: "ブレン オリジナル" } },
  { key: "vitamin_c", name: "Vitamina C", quantity: 3, price: 2800, names: { en: "Vitamin C", pt: "Vitamina C", tr: "C Vitamini", ru: "Витамин C", ja: "ビタミンC" } },
  { key: "toothpicks", name: "Escarbadientes", quantity: 1, price: 900, names: { en: "Toothpicks", pt: "Palitos de dente", tr: "Kürdan", ru: "Зубочистки", ja: "つまようじ" } },
  { key: "shaving_cream", name: "Crema de afeitar", quantity: 1, price: 3600, names: { en: "Shaving cream", pt: "Creme de barbear", tr: "Tıraş kremi", ru: "Крем для бритья", ja: "シェービングクリーム" } },
  { key: "sponge", name: "Esponja", quantity: 1, price: 1300, names: { en: "Sponge", pt: "Esponja", tr: "Sünger", ru: "Губка", ja: "スポンジ" } },
  { key: "deodorant_spray", name: "Desodorante spray", quantity: 1, price: 4200, names: { en: "Spray deodorant", pt: "Desodorante spray", tr: "Sprey deodorant", ru: "Дезодорант-спрей", ja: "スプレー式デオドラント" } },
  { key: "ala_detergent", name: "Ala para lavar ropa", quantity: 1, price: 5200, names: { en: "Ala laundry detergent", pt: "Sabão em pó Ala", tr: "Ala çamaşır deterjanı", ru: "Стиральный порошок Ala", ja: "アラ 洗濯洗剤" } },
  { key: "honey_liquid", name: "Miel líquida", quantity: 1, price: 3600, names: { en: "Liquid honey", pt: "Mel líquido", tr: "Sıvı bal", ru: "Жидкий мёд", ja: "液体はちみつ" } },
  { key: "shoe_brush", name: "Cepillo para zapatos", quantity: 1, price: 2800, names: { en: "Shoe brush", pt: "Escova de sapato", tr: "Ayakkabı fırçası", ru: "Щётка для обуви", ja: "靴ブラシ" } },
  { key: "mouthwash", name: "Enjuague dental", quantity: 1, price: 4200, names: { en: "Mouthwash", pt: "Enxaguante bucal", tr: "Ağız gargarası", ru: "Ополаскиватель для рта", ja: "マウスウォッシュ" } },
  { key: "dental_floss", name: "Hilo dental", quantity: 1, price: 2300, names: { en: "Dental floss", pt: "Fio dental", tr: "Diş ipi", ru: "Зубная нить", ja: "デンタルフロス" } },
  { key: "lemon", name: "Limón", quantity: 1, price: 1800, names: { en: "Lemon", pt: "Limão", tr: "Limon", ru: "Лимон", ja: "レモン" } },
  { key: "chamomile_tea", name: "Té de manzanilla", quantity: 1, price: 2400, names: { en: "Chamomile tea", pt: "Chá de camomila", tr: "Papatya çayı", ru: "Ромашковый чай", ja: "カモミールティー" } },
  { key: "feather_duster", name: "Plumero", quantity: 1, price: 3800, names: { en: "Feather duster", pt: "Espanador", tr: "Toz alma fırçası", ru: "Метёлка для пыли", ja: "はたき" } },
  { key: "fabric_perfume", name: "Perfume para ropa", quantity: 1, price: 5500, names: { en: "Fabric perfume", pt: "Perfume para roupas", tr: "Çamaşır parfümü", ru: "Парфюм для белья", ja: "衣類用香水" } },
];

function getDefaultProductDisplayName(item) {
  return (item.names && item.names[currentLang]) || item.name;
}

const DEFAULT_PRODUCTS = DEFAULT_PRODUCTS_RAW.map((item) => ({
  id: generateId(),
  key: item.key,
  name: getDefaultProductDisplayName(item),
  quantity: item.quantity,
  price: item.price,
  purchased: false,
  category: getProductCategory(item.name),
  icon: getProductIcon(item.name),
  priority: false,
}));

const CATALOG_VERSION = 3;
const CATALOG_VERSION_KEY = "listaCompras.catalogVersion";

let products = [];
let searchQuery = "";
let filterCategory = "";
let filterPriorityOnly = false;
let sortPriceOrder = null; // null | "desc" | "asc"
let manualIcon = null;

/* ==========================================================================
   Referencias del DOM
   ========================================================================== */

const btnThemeToggle = document.getElementById("btn-theme-toggle");
const btnLangToggle = document.getElementById("btn-lang-toggle");
const langBackdrop = document.getElementById("lang-backdrop");
const btnLangClose = document.getElementById("btn-lang-close");
const langOptionsEl = document.getElementById("lang-options");
const btnSettingsToggle = document.getElementById("btn-settings-toggle");
const settingsBackdrop = document.getElementById("settings-backdrop");
const btnSettingsClose = document.getElementById("btn-settings-close");
const btnOnboardingReplay = document.getElementById("btn-onboarding-replay");
const onboardingBackdrop = document.getElementById("onboarding-backdrop");
const btnOnboardingClose = document.getElementById("btn-onboarding-close");
const btnOnboardingBack = document.getElementById("btn-onboarding-back");
const btnOnboardingSkip = document.getElementById("btn-onboarding-skip");
const btnOnboardingNext = document.getElementById("btn-onboarding-next");
const onboardingStepEls = Array.from(document.querySelectorAll(".onboarding-step"));
const onboardingDotEls = Array.from(document.querySelectorAll(".onboarding-dot"));
const supportBackdrop = document.getElementById("support-backdrop");
const btnSupportProject = document.getElementById("btn-support-project");
const btnFooterSupport = document.getElementById("btn-footer-support");
const btnSupportClose = document.getElementById("btn-support-close");
const btnDonate = document.getElementById("btn-donate");
const donateStatus = document.getElementById("donate-status");
const footerMoreTools = document.getElementById("footer-more-tools");
const btnInstallApp = document.getElementById("btn-install-app");
const installBackdrop = document.getElementById("install-backdrop");
const btnInstallClose = document.getElementById("btn-install-close");
const installInstructionsEl = document.getElementById("install-instructions");
const installStepsEl = document.getElementById("install-steps");
const installChromeIosStepsEl = document.getElementById("install-chrome-ios-steps");
const installMacSafariStepsEl = document.getElementById("install-mac-safari-steps");
const btnInstallConfirm = document.getElementById("btn-install-confirm");
const installProgressEl = document.getElementById("install-progress");
const installProgressText = document.getElementById("install-progress-text");
const btnShareApp = document.getElementById("btn-share-app");
const toastEl = document.getElementById("toast");
const themeOptionButtons = document.querySelectorAll(".theme-option");
const btnSoundToggle = document.getElementById("btn-sound-toggle");
const vibrationSettingsRow = document.getElementById("vibration-settings-row");
const btnVibrationToggle = document.getElementById("btn-vibration-toggle");
const soundPresetButtons = document.querySelectorAll(".sound-preset-option");
const btnExportData = document.getElementById("btn-export-data");
const inputImportData = document.getElementById("input-import-data");
const ioTabButtons = document.querySelectorAll(".io-tab");
const ioPanels = document.querySelectorAll(".io-panel");
const pasteListTextarea = document.getElementById("paste-list-textarea");
const btnCopyListText = document.getElementById("btn-copy-list-text");
const btnCreateFromText = document.getElementById("btn-create-from-text");
const pasteListStatus = document.getElementById("paste-list-status");
const btnExportPdf = document.getElementById("btn-export-pdf");
const inputImportPdf = document.getElementById("input-import-pdf");
const pdfStatus = document.getElementById("pdf-status");
const btnExportImage = document.getElementById("btn-export-image");
const inputImportImage = document.getElementById("input-import-image");
const imageStatus = document.getElementById("image-status");
const btnGenerateCode = document.getElementById("btn-generate-code");
const generatedCodeBox = document.getElementById("generated-code-box");
const generatedCodeValue = document.getElementById("generated-code-value");
const generateCodeStatus = document.getElementById("generate-code-status");
const inputReceiveCode = document.getElementById("input-receive-code");
const btnReceiveCode = document.getElementById("btn-receive-code");
const receiveCodeStatus = document.getElementById("receive-code-status");
const TRANSFER_API_URL = "https://nekotools.site/transfer.php";
const inputBgColor = document.getElementById("input-bg-color");
const btnResetBg = document.getElementById("btn-reset-bg");
const paletteRow = document.getElementById("palette-row");
const bgImageOptionButtons = document.querySelectorAll(".bg-image-option[data-bg-choice]");
const inputBgImage = document.getElementById("input-bg-image");
const bgImageStatusEl = document.getElementById("bg-image-status");

const addForm = document.getElementById("add-form");
const inputName = document.getElementById("input-name");
const inputQuantity = document.getElementById("input-quantity");
const inputPrice = document.getElementById("input-price");
const inputIconPreview = document.getElementById("input-icon-preview");
const addIconPickerSlot = document.getElementById("add-icon-picker-slot");
const btnShowAddForm = document.getElementById("btn-show-add-form");
const btnCancelAdd = document.getElementById("btn-cancel-add");

const searchInput = document.getElementById("search-input");
const btnToggleFilters = document.getElementById("btn-toggle-filters");
const filtersBackdrop = document.getElementById("filters-backdrop");
const btnFiltersClose = document.getElementById("btn-filters-close");
const filterCategorySelect = document.getElementById("filter-category");
const filterPriorityCheckbox = document.getElementById("filter-priority");
const btnSortPrice = document.getElementById("btn-sort-price");
const btnClearFilters = document.getElementById("btn-clear-filters");

const pendingGroupEl = document.getElementById("pending-group");
const pendingListEl = document.getElementById("pending-list");
const purchasedGroupEl = document.getElementById("purchased-group");
const purchasedListEl = document.getElementById("purchased-list");
const purchasedTitleEl = document.getElementById("purchased-title");
const emptyMessageEl = document.getElementById("empty-message");
const itemTemplate = document.getElementById("product-item-template");

const summaryPendingEl = document.getElementById("summary-pending");
const summaryPurchasedEl = document.getElementById("summary-purchased");
const summaryCountEl = document.getElementById("summary-count");
const summaryTotalEl = document.getElementById("summary-total");
const summarySpentEl = document.getElementById("summary-spent");

const btnClearPurchased = document.getElementById("btn-clear-purchased");
const btnUncheckAll = document.getElementById("btn-uncheck-all");
const btnClearAll = document.getElementById("btn-clear-all");
const btnToggleMoreOptions = document.getElementById("btn-toggle-more-options");
const moreOptionsPanel = document.getElementById("more-options-panel");

/* ==========================================================================
   Utilidades
   ========================================================================== */

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Todo lo que entra de afuera (archivo importado, lista recibida por código,
// localStorage) pasa por acá antes de tocar la app: no confiamos en que la
// forma ni los valores sean los esperados, porque una lista armada a
// propósito es la forma más fácil de meterle basura a alguien.
const MAX_IMPORTED_PRODUCTS = 2000;
const MAX_PRODUCT_NAME_LENGTH = 200;
const MAX_PRODUCT_QUANTITY = 9999;
const MAX_PRODUCT_PRICE = 1e9;
const MAX_EMOJI_ICON_LENGTH = 16;
const MAX_IMAGE_ICON_LENGTH = 60000;
const IMAGE_ICON_PATTERN = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

function sanitizeIcon(icon, name) {
  if (typeof icon === "string") {
    if (icon.startsWith("data:")) {
      if (icon.length <= MAX_IMAGE_ICON_LENGTH && IMAGE_ICON_PATTERN.test(icon)) return icon;
    } else if (icon.length > 0 && icon.length <= MAX_EMOJI_ICON_LENGTH) {
      return icon;
    }
  }
  return getProductIcon(name);
}

function sanitizeProduct(raw, usedIds) {
  if (!raw || typeof raw !== "object" || typeof raw.name !== "string") return null;

  const name = raw.name.trim().slice(0, MAX_PRODUCT_NAME_LENGTH);
  if (!name) return null;

  let id = typeof raw.id === "string" && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : null;
  if (id === null || usedIds.has(id)) id = generateId();
  usedIds.add(id);

  const quantity = Math.round(Number(raw.quantity));
  const price = Number(raw.price);
  const product = {
    id,
    name,
    quantity: Number.isFinite(quantity) ? Math.min(MAX_PRODUCT_QUANTITY, Math.max(1, quantity)) : 1,
    price: Number.isFinite(price) ? Math.min(MAX_PRODUCT_PRICE, Math.max(0, price)) : 0,
    purchased: raw.purchased === true,
    category: Object.prototype.hasOwnProperty.call(CATEGORY_COLORS, raw.category) ? raw.category : DEFAULT_CATEGORY,
    priority: raw.priority === true,
    icon: sanitizeIcon(raw.icon, name),
  };
  if (typeof raw.key === "string" && /^[a-z0-9_]{1,40}$/.test(raw.key)) product.key = raw.key;
  return product;
}

function sanitizeProductList(list) {
  if (!Array.isArray(list)) return [];
  const usedIds = new Set();
  const clean = [];
  for (const raw of list.slice(0, MAX_IMPORTED_PRODUCTS)) {
    const product = sanitizeProduct(raw, usedIds);
    if (product) clean.push(product);
  }
  return clean;
}

function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

function findProduct(id) {
  return products.find((p) => p.id === id);
}

function getEffectiveTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeToggleButton() {
  const effective = getEffectiveTheme();
  btnThemeToggle.innerHTML = effective === "dark" ? SVG_ICON_SUN : SVG_ICON_MOON;
  btnThemeToggle.setAttribute(
    "aria-label",
    effective === "dark" ? t("theme_to_day_aria") : t("theme_to_night_aria")
  );

  const explicit = document.documentElement.getAttribute("data-theme") || "auto";
  themeOptionButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.themeChoice === explicit);
  });
}

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  updateThemeToggleButton();
}

function setTheme(theme) {
  try {
    if (theme === "light" || theme === "dark") {
      localStorage.setItem(THEME_KEY, theme);
    } else {
      localStorage.removeItem(THEME_KEY);
    }
  } catch (error) {
    console.error("No se pudo guardar la preferencia de tema.", error);
  }
  applyTheme(theme);
  refreshBgColorInput();
  applyPalette(getSavedPaletteId());
  applyBackgroundImage();
}

function getDefaultBgColor() {
  return getEffectiveTheme() === "dark" ? DEFAULT_BG_DARK : DEFAULT_BG_LIGHT;
}

function applyBgColor(color) {
  if (color) {
    document.documentElement.style.setProperty("--color-page-bg", color);
  } else {
    document.documentElement.style.removeProperty("--color-page-bg");
  }
}

function refreshBgColorInput() {
  let saved = null;
  try {
    saved = localStorage.getItem(BG_COLOR_KEY);
  } catch (error) {
    console.error("No se pudo leer el color de fondo guardado.", error);
  }
  inputBgColor.value = saved || getDefaultBgColor();
}

function getSavedPaletteId() {
  try {
    return localStorage.getItem(PALETTE_KEY);
  } catch (error) {
    console.error("No se pudo leer la plantilla de color guardada.", error);
    return null;
  }
}

function getSavedCustomColor() {
  try {
    return localStorage.getItem(CUSTOM_COLOR_KEY);
  } catch (error) {
    console.error("No se pudo leer tu color personalizado.", error);
    return null;
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixColors(hexA, hexB, weightA) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex({
    r: a.r * weightA + b.r * (1 - weightA),
    g: a.g * weightA + b.g * (1 - weightA),
    b: a.b * weightA + b.b * (1 - weightA),
  });
}

// A partir de un único color elegido a mano, arma variantes de claro/oscuro
// razonables (oscurecida para el modo día, aclarada para el modo noche, y un
// fondo suave mezclado con blanco o con el fondo oscuro según corresponda).
function buildCustomPaletteVariant(hex) {
  return {
    light: {
      primary: hex,
      primaryDark: mixColors(hex, "#000000", 0.78),
      primarySoft: mixColors(hex, "#ffffff", 0.13),
    },
    dark: {
      primary: mixColors(hex, "#ffffff", 0.72),
      primaryDark: mixColors(hex, "#ffffff", 0.5),
      primarySoft: mixColors(hex, "#10140e", 0.18),
    },
  };
}

function getPaletteVariants(paletteId) {
  if (paletteId === "custom") {
    return buildCustomPaletteVariant(getSavedCustomColor() || COLOR_PALETTES[0].swatch);
  }
  return COLOR_PALETTES.find((p) => p.id === paletteId) || COLOR_PALETTES[0];
}

function applyColorVariant(variant) {
  document.documentElement.style.setProperty("--color-primary", variant.primary);
  document.documentElement.style.setProperty("--color-primary-dark", variant.primaryDark);
  document.documentElement.style.setProperty("--color-primary-soft", variant.primarySoft);
}

function applyPalette(paletteId) {
  const variants = getPaletteVariants(paletteId);
  applyColorVariant(getEffectiveTheme() === "dark" ? variants.dark : variants.light);
}

function renderPaletteRow() {
  const activeId = getSavedPaletteId() || COLOR_PALETTES[0].id;
  const customColor = getSavedCustomColor();
  paletteRow.innerHTML = "";

  COLOR_PALETTES.forEach((palette) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-swatch";
    btn.style.background = palette.swatch;
    const paletteName = t(`palette_${palette.id}`);
    btn.title = paletteName;
    btn.setAttribute("aria-label", t("palette_swatch_aria", { name: paletteName }));
    btn.classList.toggle("active", palette.id === activeId);
    btn.addEventListener("click", () => {
      try {
        localStorage.setItem(PALETTE_KEY, palette.id);
      } catch (error) {
        console.error("No se pudo guardar la plantilla de color.", error);
      }
      applyPalette(palette.id);
      renderPaletteRow();
    });
    paletteRow.appendChild(btn);
  });

  const customWrap = document.createElement("div");
  customWrap.className = "palette-custom-wrap";

  const customBtn = document.createElement("button");
  customBtn.type = "button";
  customBtn.className = "palette-swatch palette-swatch-custom";
  customBtn.title = t("palette_custom_title");
  customBtn.setAttribute("aria-label", t("palette_custom_aria"));
  customBtn.classList.toggle("active", activeId === "custom");

  const customInput = document.createElement("input");
  customInput.type = "color";
  customInput.className = "palette-custom-input";
  customInput.setAttribute("aria-hidden", "true");
  customInput.tabIndex = -1;
  customInput.value = customColor || COLOR_PALETTES[0].swatch;

  customBtn.addEventListener("click", () => customInput.click());

  // Vista previa en vivo mientras se arrastra en el selector nativo, sin
  // guardar ni volver a armar la fila (eso rompería el selector abierto).
  customInput.addEventListener("input", () => {
    const variants = buildCustomPaletteVariant(customInput.value);
    applyColorVariant(getEffectiveTheme() === "dark" ? variants.dark : variants.light);
  });

  customInput.addEventListener("change", () => {
    const hex = customInput.value;
    try {
      localStorage.setItem(CUSTOM_COLOR_KEY, hex);
      localStorage.setItem(PALETTE_KEY, "custom");
    } catch (error) {
      console.error("No se pudo guardar tu color personalizado.", error);
    }
    applyPalette("custom");
    renderPaletteRow();
  });

  customWrap.appendChild(customBtn);
  customWrap.appendChild(customInput);
  paletteRow.appendChild(customWrap);
}

function getSavedBgImageChoice() {
  let choice = null;
  try {
    choice = localStorage.getItem(BG_IMAGE_CHOICE_KEY);
  } catch (error) {
    console.error("No se pudo leer la preferencia de imagen de fondo.", error);
  }
  return choice || "pattern";
}

function updateBgImageButtons(choice) {
  bgImageOptionButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.bgChoice === choice);
  });
  bgImageStatusEl.textContent = choice === "custom" ? t("bg_image_custom_status") : "";
}

function applyBackgroundImage() {
  let choice = getSavedBgImageChoice();

  if (choice === "none") {
    document.body.style.backgroundImage = "none";
    document.body.classList.remove("bg-pattern-mode");
  } else if (choice === "custom") {
    document.body.classList.remove("bg-pattern-mode");
    let customImage = null;
    try {
      customImage = localStorage.getItem(BG_IMAGE_CUSTOM_KEY);
    } catch (error) {
      console.error("No se pudo leer la imagen de fondo guardada.", error);
    }
    // Solo data URLs de imagen sin caracteres que puedan cerrar el url("...")
    // y colar CSS: lo guardado en localStorage no se toma como confiable.
    if (customImage && /^data:image\/[a-z+.-]+;base64,[A-Za-z0-9+/]+=*$/.test(customImage)) {
      document.body.style.backgroundImage = `url("${customImage}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundPosition = "center";
    } else {
      choice = "pattern";
    }
  }

  if (choice === "pattern") {
    const pattern = getEffectiveTheme() === "dark" ? FOOD_PATTERN_DARK : FOOD_PATTERN_LIGHT;
    document.body.style.backgroundImage = "none";
    document.documentElement.style.setProperty("--pattern-url", `url("${pattern}")`);
    document.body.classList.add("bg-pattern-mode");
  }

  updateBgImageButtons(choice);
}

// Abre/cierra un selector de íconos dentro de `slotEl`, creándolo al vuelo.
// `triggerBtn` es el botón que lo abrió (para el estado aria-expanded) y
// `onSelect` recibe el ícono elegido cuando el usuario toca una opción.
function toggleIconPicker(triggerBtn, slotEl, onSelect) {
  const existing = slotEl.querySelector(".icon-picker");
  if (existing) {
    existing.remove();
    triggerBtn.setAttribute("aria-expanded", "false");
    return;
  }

  const picker = document.createElement("div");
  picker.className = "icon-picker";

  const commitIcon = (icon) => {
    onSelect(icon);
    picker.remove();
    triggerBtn.setAttribute("aria-expanded", "false");
  };

  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = "image/*";
  uploadInput.hidden = true;
  uploadInput.addEventListener("change", () => {
    const file = uploadInput.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    fileToIconDataUrl(file)
      .then((dataUrl) => commitIcon(dataUrl))
      .catch((error) => {
        console.error("No se pudo procesar la imagen elegida como ícono.", error);
        alert(t("alert_image_load_error"));
      });
  });

  const uploadBtn = document.createElement("button");
  uploadBtn.type = "button";
  uploadBtn.className = "icon-option icon-option-upload";
  uploadBtn.setAttribute("aria-label", t("icon_upload_aria"));
  uploadBtn.title = t("icon_upload_aria");
  uploadBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16"></path><path d="M14 14l1.586-1.586a2 2 0 0 1 2.828 0L21 15"></path><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8" cy="9" r="1.5"></circle></svg>';
  uploadBtn.addEventListener("click", () => uploadInput.click());
  picker.appendChild(uploadBtn);
  picker.appendChild(uploadInput);

  ALL_ICONS.forEach((icon) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-option";
    btn.textContent = icon;
    btn.setAttribute("aria-label", t("icon_option_aria", { icon }));
    btn.addEventListener("click", () => commitIcon(icon));
    picker.appendChild(btn);
  });

  slotEl.appendChild(picker);
  triggerBtn.setAttribute("aria-expanded", "true");
}

function closeIconPicker(slotEl, triggerBtn) {
  const existing = slotEl.querySelector(".icon-picker");
  if (existing) existing.remove();
  triggerBtn.setAttribute("aria-expanded", "false");
}

/* ==========================================================================
   Persistencia
   ========================================================================== */

// localStorage puede fallar (cuota llena, modo privado, cookies bloqueadas):
// que la app siga funcionando en memoria y avise, en vez de romperse.
let toastHideTimer = null;
let storageErrorShown = false;

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("No se pudo leer el almacenamiento del navegador.", error);
    return null;
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    storageErrorShown = false;
  } catch (error) {
    console.error("No se pudo guardar la lista.", error);
    if (!storageErrorShown) {
      storageErrorShown = true;
      showToast(t("storage_error"));
    }
  }
}

function saveCatalogVersion() {
  try {
    localStorage.setItem(CATALOG_VERSION_KEY, String(CATALOG_VERSION));
  } catch (error) {
    console.error("No se pudo guardar la versión del catálogo.", error);
  }
}

// Suma al catálogo guardado los productos nuevos que se hayan agregado al
// catálogo base (por nombre) y completa el precio de los que todavía están
// en $0, sin tocar productos que el usuario ya haya editado o priceado a
// mano. Corre una sola vez por versión de catálogo, así un producto borrado
// a propósito no vuelve a aparecer solo porque falta en la lista guardada.
function mergeNewCatalogProducts() {
  const storedVersion = Number(safeGetItem(CATALOG_VERSION_KEY)) || 0;
  if (storedVersion >= CATALOG_VERSION) return;

  // Dos formas de reconocer "esto ya lo tengo": por `key` (productos
  // sembrados después de este cambio, en cualquier idioma) o, para
  // compatibilidad con listas guardadas de antes, por el nombre canónico
  // en español (esas no tienen `key`).
  const defaultsByKey = new Map(DEFAULT_PRODUCTS.map((item) => [item.key, item]));
  const canonicalNameByKey = new Map(DEFAULT_PRODUCTS_RAW.map((item) => [item.key, normalizeText(item.name)]));
  const defaultsByCanonicalName = new Map(
    DEFAULT_PRODUCTS_RAW.map((item) => [normalizeText(item.name), defaultsByKey.get(item.key)])
  );

  const existingKeys = new Set(products.map((p) => p.key).filter(Boolean));
  const existingNames = new Set(products.map((p) => normalizeText(p.name)));

  const newProducts = DEFAULT_PRODUCTS.filter((item) => {
    if (existingKeys.has(item.key)) return false;
    if (existingNames.has(canonicalNameByKey.get(item.key))) return false;
    return true;
  });

  let changed = false;

  if (newProducts.length > 0) {
    products = products.concat(newProducts);
    changed = true;
  }

  products.forEach((product) => {
    if (product.price > 0) return;
    const match = (product.key && defaultsByKey.get(product.key)) || defaultsByCanonicalName.get(normalizeText(product.name));
    if (match && match.price > 0) {
      product.price = match.price;
      changed = true;
    }
  });

  if (changed) {
    saveToLocalStorage();
  }

  saveCatalogVersion();
}

function loadFromLocalStorage() {
  const raw = safeGetItem(STORAGE_KEY);

  if (raw === null) {
    products = DEFAULT_PRODUCTS;
    saveToLocalStorage();
    saveCatalogVersion();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    products = sanitizeProductList(parsed);
  } catch (error) {
    console.error("No se pudo leer la lista guardada, se reinicia.", error);
    products = [];
  }

  mergeNewCatalogProducts();
}

/* ==========================================================================
   Operaciones sobre productos
   ========================================================================== */

function addProduct(name, quantity, price, icon) {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const safeQuantity = Math.max(1, Math.round(Number(quantity)) || 1);
  const safePrice = Math.max(0, Number(price) || 0);

  products.unshift({
    id: generateId(),
    name: trimmedName,
    quantity: safeQuantity,
    price: safePrice,
    purchased: false,
    category: getProductCategory(trimmedName),
    priority: false,
    icon: icon || getProductIcon(trimmedName),
  });

  saveToLocalStorage();
  renderProducts();
}

// Interpreta una línea de texto pegado como un producto: separa cantidad
// (prefijo "2 " / "2x ", o sufijo "x2") y precio (sufijo "$1.234,56") del
// resto, que queda como nombre. Devuelve null si la línea queda vacía.
function parsePastedLine(rawLine) {
  let line = rawLine.trim();
  if (!line) return null;

  line = line.replace(/^[-*•●▪‣◦]+\s*/, "").trim();
  line = line.replace(/^\d+[.)]\s+/, "").trim();
  if (!line) return null;

  let price = null;
  const priceMatch = line.match(/\$\s*([\d.,]+)\s*$/);
  if (priceMatch) {
    const rawPrice = priceMatch[1].replace(/\./g, "").replace(",", ".");
    const value = parseFloat(rawPrice);
    if (!isNaN(value)) price = value;
    line = line.slice(0, priceMatch.index).trim();
    line = line.replace(/[-–—|:]\s*$/, "").trim();
  }

  let quantity = 1;
  let match = line.match(/^(\d+)\s*[xX]\s+(.+)$/);
  if (match) {
    quantity = parseInt(match[1], 10);
    line = match[2].trim();
  } else {
    match = line.match(/^(\d+)\s+(.+)$/);
    if (match) {
      quantity = parseInt(match[1], 10);
      line = match[2].trim();
    } else {
      match = line.match(/^(.+?)\s*[xX]\s*(\d+)$/);
      if (match) {
        line = match[1].trim();
        quantity = parseInt(match[2], 10);
      }
    }
  }

  line = line.replace(/^[-–—|:]\s*/, "").replace(/[-–—|:]\s*$/, "").trim();
  if (!line) return null;

  return {
    name: line,
    quantity: Math.max(1, quantity || 1),
    price: price === null ? 0 : Math.max(0, price),
  };
}

// Agrega productos a partir de texto pegado (una línea por producto), sin
// duplicar los que ya están en la lista actual (por nombre, sin mayúsculas).
function addProductsFromText(text) {
  const existingNames = new Set(products.map((p) => p.name.trim().toLowerCase()));
  let added = 0;
  let skipped = 0;

  text.split(/\r?\n/).forEach((rawLine) => {
    const parsed = parsePastedLine(rawLine);
    if (!parsed) return;

    const key = parsed.name.toLowerCase();
    if (existingNames.has(key)) {
      skipped++;
      return;
    }
    existingNames.add(key);

    products.unshift({
      id: generateId(),
      name: parsed.name,
      quantity: parsed.quantity,
      price: parsed.price,
      purchased: false,
      category: getProductCategory(parsed.name),
      priority: false,
      icon: getProductIcon(parsed.name),
    });
    added++;
  });

  if (added > 0) {
    saveToLocalStorage();
    renderProducts();
  }

  return { added, skipped };
}

// Arma una representación en texto plano de la lista actual, pensada para
// copiar y pegar (y que `parsePastedLine` pueda volver a leerla).
function buildListText() {
  return products
    .map((p) => {
      let line = `${p.quantity} ${p.name}`;
      if (p.price > 0) line += ` - ${formatCurrency(p.price)}`;
      return line;
    })
    .join("\n");
}

/* ==========================================================================
   PDF (carga las librerías al vuelo, solo cuando hacen falta)
   ========================================================================== */

const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js";
const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const TESSERACT_URL = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/7.0.0/tesseract.min.js";

// Subresource Integrity: si alguien alterara estos archivos en el CDN, el
// navegador se niega a ejecutarlos. Los hashes coinciden con los que publica
// cdnjs; al cambiar de versión hay que actualizarlos juntos con la URL.
const SCRIPT_INTEGRITY = {
  [JSPDF_URL]: "sha384-qovJwSBbRDPP5cEjCp8S0UP66wrvnjaa60XMOGzTNanrThcrGfXfnZkvgY8N1KT3",
  [PDFJS_URL]: "sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e",
  [TESSERACT_URL]: "sha384-2BQ3U3OdKOb0Uczxqr41I9UvZkzr4V9Hv8uSzMMZAlmhsFClvdZX5wi5fDCzG+tM",
};

const loadedScripts = {};
function loadScript(src) {
  if (!loadedScripts[src]) {
    loadedScripts[src] = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      if (SCRIPT_INTEGRITY[src]) {
        script.integrity = SCRIPT_INTEGRITY[src];
        script.crossOrigin = "anonymous";
      }
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }
  return loadedScripts[src];
}

async function ensureJsPdfLoaded() {
  if (!window.jspdf) await loadScript(JSPDF_URL);
}

async function ensurePdfJsLoaded() {
  if (!window.pdfjsLib) {
    await loadScript(PDFJS_URL);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  }
}

function exportListAsPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const rightEdge = doc.internal.pageSize.getWidth() - marginX;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 50;

  function ensureSpace(lineHeight) {
    if (y + lineHeight > pageHeight - 50) {
      doc.addPage();
      y = 50;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Neko Lista", marginX, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(t("doc_generated_on", { date: new Date().toLocaleDateString("es-AR") }), marginX, y);
  y += 28;
  doc.setTextColor(20);

  function renderSection(title, items) {
    if (!items.length) return;
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, marginX, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const nameMaxWidth = rightEdge - marginX - 100;
    const lineHeight = 16;
    items.forEach((product) => {
      const lines = doc.splitTextToSize(`${product.quantity} x ${product.name}`, nameMaxWidth);
      ensureSpace(lineHeight * lines.length);
      lines.forEach((line, i) => doc.text(line, marginX, y + i * lineHeight));
      if (product.price > 0) {
        doc.text(formatCurrency(product.price * product.quantity), rightEdge, y, { align: "right" });
      }
      y += lineHeight * lines.length;
    });
    y += 10;
  }

  const pending = products.filter((product) => !product.purchased);
  const purchased = products.filter((product) => product.purchased);
  renderSection(t("doc_pending"), pending);
  renderSection(t("doc_purchased"), purchased);

  ensureSpace(60);
  doc.setDrawColor(200);
  doc.line(marginX, y, rightEdge, y);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const totalPending = pending.reduce((sum, product) => sum + product.price * product.quantity, 0);
  const totalPurchased = purchased.reduce((sum, product) => sum + product.price * product.quantity, 0);
  doc.text(`${t("doc_falta_comprar")}: ${formatCurrency(totalPending)}`, marginX, y);
  y += 18;
  doc.text(`${t("doc_ya_compraste")}: ${formatCurrency(totalPurchased)}`, marginX, y);

  doc.save(`lista-de-compras-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Líneas que no son productos: el título, la fecha y los subtotales que
// pone nuestro propio exportador. Se filtran antes de parsear, para que
// re-importar un PDF exportado desde acá no cree productos falsos.
// Las líneas de relleno (título, fecha, subtotales) se generan en el idioma
// activo al exportar, pero el PDF se puede reimportar después con otro
// idioma activo: se arman patrones para las 6 traducciones, no solo la
// actual, para que ninguna cuele como producto falso.
function buildPdfBoilerplatePatterns() {
  const patterns = [/^neko lista$/i, /^mi lista de compras$/i, /^generado el /i, /^generated on /i];
  const keys = ["doc_pending", "doc_purchased", "doc_falta_comprar", "doc_ya_compraste"];
  Object.keys(TRANSLATIONS).forEach((lang) => {
    keys.forEach((key) => {
      const value = TRANSLATIONS[lang][key];
      if (!value) return;
      const escaped = value.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      patterns.push(new RegExp(`^${escaped}\\b`, "i"));
    });
  });
  return patterns;
}

const PDF_BOILERPLATE_PATTERNS = buildPdfBoilerplatePatterns();

function stripPdfBoilerplate(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !PDF_BOILERPLATE_PATTERNS.some((pattern) => pattern.test(line.trim())))
    .join("\n");
}

async function extractTextFromPdf(arrayBuffer) {
  // isEvalSupported:false cierra CVE-2024-4367: en pdf.js < 4.2.67 un PDF
  // armado a propósito podía ejecutar JavaScript vía la fuente embebida.
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach((item) => {
      fullText += item.str + (item.hasEOL ? "\n" : " ");
    });
    fullText += "\n";
  }
  return fullText;
}

/* ==========================================================================
   Imagen: exportar la lista como foto, e importar leyendo una foto (OCR)
   ========================================================================== */

async function ensureTesseractLoaded() {
  if (!window.Tesseract) await loadScript(TESSERACT_URL);
}

function pathRoundedRect(ctx, x, y, w, h, radii) {
  const r = typeof radii === "number" ? { tl: radii, tr: radii, br: radii, bl: radii } : radii;
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.arcTo(x + w, y, x + w, y + r.tr, r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.arcTo(x + w, y + h, x + w - r.br, y + h, r.br);
  ctx.lineTo(x + r.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - r.bl, r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.arcTo(x, y, x + r.tl, y, r.tl);
  ctx.closePath();
}

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

async function exportListAsImage() {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  const rootStyles = getComputedStyle(document.documentElement);
  const primary = rootStyles.getPropertyValue("--color-primary").trim() || "#2f9e44";
  const primaryDark = rootStyles.getPropertyValue("--color-primary-dark").trim() || "#1f7a34";
  const textColor = "#21261f";
  const mutedColor = "#6f7d73";
  const borderColor = "#e6e2d5";
  const cardBg = "#ffffff";
  const pageBg = "#f5f3ee";

  const width = 800;
  const paddingX = 40;
  const headerHeight = 108;
  const rowHeight = 34;
  const sectionGap = 26;
  const outerMargin = 20;

  const pending = products.filter((product) => !product.purchased);
  const purchased = products.filter((product) => product.purchased);
  const totalPending = pending.reduce((sum, product) => sum + product.price * product.quantity, 0);
  const totalPurchased = purchased.reduce((sum, product) => sum + product.price * product.quantity, 0);

  let contentHeight = 30;
  if (pending.length) contentHeight += 26 + pending.length * rowHeight + sectionGap;
  if (purchased.length) contentHeight += 26 + purchased.length * rowHeight + sectionGap;
  contentHeight += 76;

  const cardHeight = headerHeight + contentHeight;
  const totalHeight = cardHeight + outerMargin * 2;
  const cardX = outerMargin;
  const cardY = outerMargin;
  const cardW = width - outerMargin * 2;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = pageBg;
  ctx.fillRect(0, 0, width, totalHeight);

  pathRoundedRect(ctx, cardX, cardY, cardW, cardHeight, 20);
  ctx.fillStyle = cardBg;
  ctx.fill();

  pathRoundedRect(ctx, cardX, cardY, cardW, headerHeight, { tl: 20, tr: 20, br: 0, bl: 0 });
  const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + headerHeight);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(1, primaryDark);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 26px Outfit, sans-serif";
  ctx.fillText("🐱 Neko Lista", cardX + paddingX, cardY + 46);
  ctx.font = "500 14px Inter, sans-serif";
  ctx.globalAlpha = 0.9;
  const dateLabel = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  ctx.fillText(dateLabel, cardX + paddingX, cardY + 74);
  ctx.globalAlpha = 1;

  let y = cardY + headerHeight + 34;
  const nameMaxWidth = cardW - paddingX * 2 - 150;

  function drawSection(title, items) {
    if (!items.length) return;
    ctx.fillStyle = mutedColor;
    ctx.font = "700 13px Outfit, sans-serif";
    ctx.fillText(title.toUpperCase(), cardX + paddingX, y);
    y += 24;

    items.forEach((product, index) => {
      ctx.fillStyle = textColor;
      ctx.font = "600 15px Inter, sans-serif";
      const productIcon = product.icon || getProductIcon(product.name);
      const icon = isImageIcon(productIcon) ? DEFAULT_ICON : productIcon;
      const label = `${icon}  ${product.quantity} x ${product.name}`;
      ctx.fillText(truncateToWidth(ctx, label, nameMaxWidth), cardX + paddingX, y);

      if (product.price > 0) {
        ctx.font = "700 15px Outfit, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(formatCurrency(product.price * product.quantity), cardX + cardW - paddingX, y);
        ctx.textAlign = "left";
      }

      if (index < items.length - 1) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + paddingX, y + 13);
        ctx.lineTo(cardX + cardW - paddingX, y + 13);
        ctx.stroke();
      }

      y += rowHeight;
    });

    y += sectionGap;
  }

  drawSection(t("doc_pending"), pending);
  drawSection(t("doc_purchased"), purchased);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + paddingX, y);
  ctx.lineTo(cardX + cardW - paddingX, y);
  ctx.stroke();
  y += 30;

  ctx.font = "700 15px Outfit, sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText(t("doc_falta_comprar"), cardX + paddingX, y);
  ctx.textAlign = "right";
  ctx.fillStyle = primaryDark;
  ctx.fillText(formatCurrency(totalPending), cardX + cardW - paddingX, y);
  ctx.textAlign = "left";
  y += 26;

  ctx.font = "500 13px Inter, sans-serif";
  ctx.fillStyle = mutedColor;
  ctx.fillText(t("summary_spent", { amount: formatCurrency(totalPurchased) }), cardX + paddingX, y);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("No se pudo generar la imagen."));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lista-de-compras-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

async function extractTextFromImage(file, onProgress) {
  const worker = await window.Tesseract.createWorker("spa", 1, {
    logger: (info) => {
      if (onProgress && info.status === "recognizing text") {
        onProgress(Math.round(info.progress * 100));
      }
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

function editProduct(id, changes) {
  const product = findProduct(id);
  if (!product) return;

  if (typeof changes.name === "string" && changes.name.trim()) {
    product.name = changes.name.trim();
  }
  if (changes.quantity !== undefined) {
    product.quantity = Math.max(1, Math.round(Number(changes.quantity)) || 1);
  }
  if (changes.price !== undefined) {
    product.price = Math.max(0, Number(changes.price) || 0);
  }
  if (typeof changes.category === "string" && changes.category) {
    product.category = changes.category;
  }
  if (typeof changes.priority === "boolean") {
    product.priority = changes.priority;
  }
  if (typeof changes.icon === "string" && changes.icon) {
    product.icon = changes.icon;
  }

  saveToLocalStorage();
  renderProducts();
}

function deleteProduct(id) {
  products = products.filter((p) => p.id !== id);
  saveToLocalStorage();
  renderProducts();
}

/* ==========================================================================
   Sonido al comprar
   ========================================================================== */

// Sintetizado con Web Audio en vez de un archivo de audio: no pesa nada, no
// depende de la red y funciona offline desde el primer segundo.
let audioCtx = null;

function isSoundEnabled() {
  return safeGetItem(SOUND_ENABLED_KEY) !== "false";
}

function setSoundEnabled(enabled) {
  btnSoundToggle.setAttribute("aria-checked", String(enabled));
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch (error) {
    console.error("No se pudo guardar la preferencia de sonido.", error);
  }
}

// "beep": dos notas cortas de onda sine, con un decaimiento rápido para que
// no se sienta invasivo si se marcan o desmarcan varias seguidas.
function playBeepNotes(notes) {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const now = audioCtx.currentTime;
  notes.forEach(({ freq, start, duration }) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  });
}

// Reverb "falsa" (sin archivo de impulso real): ruido blanco que decae
// exponencialmente, que es la receta clásica para simular el eco de un
// cuarto con Web Audio puro. Se arma una sola vez y la comparten arpa y piano.
let synthReverbNode = null;
function getSynthReverb() {
  if (synthReverbNode) return synthReverbNode;
  const duration = 2.2;
  const decay = 3.2;
  const rate = audioCtx.sampleRate;
  const length = Math.round(rate * duration);
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let ch = 0; ch < impulse.numberOfChannels; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  synthReverbNode = audioCtx.createConvolver();
  synthReverbNode.buffer = impulse;
  return synthReverbNode;
}

// "flute": tres osciladores por nota, apenas desafinados entre sí (le da un
// brillo de coro en vez de un tono seco) más un vibrato real: a diferencia
// de una cuerda, un instrumento de viento sí varía la altura mientras suena,
// así que acá el vibrato es fiel al instrumento, no un agregado raro. El
// filtro se mueve mucho menos que antes (de brillante a medio, no a apagado)
// porque una nota soplada no se opaca de golpe como una cuerda que se apaga.
function playFluteNote(freq, startTime, duration, bus) {
  const detunesCents = [-7, 0, 8];

  const noteGain = audioCtx.createGain();
  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.15, startTime + 0.035);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  noteGain.connect(bus);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(freq * 5, startTime);
  filter.frequency.exponentialRampToValueAtTime(freq * 2.5, startTime + duration);
  filter.connect(noteGain);

  const vibrato = audioCtx.createOscillator();
  vibrato.frequency.value = 5;
  const vibratoDepth = audioCtx.createGain();
  vibratoDepth.gain.value = freq * 0.006;
  vibrato.connect(vibratoDepth);
  vibrato.start(startTime);
  vibrato.stop(startTime + duration + 0.05);

  detunesCents.forEach((cents) => {
    const osc = audioCtx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.detune.value = cents;
    vibratoDepth.connect(osc.detune);
    osc.connect(filter);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });
}

function playFluteNotes(notes) {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const now = audioCtx.currentTime;

  const bus = audioCtx.createGain();
  // Medido con OfflineAudioContext contra el beep (-40dB de RMS): sin bajar
  // esto, sumar 3 osciladores por nota sonaba bastante más fuerte.
  bus.gain.value = 0.31;
  bus.connect(audioCtx.destination);

  const wet = audioCtx.createGain();
  wet.gain.value = 0.32;
  bus.connect(wet);
  wet.connect(getSynthReverb()).connect(audioCtx.destination);

  notes.forEach(({ freq, start, duration }) => playFluteNote(freq, now + start, duration, bus));
}

// "harp": el pulsado real que le faltaba a la versión anterior (que en el
// fondo sonaba a flauta metálica). Un chasquido breve y agudo simula la uña
// o el dedo rasgando la cuerda; el cuerpo es un diente de sierra (mucho más
// rico en armónicos que un triangle, así se distingue del piano y de la
// flauta) con un filtro que arranca muy brillante y se apaga rápido, que es
// la firma de una cuerda pulsada. Sin vibrato: una vez que se pulsa, la
// altura de la cuerda queda fija.
function playHarpNote(freq, startTime, duration, bus) {
  const pluck = audioCtx.createBufferSource();
  pluck.buffer = getPianoHammerBuffer();
  const pluckFilter = audioCtx.createBiquadFilter();
  pluckFilter.type = "bandpass";
  pluckFilter.frequency.value = freq * 5;
  pluckFilter.Q.value = 1.2;
  const pluckGain = audioCtx.createGain();
  pluckGain.gain.setValueAtTime(0.05, startTime);
  pluckGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.018);
  pluck.connect(pluckFilter).connect(pluckGain).connect(bus);
  pluck.start(startTime);
  pluck.stop(startTime + 0.03);

  const noteGain = audioCtx.createGain();
  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.9, startTime + 0.004);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  noteGain.connect(bus);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.5;
  filter.frequency.setValueAtTime(freq * 10, startTime);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.4, startTime + duration);
  filter.connect(noteGain);

  [-4, 4].forEach((cents) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = cents;
    osc.connect(filter);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });
}

function playHarpNotes(notes) {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const now = audioCtx.currentTime;

  const bus = audioCtx.createGain();
  // Medido con OfflineAudioContext contra el beep (-40dB de RMS), igual que
  // el resto de los timbres: no es prueba y error a oído.
  bus.gain.value = 0.077;
  bus.connect(audioCtx.destination);

  const wet = audioCtx.createGain();
  wet.gain.value = 0.28;
  bus.connect(wet);
  wet.connect(getSynthReverb()).connect(audioCtx.destination);

  notes.forEach(({ freq, start, duration }) => playHarpNote(freq, now + start, duration, bus));
}

// Ruido cortito para el "golpe" del martillo contra la cuerda: sin él,
// sumar unos armónicos suena a órgano, no a piano. Se genera una sola vez.
let pianoHammerBuffer = null;
function getPianoHammerBuffer() {
  if (pianoHammerBuffer) return pianoHammerBuffer;
  const length = Math.round(audioCtx.sampleRate * 0.05);
  pianoHammerBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = pianoHammerBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return pianoHammerBuffer;
}

// "piano": el golpe percusivo del martillo (un chasquido de ruido filtrado,
// brevísimo) más varios armónicos (1x, 2x, 3x, 4x la frecuencia) con una
// leve "inarmonicidad" — en una cuerda real de piano los armónicos agudos
// quedan un poquito más agudos que un múltiplo exacto, por la rigidez de la
// cuerda — y cada uno se apaga a su propia velocidad: el brillo se va
// primero, el tono grave se sostiene más. Sin vibrato: un piano no tiene,
// la nota queda fija en altura una vez que se toca la tecla.
function playPianoNote(freq, startTime, duration, bus) {
  const hammer = audioCtx.createBufferSource();
  hammer.buffer = getPianoHammerBuffer();
  const hammerFilter = audioCtx.createBiquadFilter();
  hammerFilter.type = "bandpass";
  hammerFilter.frequency.value = freq * 2.5;
  hammerFilter.Q.value = 0.9;
  const hammerGain = audioCtx.createGain();
  hammerGain.gain.setValueAtTime(0.05, startTime);
  hammerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);
  hammer.connect(hammerFilter).connect(hammerGain).connect(bus);
  hammer.start(startTime);
  hammer.stop(startTime + 0.05);

  const partials = [
    { mult: 1, amp: 0.5, inharm: 0, decayMul: 1 },
    { mult: 2, amp: 0.22, inharm: 0.0006, decayMul: 1.7 },
    { mult: 3, amp: 0.12, inharm: 0.0018, decayMul: 2.4 },
    { mult: 4, amp: 0.07, inharm: 0.004, decayMul: 3.2 },
  ];

  partials.forEach(({ mult, amp, inharm, decayMul }) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * mult * (1 + inharm * mult);

    const partialDuration = Math.min(duration, duration / decayMul + 0.18);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(amp, startTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + partialDuration);

    osc.connect(gain).connect(bus);
    osc.start(startTime);
    osc.stop(startTime + partialDuration + 0.05);
  });
}

function playPianoNotes(notes) {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const now = audioCtx.currentTime;

  const bus = audioCtx.createGain();
  // Con 4 armónicos + el golpe del martillo sumados antes de esta ganancia,
  // sin bajarla el piano llegaba casi al techo digital (medido: pico 0.9 y
  // -22 dB de RMS contra -40 dB del beep). 0.12 lo deja parejo con los otros
  // dos sonidos.
  bus.gain.value = 0.12;
  bus.connect(audioCtx.destination);

  const wet = audioCtx.createGain();
  wet.gain.value = 0.16;
  bus.connect(wet);
  wet.connect(getSynthReverb()).connect(audioCtx.destination);

  notes.forEach(({ freq, start, duration }) => playPianoNote(freq, now + start, duration, bus));
}

function playTwoNoteSound(notes, preset) {
  if (!isSoundEnabled()) return;
  try {
    if (preset === "flute") playFluteNotes(notes);
    else if (preset === "harp") playHarpNotes(notes);
    else if (preset === "piano") playPianoNotes(notes);
    else playBeepNotes(notes);
  } catch (error) {
    console.error("No se pudo reproducir el sonido.", error);
  }
}

// Ascendente al comprar (estilo "listo ✓"), descendente al desmarcar (las
// mismas dos notas, al revés) para que se sienta como la acción opuesta.
// Flauta, arpa y piano usan notas bastante más largas que el beep: un
// instrumento real no se apaga de un golpe, y con una superposición chica
// entre las dos se escuchan sonar juntas un instante, como un arpegio real.
const DEFAULT_CHECK_NOTES = [
  { freq: 880, start: 0, duration: 0.09 },
  { freq: 1318.5, start: 0.07, duration: 0.14 },
];
const DEFAULT_UNCHECK_NOTES = [
  { freq: 1318.5, start: 0, duration: 0.09 },
  { freq: 880, start: 0.07, duration: 0.14 },
];
const FLUTE_CHECK_NOTES = [
  { freq: 880, start: 0, duration: 1.1 },
  { freq: 1318.5, start: 0.1, duration: 1.35 },
];
const FLUTE_UNCHECK_NOTES = [
  { freq: 1318.5, start: 0, duration: 1.1 },
  { freq: 880, start: 0.1, duration: 1.35 },
];
const HARP_CHECK_NOTES = [
  { freq: 880, start: 0, duration: 1.1 },
  { freq: 1318.5, start: 0.1, duration: 1.35 },
];
const HARP_UNCHECK_NOTES = [
  { freq: 1318.5, start: 0, duration: 1.1 },
  { freq: 880, start: 0.1, duration: 1.35 },
];
const PIANO_CHECK_NOTES = [
  { freq: 880, start: 0, duration: 1.1 },
  { freq: 1318.5, start: 0.1, duration: 1.35 },
];
const PIANO_UNCHECK_NOTES = [
  { freq: 1318.5, start: 0, duration: 1.1 },
  { freq: 880, start: 0.1, duration: 1.35 },
];

function checkNotesFor(preset) {
  if (preset === "flute") return FLUTE_CHECK_NOTES;
  if (preset === "harp") return HARP_CHECK_NOTES;
  if (preset === "piano") return PIANO_CHECK_NOTES;
  return DEFAULT_CHECK_NOTES;
}

function uncheckNotesFor(preset) {
  if (preset === "flute") return FLUTE_UNCHECK_NOTES;
  if (preset === "harp") return HARP_UNCHECK_NOTES;
  if (preset === "piano") return PIANO_UNCHECK_NOTES;
  return DEFAULT_UNCHECK_NOTES;
}

// Decodifica el data URL guardado (lo mismo que ya se hace con la imagen de
// fondo personalizada, pero para audio) y lo reproduce entero, sin dejarlo
// en caché: son archivos chicos, así que decodificar en cada toque no se
// nota, y evita líos con buffers que algunos navegadores dejan inservibles
// después de la primera decodificación.
function playStoredSound(dataUrl) {
  return new Promise((resolve, reject) => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      audioCtx.decodeAudioData(
        bytes.buffer,
        (buffer) => {
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start();
          resolve();
        },
        reject
      );
    } catch (error) {
      reject(error);
    }
  });
}

function playPurchaseSound() {
  if (!isSoundEnabled()) return;
  const preset = getSoundPreset();
  const custom = safeGetItem(SOUND_CHECK_CUSTOM_KEY);
  if (custom) {
    playStoredSound(custom).catch((error) => {
      console.error("No se pudo reproducir el sonido de tildar, uso el de por defecto.", error);
      playTwoNoteSound(checkNotesFor(preset), preset);
    });
    return;
  }
  playTwoNoteSound(checkNotesFor(preset), preset);
}

function playUnpurchaseSound() {
  if (!isSoundEnabled()) return;
  const preset = getSoundPreset();
  const custom = safeGetItem(SOUND_UNCHECK_CUSTOM_KEY);
  if (custom) {
    playStoredSound(custom).catch((error) => {
      console.error("No se pudo reproducir el sonido de destildar, uso el de por defecto.", error);
      playTwoNoteSound(uncheckNotesFor(preset), preset);
    });
    return;
  }
  playTwoNoteSound(uncheckNotesFor(preset), preset);
}

btnSoundToggle.addEventListener("click", () => {
  setSoundEnabled(btnSoundToggle.getAttribute("aria-checked") !== "true");
});

setSoundEnabled(isSoundEnabled());

/* ==========================================================================
   Vibración al tildar/destildar
   ========================================================================== */

// Solo existe en Android: Safari (y por lo tanto Chrome, Firefox, etc. en
// iOS, que por política de Apple usan el motor de Safari por dentro) nunca
// implementó la Vibration API. El interruptor directamente no se muestra
// donde no serviría de nada.
const canVibrate = "vibrate" in navigator;

function isVibrationEnabled() {
  return canVibrate && safeGetItem(VIBRATION_ENABLED_KEY) === "true";
}

function setVibrationEnabled(enabled) {
  btnVibrationToggle.setAttribute("aria-checked", String(enabled));
  try {
    localStorage.setItem(VIBRATION_ENABLED_KEY, String(enabled));
  } catch (error) {
    console.error("No se pudo guardar la preferencia de vibración.", error);
  }
}

// Un toque cortito al tildar; dos más breves al destildar, el mismo criterio
// "acción opuesta" que ya usan los sonidos.
function vibrateForPurchase() {
  if (!isVibrationEnabled()) return;
  navigator.vibrate(15);
}

function vibrateForUnpurchase() {
  if (!isVibrationEnabled()) return;
  navigator.vibrate([10, 25, 10]);
}

if (canVibrate) {
  vibrationSettingsRow.hidden = false;
  btnVibrationToggle.addEventListener("click", () => {
    setVibrationEnabled(btnVibrationToggle.getAttribute("aria-checked") !== "true");
  });
  setVibrationEnabled(isVibrationEnabled());
}

// Timbre de las dos notas de por defecto: no afecta a un evento (tildar o
// destildar) que ya tenga un sonido propio grabado o cargado.
function getSoundPreset() {
  const saved = safeGetItem(SOUND_PRESET_KEY);
  return saved === "flute" || saved === "harp" || saved === "piano" ? saved : "beep";
}

function refreshSoundPresetButtons() {
  const current = getSoundPreset();
  soundPresetButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.soundPreset === current);
  });
}

function setSoundPreset(preset) {
  try {
    localStorage.setItem(SOUND_PRESET_KEY, preset);
  } catch (error) {
    console.error("No se pudo guardar el timbre del sonido.", error);
  }
  refreshSoundPresetButtons();
}

soundPresetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = btn.dataset.soundPreset;
    setSoundPreset(preset);
    // Suena (y, si está activada, vibra) apenas se elige, así se puede
    // distinguir un timbre de otro sin tener que ir hasta el botón
    // "Escuchar" de cada evento.
    playTwoNoteSound(checkNotesFor(preset), preset);
    vibrateForPurchase();
  });
});

refreshSoundPresetButtons();

/* ==========================================================================
   Sonido personalizado (subir un archivo propio o volver al de por defecto)
   ========================================================================== */

const MAX_SOUND_BYTES = 250 * 1024;

const RECORD_MAX_SECONDS = 5;
const canRecordAudio = Boolean(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

function setupCustomSoundControls({ input, playBtn, recordBtn, resetBtn, statusEl, storageKey, playFn, vibrateFn }) {
  let defaultStatusText = "";
  let mediaRecorder = null;
  let recordTimer = null;

  function refresh() {
    const hasCustom = Boolean(safeGetItem(storageKey));
    resetBtn.hidden = !hasCustom;
    defaultStatusText = hasCustom ? t("sound_custom_status") : "";
    statusEl.textContent = defaultStatusText;
  }

  // Compartido por "subir archivo" y "grabar": lo único que cambia es de
  // dónde sale el data URL con el audio.
  function saveCustomSound(dataUrl) {
    try {
      localStorage.setItem(storageKey, dataUrl);
    } catch (error) {
      console.error("No se pudo guardar el sonido.", error);
      alert(t("alert_sound_too_heavy"));
      return;
    }
    refresh();
  }

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    // El selector de archivos de Android suele reportar el tipo de un audio
    // como vacío o "application/octet-stream" en vez de "audio/algo" (pasaba
    // con archivos elegidos desde "Archivos", no desde una app de música).
    // Ahí se acepta igual si la extensión es de audio conocida, en vez de
    // rechazar el archivo sin explicar bien por qué.
    const looksLikeAudioByType = file.type.startsWith("audio/");
    const looksLikeAudioByName = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|wma|amr|3gp)$/i.test(file.name || "");
    if (!looksLikeAudioByType && !looksLikeAudioByName) {
      alert(t("alert_choose_audio"));
      input.value = "";
      return;
    }
    if (file.size > MAX_SOUND_BYTES) {
      alert(t("alert_sound_too_heavy"));
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      saveCustomSound(reader.result);
      input.value = "";
    };
    reader.onerror = () => {
      alert(t("alert_sound_load_error"));
      input.value = "";
    };
    reader.readAsDataURL(file);
  });

  resetBtn.addEventListener("click", () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("No se pudo restablecer el sonido.", error);
    }
    refresh();
  });

  playBtn.addEventListener("click", () => {
    playFn();
    vibrateFn();
  });

  if (canRecordAudio && recordBtn) {
    recordBtn.hidden = false;

    function stopRecording() {
      clearInterval(recordTimer);
      recordTimer = null;
      recordBtn.classList.remove("btn-recording");
      recordBtn.textContent = t("sound_record_btn");
      if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    }

    recordBtn.addEventListener("click", async () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        stopRecording();
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error("No se pudo acceder al micrófono.", error);
        alert(t("alert_mic_denied"));
        return;
      }

      const chunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      mediaRecorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
        if (blob.size > MAX_SOUND_BYTES) {
          alert(t("alert_sound_too_heavy"));
          statusEl.textContent = defaultStatusText;
          return;
        }
        const reader = new FileReader();
        reader.onload = () => saveCustomSound(reader.result);
        reader.onerror = () => {
          alert(t("alert_sound_load_error"));
          statusEl.textContent = defaultStatusText;
        };
        reader.readAsDataURL(blob);
      });

      mediaRecorder.start();
      recordBtn.classList.add("btn-recording");
      recordBtn.textContent = t("sound_record_stop_btn");

      let remaining = RECORD_MAX_SECONDS;
      statusEl.textContent = t("sound_recording_status", { seconds: remaining });
      recordTimer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          stopRecording();
          return;
        }
        statusEl.textContent = t("sound_recording_status", { seconds: remaining });
      }, 1000);
    });
  }

  refresh();
}

setupCustomSoundControls({
  input: document.getElementById("input-sound-check"),
  playBtn: document.getElementById("btn-sound-check-play"),
  recordBtn: document.getElementById("btn-sound-check-record"),
  resetBtn: document.getElementById("btn-sound-check-reset"),
  statusEl: document.getElementById("sound-check-status"),
  storageKey: SOUND_CHECK_CUSTOM_KEY,
  playFn: playPurchaseSound,
  vibrateFn: vibrateForPurchase,
});

setupCustomSoundControls({
  input: document.getElementById("input-sound-uncheck"),
  playBtn: document.getElementById("btn-sound-uncheck-play"),
  recordBtn: document.getElementById("btn-sound-uncheck-record"),
  resetBtn: document.getElementById("btn-sound-uncheck-reset"),
  statusEl: document.getElementById("sound-uncheck-status"),
  storageKey: SOUND_UNCHECK_CUSTOM_KEY,
  playFn: playUnpurchaseSound,
  vibrateFn: vibrateForUnpurchase,
});

// Se guarda para que el próximo renderProducts() sepa a qué ítem (recién
// creado desde cero, ya que se mueve entre pendientes y comprados) hay que
// agregarle la animación de tildado, en vez de a todos los que se redibujan.
let lastToggledId = null;

function togglePurchased(id) {
  const product = findProduct(id);
  if (!product) return;

  product.purchased = !product.purchased;
  lastToggledId = id;
  if (product.purchased) {
    playPurchaseSound();
    vibrateForPurchase();
  } else {
    playUnpurchaseSound();
    vibrateForUnpurchase();
  }
  saveToLocalStorage();
  renderProducts();
}

function clearPurchased() {
  const hasPurchased = products.some((p) => p.purchased);
  if (!hasPurchased) return;

  products = products.filter((p) => !p.purchased);
  saveToLocalStorage();
  renderProducts();
}

function uncheckAll() {
  products.forEach((p) => (p.purchased = false));
  saveToLocalStorage();
  renderProducts();
}

function clearAllProducts() {
  products = [];
  saveToLocalStorage();
  renderProducts();
}

/* ==========================================================================
   Filtros y cálculos
   ========================================================================== */

function filterProducts(list, filter) {
  switch (filter) {
    case "pending":
      return list.filter((p) => !p.purchased);
    case "purchased":
      return list.filter((p) => p.purchased);
    default:
      return list;
  }
}

function searchProducts(list, query) {
  const trimmed = query.trim();
  if (!trimmed) return list;
  const normalizedQuery = normalizeText(trimmed);
  return list.filter((p) => normalizeText(p.name).includes(normalizedQuery));
}

function sortByPriority(list) {
  return [...list].sort((a, b) => Number(b.priority) - Number(a.priority));
}

function filterByCategory(list, category) {
  if (!category) return list;
  return list.filter((p) => p.category === category);
}

function filterByPriorityOnly(list, onlyPriority) {
  if (!onlyPriority) return list;
  return list.filter((p) => p.priority);
}

function sortByPrice(list, order) {
  if (!order) return list;
  return [...list].sort((a, b) => (order === "desc" ? b.price - a.price : a.price - b.price));
}

function hasActiveExtraFilters() {
  return (
    Boolean(searchQuery.trim()) ||
    Boolean(filterCategory) ||
    filterPriorityOnly ||
    sortPriceOrder !== null
  );
}

function calculateTotals() {
  const pending = products.filter((p) => !p.purchased).length;
  const purchased = products.filter((p) => p.purchased).length;
  const count = products.length;
  const pendingTotal = products.reduce(
    (sum, p) => sum + (p.purchased ? 0 : p.quantity * p.price),
    0
  );
  const purchasedTotal = products.reduce(
    (sum, p) => sum + (p.purchased ? p.quantity * p.price : 0),
    0
  );

  return { pending, purchased, count, pendingTotal, purchasedTotal };
}

/* ==========================================================================
   Render
   ========================================================================== */

function pulseIfChanged(el, newText) {
  if (el.textContent && el.textContent !== newText) {
    el.classList.remove("pulse");
    void el.offsetWidth; // reinicia la animación si ya estaba corriendo
    el.classList.add("pulse");
  }
  el.textContent = newText;
}

function renderSummary() {
  const { pending, purchased, count, pendingTotal, purchasedTotal } = calculateTotals();

  summaryPendingEl.textContent = pending;
  summaryPurchasedEl.textContent = purchased;
  summaryCountEl.textContent = count;
  pulseIfChanged(summaryTotalEl, formatCurrency(pendingTotal));
  pulseIfChanged(summarySpentEl, formatCurrency(purchasedTotal));
}

function createProductElement(product) {
  const fragment = itemTemplate.content.cloneNode(true);
  const li = fragment.querySelector(".product-item");

  li.dataset.id = product.id;
  li.classList.toggle("purchased", product.purchased);

  const checkbox = li.querySelector(".chk-purchased");
  checkbox.checked = product.purchased;

  if (product.id === lastToggledId) {
    li.querySelector(".checkbox-visual").classList.add(product.purchased ? "just-checked" : "just-unchecked");
    lastToggledId = null;
  }

  renderIconInto(li.querySelector(".product-icon"), product.icon || getProductIcon(product.name));
  li.querySelector(".product-qty-display").textContent = product.quantity;
  li.querySelector(".priority-badge").textContent = product.priority ? "⭐" : "";
  li.querySelector(".product-name").textContent = product.name;
  li.querySelector(".product-total").textContent = formatCurrency(
    product.quantity * product.price
  );

  const editForm = li.querySelector(".product-edit");
  li.querySelector(".edit-name").value = product.name;
  li.querySelector(".edit-quantity").value = product.quantity;
  li.querySelector(".edit-price").value = product.price || "";
  li.querySelector(".edit-category").value = product.category;
  li.querySelector(".edit-priority").checked = product.priority;

  const editIconPreview = li.querySelector(".edit-icon-preview");
  const editIconPickerSlot = li.querySelector(".edit-icon-picker-slot");
  let editIcon = product.icon || getProductIcon(product.name);
  renderIconInto(editIconPreview, editIcon);

  editIconPreview.addEventListener("click", () => {
    toggleIconPicker(editIconPreview, editIconPickerSlot, (icon) => {
      editIcon = icon;
      renderIconInto(editIconPreview, icon);
    });
  });

  const editQuantityInput = li.querySelector(".edit-quantity");

  li.querySelector(".edit-qty-minus").addEventListener("click", () => {
    editQuantityInput.value = Math.max(1, (parseInt(editQuantityInput.value, 10) || 1) - 1);
  });
  li.querySelector(".edit-qty-plus").addEventListener("click", () => {
    editQuantityInput.value = (parseInt(editQuantityInput.value, 10) || 1) + 1;
  });

  // Eventos
  checkbox.addEventListener("change", () => togglePurchased(product.id));

  const openEdit = () => {
    const view = li.querySelector(".product-view");
    view.hidden = true;
    editForm.hidden = false;
    editIcon = product.icon || getProductIcon(product.name);
    renderIconInto(editIconPreview, editIcon);
    li.querySelector(".edit-name").focus();
  };

  li.querySelector(".product-view").addEventListener("click", (event) => {
    if (event.target.closest(".checkbox-wrap")) return;
    openEdit();
  });

  li.querySelector(".btn-cancel-edit").addEventListener("click", () => {
    editForm.hidden = true;
    li.querySelector(".product-view").hidden = false;
    closeIconPicker(editIconPickerSlot, editIconPreview);
  });

  li.querySelector(".btn-delete").addEventListener("click", () => {
    if (confirm(t("confirm_delete_product", { name: product.name }))) {
      deleteProduct(product.id);
    }
  });

  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    editProduct(product.id, {
      name: li.querySelector(".edit-name").value,
      quantity: li.querySelector(".edit-quantity").value,
      price: li.querySelector(".edit-price").value,
      category: li.querySelector(".edit-category").value,
      priority: li.querySelector(".edit-priority").checked,
      icon: editIcon,
    });
  });

  return li;
}

function renderList(listEl, list) {
  listEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  list.forEach((product) => {
    fragment.appendChild(createProductElement(product));
  });
  listEl.appendChild(fragment);
}

function applyListFilters(list) {
  let result = searchProducts(list, searchQuery);
  result = filterByCategory(result, filterCategory);
  result = filterByPriorityOnly(result, filterPriorityOnly);
  return sortPriceOrder ? sortByPrice(result, sortPriceOrder) : sortByPriority(result);
}

function renderProducts() {
  const pendingItems = applyListFilters(filterProducts(products, "pending"));
  const purchasedItems = applyListFilters(filterProducts(products, "purchased"));

  renderList(pendingListEl, pendingItems);
  renderList(purchasedListEl, purchasedItems);

  pendingGroupEl.hidden = pendingItems.length === 0;
  purchasedGroupEl.hidden = purchasedItems.length === 0;

  purchasedTitleEl.hidden = purchasedItems.length === 0;
  purchasedTitleEl.textContent = t("purchased_title", { count: purchasedItems.length });

  const visibleCount = pendingItems.length + purchasedItems.length;
  emptyMessageEl.hidden = visibleCount > 0;
  emptyMessageEl.textContent = hasActiveExtraFilters()
    ? t("empty_no_filtered")
    : t("empty_no_products");

  btnToggleFilters.classList.toggle(
    "active",
    Boolean(filterCategory) || filterPriorityOnly || sortPriceOrder !== null
  );

  renderSummary();
}

/* ==========================================================================
   Eventos generales
   ========================================================================== */

btnShowAddForm.addEventListener("click", () => {
  btnShowAddForm.hidden = true;
  addForm.hidden = false;
  inputName.focus();
});

btnCancelAdd.addEventListener("click", () => {
  addForm.hidden = true;
  btnShowAddForm.hidden = false;
  addForm.reset();
  inputQuantity.value = 1;
  manualIcon = null;
  inputIconPreview.textContent = DEFAULT_ICON;
  closeIconPicker(addIconPickerSlot, inputIconPreview);
});

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addProduct(inputName.value, inputQuantity.value, inputPrice.value, manualIcon);
  addForm.reset();
  inputQuantity.value = 1;
  manualIcon = null;
  inputIconPreview.textContent = DEFAULT_ICON;
  closeIconPicker(addIconPickerSlot, inputIconPreview);
  inputName.focus();
});

inputName.addEventListener("input", () => {
  if (manualIcon) return;
  inputIconPreview.textContent = inputName.value.trim()
    ? getProductIcon(inputName.value)
    : DEFAULT_ICON;
});

inputIconPreview.addEventListener("click", () => {
  toggleIconPicker(inputIconPreview, addIconPickerSlot, (icon) => {
    manualIcon = icon;
    renderIconInto(inputIconPreview, icon);
  });
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value;
  renderProducts();
});

btnThemeToggle.addEventListener("click", () => {
  setTheme(getEffectiveTheme() === "dark" ? "light" : "dark");
});

function openSettings() {
  settingsBackdrop.hidden = false;
  btnSettingsToggle.setAttribute("aria-expanded", "true");
}

function closeSettings() {
  settingsBackdrop.hidden = true;
  btnSettingsToggle.setAttribute("aria-expanded", "false");
}

btnSettingsToggle.addEventListener("click", () => {
  if (settingsBackdrop.hidden) {
    openSettings();
  } else {
    closeSettings();
  }
});

btnSettingsClose.addEventListener("click", closeSettings);

settingsBackdrop.addEventListener("click", (event) => {
  if (event.target === settingsBackdrop) closeSettings();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !settingsBackdrop.hidden) closeSettings();
});

function renderLangOptions() {
  langOptionsEl.innerHTML = "";
  LANGUAGES.forEach((lang) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-option";
    btn.classList.toggle("active", lang.code === currentLang);
    btn.innerHTML = `<span class="lang-option-flag">${lang.flag}</span><span>${lang.nativeName}</span>`;
    btn.addEventListener("click", () => {
      setLang(lang.code);
      closeLangModal();
    });
    langOptionsEl.appendChild(btn);
  });
}

function openLangModal() {
  renderLangOptions();
  langBackdrop.hidden = false;
  btnLangToggle.setAttribute("aria-expanded", "true");
}

function closeLangModal() {
  langBackdrop.hidden = true;
  btnLangToggle.setAttribute("aria-expanded", "false");
}

btnLangToggle.addEventListener("click", () => {
  if (langBackdrop.hidden) {
    openLangModal();
  } else {
    closeLangModal();
  }
});

btnLangClose.addEventListener("click", closeLangModal);

langBackdrop.addEventListener("click", (event) => {
  if (event.target === langBackdrop) closeLangModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !langBackdrop.hidden) closeLangModal();
});

// Se llama cada vez que cambia el idioma: vuelve a pintar todo lo que
// depende del idioma pero no es texto estático (aria-labels dinámicos,
// paleta, resumen, botón de ordenar, etc.).
function onLanguageChanged() {
  updateThemeToggleButton();
  renderPaletteRow();
  updateBgImageButtons(getSavedBgImageChoice());
  updateSortPriceButton();
  renderProducts();
  updateOnboardingNextLabel();
}

function openSupportModal() {
  supportBackdrop.hidden = false;
}

function closeSupportModal() {
  supportBackdrop.hidden = true;
}

btnSupportProject.addEventListener("click", openSupportModal);
btnFooterSupport.addEventListener("click", openSupportModal);
btnSupportClose.addEventListener("click", closeSupportModal);

supportBackdrop.addEventListener("click", (event) => {
  if (event.target === supportBackdrop) closeSupportModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !supportBackdrop.hidden) closeSupportModal();
});

// Tutorial de bienvenida: se muestra solo la primera vez (justo después del
// splash), y queda disponible para volver a verlo desde Ajustes.
const ONBOARDING_TOTAL_STEPS = onboardingStepEls.length;
let onboardingStepIndex = 1;

function hasSeenOnboarding() {
  return safeGetItem(ONBOARDING_SEEN_KEY) === "true";
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  } catch (error) {
    console.error("No se pudo guardar que ya viste el tutorial.", error);
  }
}

function updateOnboardingNextLabel() {
  const isLastStep = onboardingStepIndex === ONBOARDING_TOTAL_STEPS;
  btnOnboardingNext.textContent = t(isLastStep ? "onboarding_finish_btn" : "onboarding_next_btn");
}

function renderOnboardingStep() {
  onboardingStepEls.forEach((el) => {
    el.classList.toggle("is-active", Number(el.dataset.step) === onboardingStepIndex);
  });
  onboardingDotEls.forEach((el) => {
    el.classList.toggle("is-active", Number(el.dataset.dot) === onboardingStepIndex);
  });
  btnOnboardingBack.hidden = onboardingStepIndex === 1;
  btnOnboardingSkip.hidden = onboardingStepIndex === ONBOARDING_TOTAL_STEPS;
  updateOnboardingNextLabel();
}

function openOnboarding() {
  onboardingStepIndex = 1;
  renderOnboardingStep();
  onboardingBackdrop.hidden = false;
}

function closeOnboarding() {
  onboardingBackdrop.hidden = true;
  markOnboardingSeen();
}

btnOnboardingNext.addEventListener("click", () => {
  if (onboardingStepIndex === ONBOARDING_TOTAL_STEPS) {
    closeOnboarding();
    return;
  }
  onboardingStepIndex += 1;
  renderOnboardingStep();
});

btnOnboardingBack.addEventListener("click", () => {
  if (onboardingStepIndex === 1) return;
  onboardingStepIndex -= 1;
  renderOnboardingStep();
});

btnOnboardingSkip.addEventListener("click", closeOnboarding);
btnOnboardingClose.addEventListener("click", closeOnboarding);

btnOnboardingReplay.addEventListener("click", () => {
  closeSettings();
  openOnboarding();
});

onboardingBackdrop.addEventListener("click", (event) => {
  if (event.target === onboardingBackdrop) closeOnboarding();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !onboardingBackdrop.hidden) closeOnboarding();
});

// El link de donación queda listo para cuando exista BRAND.donationUrl:
// mientras esté vacío, el botón se deshabilita en vez de apuntar a nada.
if (BRAND.donationUrl) {
  btnDonate.addEventListener("click", () => {
    window.open(BRAND.donationUrl, "_blank", "noopener");
  });
} else {
  btnDonate.disabled = true;
  donateStatus.textContent = t("donate_not_available");
}

// Igual que arriba: "Más herramientas" se activa solo cuando haya
// BRAND.websiteUrl; hasta entonces queda como texto simple, no clickeable.
if (BRAND.websiteUrl) {
  const websiteLink = document.createElement("a");
  websiteLink.href = BRAND.websiteUrl;
  websiteLink.target = "_blank";
  websiteLink.rel = "noopener";
  websiteLink.className = "app-footer-link";
  // Conserva la traducción: al reemplazar el <span> se perdía el data-i18n y
  // el link quedaba en inglés en todos los idiomas.
  websiteLink.dataset.i18n = "footer_more_tools";
  websiteLink.textContent = t("footer_more_tools");
  footerMoreTools.replaceWith(websiteLink);
}

/* ==========================================================================
   Instalar como app (PWA)
   ========================================================================== */

let deferredInstallPrompt = null;

function isRunningStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function updateInstallButtonVisibility() {
  btnInstallApp.hidden = isRunningStandalone();
}

// A diferencia de Android/Chrome de escritorio, iOS no deja instalar por
// código: el camino cambia según el navegador (en Chrome para iOS "Añadir a
// pantalla de inicio" está en un menú distinto al de Safari, no detrás del
// mismo botón Compartir). Para no mezclar navegadores en un solo texto con
// pasos condicionales ("si no ves la opción..."), cada combinación real
// tiene su propia lista de pasos exactos, sin nada que adivinar.
function detectInstallPlatform() {
  const ua = navigator.userAgent || "";
  const isIOSDevice = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isChromeIOS = /CriOS/i.test(ua);
  const isFirefoxIOS = /FxiOS/i.test(ua);
  const isEdgeIOS = /EdgiOS/i.test(ua);
  const isMacDesktop = /Macintosh/i.test(ua) && !isIOSDevice;
  const isChromeOrEdgeOrFirefox = /Chrome\/|Edg\/|Firefox\//i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isIOSDevice) {
    if (isChromeIOS) return "ios-chrome";
    if (isFirefoxIOS || isEdgeIOS) return "ios-other";
    return "ios-safari";
  }
  if (isMacDesktop && !isChromeOrEdgeOrFirefox) return "mac-safari";
  if (isAndroid) return "android-menu";
  return "desktop-other";
}

function openInstallModal() {
  installStepsEl.hidden = true;
  installChromeIosStepsEl.hidden = true;
  installMacSafariStepsEl.hidden = true;
  installInstructionsEl.hidden = true;
  btnInstallConfirm.hidden = true;

  if (deferredInstallPrompt) {
    installInstructionsEl.hidden = false;
    installInstructionsEl.textContent = t("install_desc_direct");
    btnInstallConfirm.hidden = false;
    installBackdrop.hidden = false;
    return;
  }

  const platform = detectInstallPlatform();
  const stepsEl = { "ios-safari": installStepsEl, "ios-chrome": installChromeIosStepsEl, "mac-safari": installMacSafariStepsEl }[platform];
  if (stepsEl) {
    stepsEl.hidden = false;
  } else {
    installInstructionsEl.hidden = false;
    const msgKey = { "ios-other": "install_ios_other_msg", "android-menu": "install_android_menu_msg" }[platform] || "install_desktop_other_msg";
    installInstructionsEl.textContent = t(msgKey);
  }
  installBackdrop.hidden = false;
}

function closeInstallModal() {
  installBackdrop.hidden = true;
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButtonVisibility();
});

// Después de aceptar el cuadro del navegador, la instalación en sí puede
// tardar hasta un minuto (en Android Chrome arma la app en los servidores de
// Google) sin que se vea nada. Este aviso queda fijo hasta que llega
// "appinstalled", para que nadie cierre pensando que se colgó.
const INSTALL_PROGRESS_MAX_MS = 120000;
let installProgressTimer = null;

function showInstallProgress() {
  clearTimeout(installProgressTimer);
  installProgressText.textContent = t("installing_text");
  installProgressEl.classList.remove("is-done");
  installProgressEl.hidden = false;
  installProgressTimer = setTimeout(hideInstallProgress, INSTALL_PROGRESS_MAX_MS);
}

function hideInstallProgress() {
  clearTimeout(installProgressTimer);
  installProgressEl.hidden = true;
}

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallButtonVisibility();
  if (!installProgressEl.hidden) {
    clearTimeout(installProgressTimer);
    installProgressText.textContent = t("install_done_text");
    installProgressEl.classList.add("is-done");
    installProgressTimer = setTimeout(hideInstallProgress, 6000);
  }
});

btnInstallApp.addEventListener("click", openInstallModal);

btnInstallConfirm.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    // Esto solo pasa si el prompt nativo desapareció justo entre mostrar el
    // botón y tocarlo (Android o escritorio Chrome/Edge, únicos casos donde
    // se llega a ver este botón): el menú del navegador es el respaldo.
    installInstructionsEl.textContent = t("install_android_menu_msg");
    btnInstallConfirm.hidden = true;
    return;
  }
  const promptEvent = deferredInstallPrompt;
  closeInstallModal();
  // El aviso sale ya al tocar "Instalar": en algunos celulares el cuadro del
  // navegador tarda en aparecer y sin nada en pantalla parece que no pasó nada.
  showInstallProgress();
  promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  deferredInstallPrompt = null;
  if (!choice || choice.outcome !== "accepted") hideInstallProgress();
  updateInstallButtonVisibility();
});

btnInstallClose.addEventListener("click", closeInstallModal);

installBackdrop.addEventListener("click", (event) => {
  if (event.target === installBackdrop) closeInstallModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !installBackdrop.hidden) closeInstallModal();
});

updateInstallButtonVisibility();

/* ==========================================================================
   Toast (aviso corto que aparece y se esconde solo)
   ========================================================================== */

function showToast(message) {
  clearTimeout(toastHideTimer);
  toastEl.textContent = message;
  toastEl.hidden = false;
  // El reflow entre sacar [hidden] y agregar la clase es necesario para que
  // la transición de opacidad/transform se vea: si se agregan juntos el
  // navegador no anima el cambio.
  toastEl.getBoundingClientRect();
  toastEl.classList.add("is-visible");
  toastHideTimer = setTimeout(() => {
    toastEl.classList.remove("is-visible");
    setTimeout(() => {
      toastEl.hidden = true;
    }, 200);
  }, 2400);
}

/* ==========================================================================
   Compartir la app
   ========================================================================== */

// El link que se comparte apunta siempre a la página de Neko Tools (sección
// de Neko Lista), nunca directo a la app: así quien lo recibe pasa primero
// por ahí, sea que lo compartan desde el celular con la app instalada o
// desde el navegador.
btnShareApp.addEventListener("click", async () => {
  const shareData = {
    title: BRAND.appName,
    text: t("share_text"),
    url: BRAND.shareUrl,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      // Cerrar el diálogo nativo no es un error; cualquier otra falla del
      // share nativo cae al copiado del link de abajo.
      if (error && error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(BRAND.shareUrl);
    showToast(t("share_toast_copied"));
  } catch (error) {
    window.prompt(t("share_copy_manual"), BRAND.shareUrl);
  }
});

if ("serviceWorker" in navigator) {
  // Si ya había un controller al cargar, cualquier "controllerchange"
  // posterior es una actualización real reemplazando esa versión vieja.
  // Si NO había controller (primera visita, todavía sin service worker),
  // el controllerchange que sigue es solo la instalación inicial tomando
  // control por primera vez, no una actualización: recargar ahí cortaría
  // el splash de bienvenida a la mitad sin ningún motivo real.
  const hadControllerOnLoad = Boolean(navigator.serviceWorker.controller);

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.error("No se pudo registrar el service worker.", error);
    });
  });

  // Cuando se publica una versión nueva, el navegador instala el service
  // worker actualizado en segundo plano; en cuanto toma el control (esto
  // dispara "controllerchange"), recargamos una sola vez para mostrarla,
  // en vez de dejar a quien esté usando la app pegado en la versión vieja.
  let reloadedForNewVersion = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadControllerOnLoad) return;
    if (reloadedForNewVersion) return;
    reloadedForNewVersion = true;
    window.location.reload();
  });
}

ioTabButtons.forEach((tab) => {
  tab.addEventListener("click", () => {
    const isActive = tab.classList.contains("active");
    ioTabButtons.forEach((btn) => btn.classList.remove("active"));
    ioPanels.forEach((panel) => {
      panel.hidden = true;
    });
    if (!isActive) {
      tab.classList.add("active");
      document.querySelector(`.io-panel[data-io-panel="${tab.dataset.ioTab}"]`).hidden = false;
    }
  });
});

themeOptionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setTheme(btn.dataset.themeChoice);
  });
});

btnExportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const today = new Date().toISOString().slice(0, 10);
  link.download = `lista-de-compras-${today}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

inputImportData.addEventListener("change", () => {
  const file = inputImportData.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (error) {
      alert(t("alert_invalid_json"));
      inputImportData.value = "";
      return;
    }

    const cleaned = sanitizeProductList(parsed);
    if (!Array.isArray(parsed) || (parsed.length > 0 && cleaned.length === 0)) {
      alert(t("alert_invalid_format"));
      inputImportData.value = "";
      return;
    }

    if (confirm(t("confirm_replace_list", { count: cleaned.length }))) {
      products = cleaned;
      saveToLocalStorage();
      mergeNewCatalogProducts();
      renderProducts();
    }
    inputImportData.value = "";
  };
  reader.readAsText(file);
});

// Código en vivo: en vez de explicar que "vale 15 minutos y se usa una vez",
// la app lo muestra pasando: un anillo que se vacía, y en cuanto el otro
// dispositivo lo recibe se pregunta al servidor (sin consumirlo) y aparece la
// confirmación de que ya se borró. Si dice "recibida" y no fuiste vos, se nota.
const CODE_POLL_MS = 5000;
const CODE_RING_LENGTH = 119.4; // 2 * PI * r (r = 19 en el SVG)
const codeRingProgress = document.getElementById("code-ring-progress");
const codeLiveStatus = document.getElementById("code-live-status");
let codeWatch = null;

function formatCodeTime(totalSeconds) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function stopCodeWatch() {
  if (!codeWatch) return;
  clearInterval(codeWatch.tick);
  clearInterval(codeWatch.poll);
  codeWatch = null;
}

function setCodeState(state) {
  generatedCodeBox.dataset.state = state;
  if (state === "used") codeLiveStatus.textContent = t("code_live_used");
  if (state === "expired") codeLiveStatus.textContent = t("code_live_expired");
}

function renderCodeCountdown() {
  if (!codeWatch) return;
  const remaining = (codeWatch.expiresAt - Date.now()) / 1000;
  if (remaining <= 0) {
    codeRingProgress.style.strokeDashoffset = String(CODE_RING_LENGTH);
    setCodeState("expired");
    stopCodeWatch();
    return;
  }
  const spent = 1 - remaining / codeWatch.total;
  codeRingProgress.style.strokeDashoffset = String(CODE_RING_LENGTH * spent);
  codeLiveStatus.textContent = t("code_live_waiting", { time: formatCodeTime(remaining) });
}

async function checkCodeStillActive() {
  const watch = codeWatch;
  if (!watch || document.hidden) return;
  try {
    const response = await fetch(`${TRANSFER_API_URL}?check=${encodeURIComponent(watch.code)}`);
    const result = await response.json();
    // Se generó otro código mientras esperaba la respuesta: esta ya no vale.
    if (codeWatch !== watch) return;
    if (!response.ok || !result.ok || result.active !== false) return;
    // Ya no existe en el servidor: si todavía quedaba tiempo, lo usaron.
    const remaining = (watch.expiresAt - Date.now()) / 1000;
    stopCodeWatch();
    setCodeState(remaining > 10 ? "used" : "expired");
  } catch (error) {
    // Sin conexión un momento: se reintenta en la próxima vuelta.
  }
}

function startCodeWatch(code, ttlSeconds) {
  stopCodeWatch();
  codeRingProgress.style.strokeDashoffset = "0";
  generatedCodeBox.dataset.state = "waiting";
  codeWatch = {
    code,
    total: ttlSeconds,
    expiresAt: Date.now() + ttlSeconds * 1000,
    tick: setInterval(renderCodeCountdown, 1000),
    poll: setInterval(checkCodeStillActive, CODE_POLL_MS),
  };
  renderCodeCountdown();
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkCodeStillActive();
});

// Puente por código: manda/trae la lista a través de transfer.php en
// nekotools.site, sin cuenta ni archivos. Ver README para el detalle del
// endpoint (código corto, un solo uso, vence solo a los 15 minutos).
btnGenerateCode.addEventListener("click", async () => {
  if (products.length === 0) {
    generateCodeStatus.textContent = t("status_no_products_export");
    generatedCodeBox.hidden = true;
    stopCodeWatch();
    return;
  }

  btnGenerateCode.disabled = true;
  generateCodeStatus.textContent = t("code_status_generating");
  generatedCodeBox.hidden = true;
  stopCodeWatch();

  try {
    const response = await fetch(TRANSFER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: products }),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) throw new Error(result.error || "request_failed");

    generatedCodeValue.textContent = result.code;
    generatedCodeBox.hidden = false;
    generateCodeStatus.textContent = "";
    startCodeWatch(result.code, Number(result.ttlSeconds) || 900);
  } catch (error) {
    console.error("No se pudo generar el código de transferencia.", error);
    generateCodeStatus.textContent = t("code_status_error_generate");
  } finally {
    btnGenerateCode.disabled = false;
  }
});

btnReceiveCode.addEventListener("click", async () => {
  const code = inputReceiveCode.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    receiveCodeStatus.textContent = t("code_status_error_invalid");
    return;
  }

  btnReceiveCode.disabled = true;
  receiveCodeStatus.textContent = t("code_status_receiving");

  try {
    const response = await fetch(`${TRANSFER_API_URL}?code=${encodeURIComponent(code)}`);
    const result = await response.json();

    if (!response.ok || !result.ok || !Array.isArray(result.data)) {
      throw new Error(result.error || "request_failed");
    }

    const cleaned = sanitizeProductList(result.data);
    if (result.data.length > 0 && cleaned.length === 0) throw new Error("invalid_data");

    if (confirm(t("confirm_replace_list", { count: cleaned.length }))) {
      products = cleaned;
      saveToLocalStorage();
      mergeNewCatalogProducts();
      renderProducts();
      receiveCodeStatus.textContent = t("code_received_ok");
      inputReceiveCode.value = "";
    } else {
      receiveCodeStatus.textContent = "";
    }
  } catch (error) {
    console.error("No se pudo traer la lista por código.", error);
    receiveCodeStatus.textContent = t("code_status_error_receive");
  } finally {
    btnReceiveCode.disabled = false;
  }
});

inputReceiveCode.addEventListener("input", () => {
  inputReceiveCode.value = inputReceiveCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

inputReceiveCode.addEventListener("keydown", (event) => {
  if (event.key === "Enter") btnReceiveCode.click();
});

btnCopyListText.addEventListener("click", async () => {
  const text = buildListText();
  pasteListTextarea.value = text;

  if (!text) {
    pasteListStatus.textContent = t("status_no_products_copy");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    pasteListStatus.textContent = t("status_copied");
  } catch (error) {
    pasteListStatus.textContent = t("status_copy_manual");
  }
});

btnCreateFromText.addEventListener("click", () => {
  const text = pasteListTextarea.value;
  if (!text.trim()) {
    pasteListStatus.textContent = t("status_paste_empty");
    return;
  }

  const { added, skipped } = addProductsFromText(text);
  if (added === 0 && skipped === 0) {
    pasteListStatus.textContent = t("status_no_products_recognized_text");
  } else {
    let message = t("status_products_added", { count: added });
    if (skipped > 0) {
      message += ` (${t("status_already_in_list", { count: skipped })})`;
    }
    pasteListStatus.textContent = message;
  }
});

btnExportPdf.addEventListener("click", async () => {
  if (!products.length) {
    pdfStatus.textContent = t("status_no_products_export");
    return;
  }
  pdfStatus.textContent = t("status_generating_pdf");
  try {
    await ensureJsPdfLoaded();
    exportListAsPdf();
    pdfStatus.textContent = t("status_pdf_downloaded");
  } catch (error) {
    console.error("No se pudo generar el PDF.", error);
    pdfStatus.textContent = t("status_pdf_error");
  }
});

inputImportPdf.addEventListener("change", async () => {
  const file = inputImportPdf.files[0];
  if (!file) return;

  pdfStatus.textContent = t("status_reading_pdf");
  try {
    await ensurePdfJsLoaded();
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPdf(arrayBuffer);
    const { added, skipped } = addProductsFromText(stripPdfBoilerplate(text));
    if (added === 0 && skipped === 0) {
      pdfStatus.textContent = t("status_no_products_recognized_pdf");
    } else {
      let message = t("status_products_added", { count: added });
      if (skipped > 0) message += ` (${t("status_already_in_list", { count: skipped })})`;
      pdfStatus.textContent = message;
    }
  } catch (error) {
    console.error("No se pudo leer el PDF.", error);
    pdfStatus.textContent = t("status_pdf_read_error");
  }
  inputImportPdf.value = "";
});

btnExportImage.addEventListener("click", async () => {
  if (!products.length) {
    imageStatus.textContent = t("status_no_products_export");
    return;
  }
  imageStatus.textContent = t("status_generating_image");
  try {
    await exportListAsImage();
    imageStatus.textContent = t("status_image_downloaded");
  } catch (error) {
    console.error("No se pudo generar la imagen.", error);
    imageStatus.textContent = t("status_image_error");
  }
});

inputImportImage.addEventListener("change", async () => {
  const file = inputImportImage.files[0];
  if (!file) return;

  imageStatus.textContent = t("status_loading_ocr");
  try {
    await ensureTesseractLoaded();
    imageStatus.textContent = t("status_reading_photo", { percent: 0 });
    const text = await extractTextFromImage(file, (percent) => {
      imageStatus.textContent = t("status_reading_photo", { percent });
    });
    const { added, skipped } = addProductsFromText(text);
    if (added === 0 && skipped === 0) {
      imageStatus.textContent = t("status_no_products_recognized_photo");
    } else {
      let message = t("status_products_added", { count: added });
      if (skipped > 0) message += ` (${t("status_already_in_list", { count: skipped })})`;
      message += t("status_review_ocr_results");
      imageStatus.textContent = message;
    }
  } catch (error) {
    console.error("No se pudo leer la imagen.", error);
    imageStatus.textContent = t("status_photo_read_error");
  }
  inputImportImage.value = "";
});

inputBgColor.addEventListener("input", () => {
  const color = inputBgColor.value;
  applyBgColor(color);
  try {
    localStorage.setItem(BG_COLOR_KEY, color);
  } catch (error) {
    console.error("No se pudo guardar el color de fondo.", error);
  }

  // Una imagen de fondo es opaca y tapa el color por completo, así que un
  // color elegido a mano no se vería con la imagen puesta: la sacamos.
  if (getSavedBgImageChoice() !== "none") {
    try {
      localStorage.setItem(BG_IMAGE_CHOICE_KEY, "none");
    } catch (error) {
      console.error("No se pudo guardar la preferencia de imagen de fondo.", error);
    }
    applyBackgroundImage();
  }
});

btnResetBg.addEventListener("click", () => {
  applyBgColor(null);
  try {
    localStorage.removeItem(BG_COLOR_KEY);
  } catch (error) {
    console.error("No se pudo restablecer el color de fondo.", error);
  }
  refreshBgColorInput();
});

bgImageOptionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const choice = btn.dataset.bgChoice;
    try {
      localStorage.setItem(BG_IMAGE_CHOICE_KEY, choice);
    } catch (error) {
      console.error("No se pudo guardar la preferencia de imagen de fondo.", error);
    }

    // Simétrico a lo de arriba: un color de fondo guardado se mezcla con el
    // patrón (blend-mode) y puede terminar "tapándolo" según el color, así
    // que al elegir una imagen sacamos el color para que se vea como se
    // espera, sin restos de una elección anterior.
    if (choice !== "none") {
      try {
        localStorage.removeItem(BG_COLOR_KEY);
      } catch (error) {
        console.error("No se pudo restablecer el color de fondo.", error);
      }
      applyBgColor(null);
      refreshBgColorInput();
    }

    applyBackgroundImage();
  });
});

inputBgImage.addEventListener("change", () => {
  const file = inputBgImage.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert(t("alert_choose_image"));
    inputBgImage.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

      try {
        localStorage.setItem(BG_IMAGE_CUSTOM_KEY, dataUrl);
        localStorage.setItem(BG_IMAGE_CHOICE_KEY, "custom");
        localStorage.removeItem(BG_COLOR_KEY);
      } catch (error) {
        console.error("No se pudo guardar la imagen de fondo.", error);
        alert(t("alert_image_too_heavy"));
        inputBgImage.value = "";
        return;
      }
      applyBgColor(null);
      refreshBgColorInput();
      applyBackgroundImage();
      inputBgImage.value = "";
    };
    img.onerror = () => {
      alert(t("alert_image_load_error"));
      inputBgImage.value = "";
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function openFiltersModal() {
  filtersBackdrop.hidden = false;
  btnToggleFilters.setAttribute("aria-expanded", "true");
}

function closeFiltersModal() {
  filtersBackdrop.hidden = true;
  btnToggleFilters.setAttribute("aria-expanded", "false");
}

btnToggleFilters.addEventListener("click", () => {
  if (filtersBackdrop.hidden) openFiltersModal();
  else closeFiltersModal();
});

btnFiltersClose.addEventListener("click", closeFiltersModal);

filtersBackdrop.addEventListener("click", (event) => {
  if (event.target === filtersBackdrop) closeFiltersModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !filtersBackdrop.hidden) closeFiltersModal();
});

filterCategorySelect.addEventListener("change", () => {
  filterCategory = filterCategorySelect.value;
  renderProducts();
});

filterPriorityCheckbox.addEventListener("change", () => {
  filterPriorityOnly = filterPriorityCheckbox.checked;
  renderProducts();
});

function updateSortPriceButton() {
  btnSortPrice.dataset.sort = sortPriceOrder || "none";
  btnSortPrice.classList.toggle("active", Boolean(sortPriceOrder));
  if (sortPriceOrder === "desc") {
    btnSortPrice.textContent = t("sort_price_desc");
  } else if (sortPriceOrder === "asc") {
    btnSortPrice.textContent = t("sort_price_asc");
  } else {
    btnSortPrice.textContent = t("sort_by_price");
  }
}

btnSortPrice.addEventListener("click", () => {
  sortPriceOrder = sortPriceOrder === null ? "desc" : sortPriceOrder === "desc" ? "asc" : null;
  updateSortPriceButton();
  renderProducts();
});

btnClearFilters.addEventListener("click", () => {
  filterCategory = "";
  filterPriorityOnly = false;
  sortPriceOrder = null;
  filterCategorySelect.value = "";
  filterPriorityCheckbox.checked = false;
  updateSortPriceButton();
  renderProducts();
});

btnClearPurchased.addEventListener("click", () => {
  const { purchased } = calculateTotals();
  if (purchased === 0) {
    alert(t("alert_no_purchased"));
    return;
  }
  if (confirm(t("confirm_clear_purchased"))) {
    clearPurchased();
  }
});

btnUncheckAll.addEventListener("click", () => {
  uncheckAll();
});

btnClearAll.addEventListener("click", () => {
  if (products.length === 0) return;
  if (confirm(t("confirm_clear_all"))) {
    clearAllProducts();
  }
});

btnToggleMoreOptions.addEventListener("click", () => {
  const isOpen = !moreOptionsPanel.hidden;
  moreOptionsPanel.hidden = isOpen;
  btnToggleMoreOptions.setAttribute("aria-expanded", String(!isOpen));
});

/* ==========================================================================
   Inicio
   ========================================================================== */

function init() {
  applyStaticTranslations();
  updateThemeToggleButton();
  refreshBgColorInput();
  renderPaletteRow();
  applyPalette(getSavedPaletteId());
  applyBackgroundImage();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!document.documentElement.getAttribute("data-theme")) {
      updateThemeToggleButton();
      let savedBgOnChange = null;
      try {
        savedBgOnChange = localStorage.getItem(BG_COLOR_KEY);
      } catch (error) {
        console.error("No se pudo leer el color de fondo guardado.", error);
      }
      if (!savedBgOnChange) refreshBgColorInput();
      applyPalette(getSavedPaletteId());
      applyBackgroundImage();
    }
  });

  let savedBg = null;
  try {
    savedBg = localStorage.getItem(BG_COLOR_KEY);
  } catch (error) {
    console.error("No se pudo leer el color de fondo guardado.", error);
  }
  if (savedBg) applyBgColor(savedBg);

  loadFromLocalStorage();
  renderProducts();
}

init();
hideSplash();

function hideSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash) return;

  // Mientras el splash tapa la pantalla, el resto de la app (header, main,
  // footer, la barra de resumen) sigue siendo enfocable por teclado aunque
  // esté visualmente oculto detrás: sin esto, tabular durante el splash
  // podía llevar el foco a un botón invisible. `inert` lo saca del todo
  // (foco y lectores de pantalla) hasta que el splash termina.
  const restOfApp = Array.from(document.body.children).filter(
    (el) => el !== splash && el.tagName !== "SCRIPT" && el.tagName !== "TEMPLATE"
  );
  restOfApp.forEach((el) => (el.inert = true));
  const releaseInert = () => restOfApp.forEach((el) => (el.inert = false));

  const appSlide = splash.querySelector(".app-splash-slide-app");
  const brandSlide = splash.querySelector(".app-splash-slide-brand");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    splash.hidden = true;
    releaseInert();
    if (!hasSeenOnboarding()) openOnboarding();
    return;
  }

  const slideDuration = 1600;
  setTimeout(() => {
    if (appSlide) appSlide.classList.remove("is-active");
    if (brandSlide) brandSlide.classList.add("is-active");
  }, slideDuration);

  setTimeout(() => {
    splash.classList.add("is-hidden");
    splash.addEventListener(
      "transitionend",
      (event) => {
        if (event.target !== splash) return;
        splash.hidden = true;
        releaseInert();
        if (!hasSeenOnboarding()) openOnboarding();
      },
      { once: true }
    );
  }, slideDuration * 2);
}
