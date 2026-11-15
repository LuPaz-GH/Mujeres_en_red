# Mujeres en Red — Backend

Programa en **PHP** que guarda el contenido de la web (notas, portfolio, catálogo, mensajes) y se lo entrega
a la web en React (`../frontend`). Reemplaza a WordPress. Corre en el hosting de **Ferozo (DonWeb)**,
con su base de datos **MySQL**.

## Qué hay en esta carpeta

| Carpeta / archivo | Contenido |
|---|---|
| `api/` | La API: `index.php` recibe los pedidos y `lib/` tiene el código |
| `api/config.ejemplo.php` | Modelo de la configuración del hosting (base de datos y mails) |
| `uploads/` | Las fotos de la web |
| `contenido/` | El contenido que se sacó de WordPress (copia de respaldo en texto) |
| `herramientas/` | Scripts para exportar de WordPress, cargar la base y crear cuentas |
| `servidor-local.php` | Para probar la API en la compu |

## Probarlo en la compu

Hace falta PHP 8.3 (`winget install PHP.PHP.8.3`). En la compu no hace falta MySQL: se usa una base
SQLite que se crea sola en `datos/` (no se sube a GitHub).

```bash
cd backend
php herramientas/importar-contenido.php            # la primera vez: crea la base y carga el contenido
php herramientas/crear-usuaria.php correo@ejemplo.com "Nombre"   # cuenta para entrar al panel
php -S 127.0.0.1:8000 servidor-local.php           # deja la API andando en http://127.0.0.1:8000/api
```

`importar-contenido.php --borrar` vuelve a cargar todo desde cero (borra lo que haya en la base).

## Qué ofrece la API

Web pública (no pide sesión):

| Pedido | Qué devuelve |
|---|---|
| `GET /api/notas?pagina=&por_pagina=&categoria=&buscar=&desde=&hasta=` | Notas publicadas, con total y cantidad de páginas |
| `GET /api/notas/{slug}` | Una nota completa, con la anterior, la siguiente y 3 relacionadas |
| `GET /api/categorias` | Categorías que tienen notas |
| `GET /api/portfolio?limite=` y `/api/portfolio/{slug}` | Proyectos |
| `GET /api/catalogo` | Rubros y fichas de emprendimientos |
| `GET /api/paginas/{slug}` | Páginas sueltas que venían de WordPress (ej. `que-hacemos`) |
| `GET /api/eventos?limite=` | Próximos eventos (del más cercano al más lejano) y los últimos 6 que ya pasaron |
| `GET /api/instituciones` | "Instituciones que nos acompañan" del inicio, en orden |
| `GET /api/equipo` | Integrantes de la página Equipo, en orden |
| `GET /api/ajustes` | WhatsApp, correo, redes y formas de donar (se cambian en el panel: Datos de la web) |
| `POST /api/contacto` | Guarda el mensaje (con WhatsApp opcional) y lo manda por mail a la fundación |
| `GET /api/testimonios` | Testimonios del inicio, en orden |
| `POST /api/visita` | Cuenta una página vista, para la sección Visitas del panel (sin cookies ni datos personales) |

Panel (`/api/sesion` para entrar y salir; todo lo de `/api/admin/...` pide sesión): notas, categorías,
portfolio, rubros, emprendimientos, equipo, mensajes, datos de la web (solo administradoras), subir fotos y cambiar la contraseña. La lista completa está
en `api/index.php`.

Seguridad:
- Contraseñas guardadas cifradas. Después de 5 intentos fallidos hay que esperar 15 minutos.
- Los cambios del panel solo se aceptan desde el propio panel.
- Las fotos se revisan por contenido (no por nombre), se achican a 1920 px y en `uploads/` nunca se ejecuta código.
- El formulario de contacto tiene un campo trampa para robots y acepta como mucho 5 mensajes por hora por conexión.

## Panel de administración

Se entra por `/admin` (link "Acceso" en el pie de la web). El código está en `frontend/src/admin/`.

- **Cuentas:** hay administradoras y voluntarias (en la base, el rol se llama `empleada`). La primera administradora se crea con
  `herramientas/crear-usuaria.php`; las demás cuentas, desde el panel, en Cuentas.
- **Equipo y Datos de la web:** las integrantes del equipo y el WhatsApp, correo, redes y formas de donar se
  cambian desde el panel. Lo que había escrito en el código quedó en `contenido/equipo.json` y `contenido/ajustes.json`
  (y la primera lista de instituciones, en `contenido/instituciones.json`),
  y se carga solo la primera vez (con `importar-contenido.php` o `actualizar-base.php`).
- **Visitas:** contador propio con gráficos (solo administradoras). No usa cookies ni guarda la IP: cada visitante
  se convierte en un código que cambia todos los días, así que "personas" es un número aproximado. No cuenta
  robots, el panel ni las recargas de la misma página dentro de media hora. Lo de hace más de 2 años se borra solo.
- **Papelera:** borrar en el panel no elimina nada: lo oculta de la web y lo manda a la papelera. Solo una
  administradora puede restaurarlo o eliminarlo definitivamente.
- **Actividad:** cada acción queda registrada con persona, fecha y hora. Solo la ven las administradoras.
- **Contraseñas olvidadas:** una administradora le pone una nueva a otra cuenta desde Cuentas. No hay
  "olvidé mi contraseña" por mail. Si la única administradora se olvida la suya, hay que usar `crear-usuaria.php`.

Una base que ya estaba cargada de antes se actualiza con `php herramientas/actualizar-base.php`.

## Cómo queda armado en el hosting (cuando se publique)

```
public_html/
├── index.html, assets/...   ← contenido de frontend/dist (npm run build), con img/, css/ y robots.txt
├── index.php                ← este backend/index.php: entrega index.html con el título, la descripción y la
│                              foto de cada página (vista previa en WhatsApp/Facebook, Google) y arma /sitemap.xml
├── .htaccess                ← manda todas las rutas de React (/eventos, /blog, /mi-nota...) a index.php
├── api/                     ← esta carpeta api/, con su config.php completado
└── uploads/                 ← esta carpeta uploads/
```

Ferozo no tiene consola, así que la instalación se hace desde el navegador:

1. En la carpeta del proyecto, `.\armar-para-subir.ps1` arma `para-subir/` (web + API + fotos + contenido +
   instalador) y un `.zip` con lo mismo. La primera vez crea `para-subir/config.php` con una clave de instalación.
2. Completar `para-subir/config.php` con la base MySQL creada en Ferozo y volver a correr el script.
3. Subir el contenido a `public_html` (antes, mover WordPress a otra carpeta) y abrir `/instalar.php`:
   pide la clave de instalación, crea las tablas, carga el contenido y la cuenta de la administradora.
4. Borrar `instalar.php` del hosting. Si se vuelve a abrir con cuentas ya creadas, no hace nada.
Antes de publicar: **hacer un backup completo** desde Mi Sitio Web → Copias de Seguridad.

## Pendiente

- **Integración con Mercado Pago (Checkout Pro)**: para generar el pago desde la propia web y mostrar
  un botón "Descargar cupón" de Pago Fácil / Rapipago. Necesita las credenciales (Access Token) de la
  cuenta de Mercado Pago de la fundación. Esas credenciales son secretas: **nunca** van en el frontend
  ni se suben a un repositorio público; se guardan solo en el servidor (en `api/config.php`).
