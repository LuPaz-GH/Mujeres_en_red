# Mujeres en Red — Backend

## Qué es el backend hoy

El backend del sitio es **WordPress**, que ya está instalado en el hosting de **Ferozo (DonWeb)**.
WordPress funciona como *headless*: no muestra la web, solo guarda el contenido y lo entrega por su API.
La web en React (`../frontend`) le pide los datos y los muestra con el diseño nuevo.

Ese código vive en el hosting, no en esta carpeta.

### Lo que el frontend usa de WordPress

| Qué | Dirección de la API |
|---|---|
| Notas del blog | `/wp-json/wp/v2/posts` |
| Categorías del blog | `/wp-json/wp/v2/categories` |
| Proyectos del portfolio | `/wp-json/wp/v2/portfolio_item` |
| Páginas (ej. el Catálogo) | `/wp-json/wp/v2/pages` |
| Formulario de contacto | `/wp-json/contact-form-7/v1/contact-forms/147/feedback` |

Si se desactiva alguno de estos plugins en WordPress, la parte correspondiente de la web deja de funcionar:
**Contact Form 7** (formulario) y el plugin del **Portfolio** (tipo de contenido `portfolio_item`).

## Qué va a ir en esta carpeta

Código que tenga que correr **en el servidor**. Ferozo es un hosting compartido que ejecuta **PHP**,
así que lo que se agregue acá conviene hacerlo en PHP.

Pendiente:

- **Integración con Mercado Pago (Checkout Pro)**: para generar el pago desde la propia web y mostrar
  un botón "Descargar cupón" de Pago Fácil / Rapipago. Necesita las credenciales (Access Token) de la
  cuenta de Mercado Pago de la fundación. Esas credenciales son secretas: **nunca** van en el frontend
  ni se suben a un repositorio público; se guardan solo en el servidor.

## Cómo queda armado en el hosting (cuando se publique)

```
public_html/
├── index.html, assets/...   ← contenido de frontend/dist (npm run build)
├── .htaccess                ← hace que funcionen las rutas de React (/equipo, /blog...)
├── api/                     ← (futuro) archivos PHP de esta carpeta
└── WordPress                ← se mueve a una subcarpeta o subdominio para no pisarse con React
```

Antes de publicar: **hacer un backup completo** (archivos + base de datos) desde el panel de Ferozo.
Si WordPress cambia de dirección, actualizar `VITE_WP_URL` en el frontend (ver `../frontend/README.md`).
