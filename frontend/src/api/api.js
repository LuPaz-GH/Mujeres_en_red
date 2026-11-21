// Cliente para la API propia (backend/api, en PHP): notas, portfolio, catálogo y formulario de contacto.
// En la compu, Vite le pasa los pedidos a /api al servidor de PHP (ver vite.config.js).
const API = '/api'

const cache = new Map()

export async function request(path, options) {
  const res = await fetch(`${API}${path}`, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || `Error ${res.status}`)
    error.status = res.status
    throw error
  }
  return data
}

// Pedidos de lectura: se guardan para no volver a pedir lo mismo al navegar
async function get(path) {
  if (!cache.has(path)) cache.set(path, request(path).catch((e) => (cache.delete(path), Promise.reject(e))))
  return cache.get(path)
}

// Después de un cambio en el panel, para que la web muestre lo nuevo sin recargar
export const limpiarCache = () => cache.clear()

// Si no existe (404) devuelve null en vez de un error
const orNull = (promise) => promise.catch((e) => (e.status === 404 ? null : Promise.reject(e)))

// Notas con filtros (categoría, búsqueda y rango de fechas "AAAA-MM-DD");
// devuelve { notas, total, paginas }
export function getNotas({ porPagina = 9, pagina = 1, categoria, buscar, desde, hasta } = {}) {
  const params = new URLSearchParams({ por_pagina: porPagina, pagina })
  if (categoria) params.set('categoria', categoria)
  if (buscar) params.set('buscar', buscar)
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  return get(`/notas?${params}`)
}

// Nota completa, con categorías, etiquetas, autora, anterior, siguiente y relacionadas
export const getNota = (slug) => orNull(get(`/notas/${encodeURIComponent(slug)}`))

export const getCategorias = () => get('/categorias')

export const getPortfolio = (limite = 50) => get(`/portfolio?limite=${limite}`)

export const getProyecto = (slug) => orNull(get(`/portfolio/${encodeURIComponent(slug)}`))

// { rubros: [{id, nombre}], fichas: [{nombre, rubro, descripcion, foto, links: [{tipo, url, texto}]}] }
export const getCatalogo = () => get('/catalogo')

// Eventos: { proximos: [del más cercano al más lejano], pasados: [del más nuevo al más viejo; 6 si se pide un límite] }
export const getEventos = (limite = 50) => get('/eventos?limite=' + limite)

// Instituciones que nos acompañan: [{ id, nombre, detalle, logo, link }]
export const getInstituciones = () => get('/instituciones')

// Testimonios del inicio: [{ id, nombre, detalle, texto, foto }]
export const getTestimonios = () => get('/testimonios')

// Integrantes de la página Equipo: [{ id, nombre, cargo, foto, bio: [líneas], redes: {linkedin, ...}, color }]
export const getEquipo = () => get('/equipo')

// WhatsApp, correo, redes y formas de donar (ver useSitio.js)
export const getAjustes = () => get('/ajustes')

// Páginas sueltas que venían de WordPress (ej. "Qué hacemos")
export const getPagina = (slug) => orNull(get(`/paginas/${encodeURIComponent(slug)}`))

// { nombre, email, asunto, mensaje, trampa } -> { ok, mensaje } (si falla, el error trae el motivo)
export const enviarContacto = (campos) =>
  request('/contacto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campos) })

// Avisa al contador de visitas qué página se abrió (sin cookies ni datos personales; ver backend registrarVisita).
// entrada: es la primera página de esta visita, así se sabe de dónde llegó (Instagram, Google...)
let primeraPagina = true
export function registrarVisita(ruta) {
  const entrada = primeraPagina
  primeraPagina = false
  fetch(`${API}/visita`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruta, entrada, referrer: entrada ? document.referrer : '' }),
    keepalive: true,
  }).catch(() => {}) // si falla, la web sigue igual
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}
