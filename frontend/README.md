# Mujeres en Red — Frontend

Sitio web de la Fundación Mujeres en Red, hecho con **React + Vite**.
Toma el contenido (notas, portfolio, catálogo) de la API de WordPress (ver `../backend`).

## Cómo levantarlo

```bash
cd frontend
npm install      # solo la primera vez
npm run dev      # abre la web en http://localhost:5173
```

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
| `src/api/` | Conexión con WordPress y lectura del catálogo y los proyectos |
| `src/data/` | Datos fijos que se editan a mano (ver abajo) |
| `src/index.css` | Estilos generales, colores y fuentes |
| `public/` | Logo, imágenes propias y `.htaccess` para el hosting |

## Datos que se editan a mano (`src/data/`)

| Archivo | Qué tiene |
|---|---|
| `site.js` | Menú, redes sociales, WhatsApp, mail, link de donación |
| `equipo.js` | Integrantes del equipo: foto, cargo, trayectoria y redes |
| `donaciones.js` | Formas de donar: Mercado Pago, QR, datos bancarios, PayPal (las vacías no se muestran) |
| `brand.js` | Colores del logo |

Todo lo demás (notas del blog, proyectos del portfolio, emprendimientos del catálogo, formulario de contacto)
se carga desde WordPress, así que se sigue editando desde el panel de WordPress.

## Dirección de WordPress

Por defecto usa `https://mujeresenred.com.ar`. Si WordPress se mueve (por ejemplo a un subdominio),
crear un archivo `.env` en esta carpeta con:

```
VITE_WP_URL=https://nueva-direccion-de-wordpress
```
