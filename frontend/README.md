# Mujeres en Red — Frontend

Sitio web de la Fundación Mujeres en Red, hecho con **React + Vite**.
Toma el contenido (notas, portfolio, catálogo) de la API propia en PHP (ver `../backend`).

## Cómo levantarlo

Hacen falta dos terminales: una para la API (PHP) y otra para la web.

```bash
cd frontend
npm install      # solo la primera vez
npm run api      # terminal 1: deja andando la API en http://127.0.0.1:8000
npm run dev      # terminal 2: abre la web en http://localhost:5173
```

La primera vez hay que crear la base de datos de prueba (ver `../backend/README.md`).

Otros comandos:

| Comando | Para qué sirve |
|---|---|
| `npm run build` | Genera la versión final en `dist/` (es lo que se sube al hosting) |
| `npm run preview` | Muestra la versión de `dist/` para probarla antes de subir |
| `npm run lint` | Revisa errores en el código |

## Dónde está cada cosa

| Carpeta / archivo | Contenido |
|---|---|
| `src/pages/` | Una página por sección: Inicio, Quiénes somos, Equipo, Blog, Catálogo, Contacto, Donar, Portfolio |
| `src/components/` | Partes que se repiten: menú, pie, tarjetas, formulario, animaciones (`motion/`) y la flor 3D (`three/`) |
| `src/api/` | Conexión con la API (`api.js`) y ayudas para mostrar los proyectos |
| `src/data/` | Datos fijos que se editan a mano (ver abajo) |
| `src/index.css` | Estilos generales, colores y fuentes |
| `public/` | Logo, `.htaccess` para el hosting y las fotos fijas del diseño (`img/sitio/`) |

## Datos que se editan a mano (`src/data/`)

| Archivo | Qué tiene |
|---|---|
| `site.js` | Menú, redes sociales, WhatsApp, mail, link de donación |
| `equipo.js` | Integrantes del equipo: foto, cargo, trayectoria y redes |
| `donaciones.js` | Formas de donar: Mercado Pago, QR, datos bancarios, PayPal (las vacías no se muestran) |
| `brand.js` | Colores del logo |

Todo lo demás (notas del blog, proyectos del portfolio, emprendimientos del catálogo, mensajes de contacto)
viene de la API y se edita desde el panel de administración.
