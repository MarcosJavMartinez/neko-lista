# Neko Lista

Lista de compras y presupuesto: cargá productos, marcalos como comprados y llevá el control de cuánto llevás gastado y cuánto te falta — sin cuenta, sin ads, gratis. Categoriza y le asigna un ícono a más de 100 productos comunes automáticamente por nombre.

### 🌐 [Ver demo en vivo →](https://neko-lista.vercel.app/)

## 📸 Vista previa

![Lista principal](docs/lista-principal.jpg)

<details>
<summary>Más capturas: filtros, selector de idioma</summary>

![Filtros y orden](docs/filtros.jpg)
![Selector de idioma](docs/idioma.jpg)

</details>

## ✨ Funcionalidades

- Categorías y prioridad, búsqueda y filtros, orden por precio.
- Temas claro/oscuro con 6 paletas de color y color personalizado.
- 6 idiomas: español, inglés, portugués, turco, ruso y japonés.
- Instalable como app (PWA) en Android e iOS.
- Importar/exportar: texto, PDF, imagen (con lectura de listas a mano o tickets vía OCR) y backup técnico en JSON.
- Gratis, sin cuenta ni anuncios — con botón de propina para apoyar el proyecto vía [Ko-fi](https://ko-fi.com/nekotools).

## 🛠️ Stack

JavaScript vanilla, HTML y CSS, sin frameworks ni build tool. PWA con service worker. Guardado en `localStorage` — hay un esquema de Supabase preparado (`supabase_schema.sql`) para una futura sincronización entre dispositivos, todavía no conectado al frontend.

## 📌 Estado

Terminado y funcional, en desarrollo activo (mejoras de UI casi a diario). Sin cuentas ni sincronización todavía: cada dispositivo guarda su propia lista.

## 👤 Autor

Desarrollado por [Marcos Martínez](https://github.com/MarcosJavMartinez), bajo la marca [Neko Tools](https://nekotools.site).
