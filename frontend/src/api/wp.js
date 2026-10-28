// Cliente para la API REST de WordPress (WordPress queda como "headless": solo administra el contenido)
export const WP_URL = import.meta.env.VITE_WP_URL || 'https://mujeresenred.com.ar'
const API = `${WP_URL}/wp-json/wp/v2`

const cache = new Map()

async function get(path) {
  if (cache.has(path)) return cache.get(path)
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar ${path}`)
  const data = await res.json()
  cache.set(path, data)
  return data
}

export const getPage = async (slug) => (await get(`/pages?slug=${slug}`))[0] || null

export const getPosts = (perPage = 6, page = 1) =>
  get(`/posts?per_page=${perPage}&page=${page}&_embed=wp:featuredmedia`)

// Notas con filtros (categoría, búsqueda y rango de fechas "AAAA-MM-DD");
// devuelve también la cantidad total de notas y de páginas
export async function getPostsFiltered({ perPage = 9, page = 1, category, search, from, to } = {}) {
  const params = new URLSearchParams({ per_page: perPage, page, _embed: 'wp:featuredmedia,wp:term' })
  if (category) params.set('categories', category)
  if (search) params.set('search', search)
  if (from) params.set('after', `${from}T00:00:00`)
  if (to) params.set('before', `${to}T23:59:59`)
  const res = await fetch(`${API}/posts?${params}`)
  // WordPress responde 400 si se pide una página que ya no existe: se trata como "sin resultados"
  if (res.status === 400) return { posts: [], total: 0, totalPages: 1 }
  if (!res.ok) throw new Error(`Error ${res.status} al cargar las notas`)
  return {
    posts: await res.json(),
    total: Number(res.headers.get('X-WP-Total')) || 0,
    totalPages: Number(res.headers.get('X-WP-TotalPages')) || 1,
  }
}

export const getCategories = () => get('/categories?per_page=50&hide_empty=true&_fields=id,name,slug,count')

// Nota completa, con foto, categorías, etiquetas y autora
export const getPost = async (slug) =>
  (await get(`/posts?slug=${slug}&_embed=wp:featuredmedia,wp:term,author`))[0] || null

// Notas de las mismas categorías (sin repetir la actual)
export const getRelatedPosts = (post, perPage = 3) => {
  const cats = (post.categories || []).filter((c) => c !== 1) // 1 = "Sin categoría"
  const byCat = cats.length ? `&categories=${cats.join(',')}` : ''
  return get(`/posts?per_page=${perPage}&exclude=${post.id}${byCat}&_embed=wp:featuredmedia`)
}

// Nota anterior y siguiente por fecha
export async function getAdjacentPosts(post) {
  const fields = '&_fields=slug,title,date'
  const [prev, next] = await Promise.all([
    get(`/posts?per_page=1&before=${post.date}&orderby=date&order=desc${fields}`),
    get(`/posts?per_page=1&after=${post.date}&orderby=date&order=asc${fields}`),
  ])
  return { prev: prev[0] || null, next: next[0] || null }
}

// Categorías y etiquetas que vienen embebidas en la nota
export function postTerms(post) {
  const groups = post?._embedded?.['wp:term'] || []
  const all = groups.flat()
  return {
    categories: all.filter((t) => t.taxonomy === 'category' && t.id !== 1),
    tags: all.filter((t) => t.taxonomy === 'post_tag'),
  }
}

export const getPortfolio = (perPage = 50) =>
  get(`/portfolio_item?per_page=${perPage}&orderby=id&order=desc&_embed=wp:featuredmedia`)

export const getPortfolioItem = async (slug) =>
  (await get(`/portfolio_item?slug=${slug}&_embed=wp:featuredmedia`))[0] || null

// Imágenes genéricas cargadas en WordPress (fondo gris con la flor) que no son una foto real
const PLACEHOLDER_MEDIA_IDS = [2538]

// Imagen destacada de un post/portfolio, en el tamaño pedido si existe
export function featuredImage(item, size = 'large') {
  if (PLACEHOLDER_MEDIA_IDS.includes(item?.featured_media)) return null
  const media = item?._embedded?.['wp:featuredmedia']?.[0]
  if (!media) return null
  return media.media_details?.sizes?.[size]?.source_url || media.source_url
}

// Primeras imágenes que aparecen dentro del texto de la nota (para armar un mosaico si no tiene foto)
export function contentImages(item, max = 4) {
  const html = item?.content?.rendered || ''
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1])
  return [...new Set(srcs)].slice(0, max)
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Envía el formulario de Contact Form 7 (el mismo que usa hoy la web, id 147)
export async function sendContactForm(formId, fields) {
  const body = new FormData()
  body.append('_wpcf7', formId)
  body.append('_wpcf7_unit_tag', `wpcf7-f${formId}-o1`)
  body.append('_wpcf7_locale', 'es_ES')
  Object.entries(fields).forEach(([k, v]) => body.append(k, v))
  const res = await fetch(`${WP_URL}/wp-json/contact-form-7/v1/contact-forms/${formId}/feedback`, {
    method: 'POST',
    body,
  })
  return res.json()
}
