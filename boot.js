// Se carga desde un archivo aparte (y no inline) para poder usar una
// Content-Security-Policy sin "unsafe-inline" en script-src.

// 1) Tema y colores guardados: corre antes de pintar para evitar el parpadeo.
(function () {
  try {
    var saved = localStorage.getItem("listaCompras.theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
    var savedBg = localStorage.getItem("listaCompras.bgColor");
    if (savedBg) {
      document.documentElement.style.setProperty("--color-page-bg", savedBg);
    }
    var savedPalette = localStorage.getItem("listaCompras.palette");
    var isDark = saved === "dark" || (saved !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var palettes = {
      verde: { light: ["#2f9e44", "#1f7a34", "#e8f4ea"], dark: ["#52c374", "#3a9c58", "#1e2b20"] },
      oceano: { light: ["#1c7ed6", "#145a9e", "#e3f1fc"], dark: ["#4dabf7", "#2f8fd6", "#132534"] },
      atardecer: { light: ["#e8590c", "#b7440a", "#fdebe0"], dark: ["#ff922b", "#e8720f", "#3a2415"] },
      uva: { light: ["#7048c2", "#56349c", "#f0e9fb"], dark: ["#a389f0", "#8264d6", "#251c3a"] },
      frambuesa: { light: ["#e64980", "#b93867", "#fde3ee"], dark: ["#f783ac", "#e0628e", "#3a1f28"] },
      grafito: { light: ["#495057", "#343a40", "#eef0f1"], dark: ["#adb5bd", "#868e96", "#22262a"] },
    };
    var variant = null;
    if (savedPalette === "custom") {
      var customColor = localStorage.getItem("listaCompras.customColor");
      if (customColor) {
        var hexToRgb = function (hex) {
          var n = parseInt(hex.replace("#", ""), 16);
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        };
        var rgbToHex = function (rgb) {
          return "#" + rgb.map(function (c) {
            return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
          }).join("");
        };
        var mix = function (hexA, hexB, w) {
          var a = hexToRgb(hexA), b = hexToRgb(hexB);
          return rgbToHex([a[0] * w + b[0] * (1 - w), a[1] * w + b[1] * (1 - w), a[2] * w + b[2] * (1 - w)]);
        };
        variant = isDark
          ? [mix(customColor, "#ffffff", 0.72), mix(customColor, "#ffffff", 0.5), mix(customColor, "#10140e", 0.18)]
          : [customColor, mix(customColor, "#000000", 0.78), mix(customColor, "#ffffff", 0.13)];
      }
    } else if (palettes[savedPalette]) {
      variant = isDark ? palettes[savedPalette].dark : palettes[savedPalette].light;
    }
    if (variant) {
      document.documentElement.style.setProperty("--color-primary", variant[0]);
      document.documentElement.style.setProperty("--color-primary-dark", variant[1]);
      document.documentElement.style.setProperty("--color-primary-soft", variant[2]);
    }
  } catch (error) {
    /* localStorage no disponible, seguimos con los valores por defecto */
  }
})();

// Red de seguridad independiente de script.js: si algo ahí explota antes
// de llegar a hideSplash(), esto evita que el splash quede tapando la
// app para siempre. No hace nada si hideSplash() ya lo escondió antes.
setTimeout(function () {
  var splash = document.getElementById("app-splash");
  if (splash && !splash.hidden) splash.hidden = true;
}, 6000);
