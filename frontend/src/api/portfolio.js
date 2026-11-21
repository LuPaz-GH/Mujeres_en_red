// Ayudas para mostrar las fichas de "Qué hacemos" (la sección vive en /portfolio)

// Cómo se agrupa cada ficha en la página "Qué hacemos" (mismo orden en que se muestran)
export const CATEGORIAS = [
  { id: 'programa', singular: 'Programa', plural: 'Programas', bajada: 'Acompañamos a las mujeres todo el año con formación y apoyo.' },
  { id: 'networking', singular: 'Networking', plural: 'Networking', bajada: 'Encuentros para conocernos, conectarnos y crecer juntas.' },
  { id: 'voluntariado', singular: 'Voluntariado', plural: 'Voluntariado', bajada: 'Formación y encuentro para las voluntarias que llevan adelante nuestros programas.' },
  { id: 'deporvida', singular: 'DeporVida', plural: 'DeporVida', bajada: 'Nuestro programa de radio, todos los sábados por LV12.' },
]

// Nombre de la categoría de una ficha (las viejas de "Proyecto", que ya no tiene botón, siguen diciendo "Proyecto")
export const nombreCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.singular ?? 'Proyecto'

// Fichas con página de un solo color (ej. Movimiento Rosa: toda rosa, también su tarjeta en el inicio)
export const TEMAS = { 'movimiento-rosa': { nombre: 'rosa', color: 'var(--rosa)' } }

// Fotos y videos de la galería de una ficha: los que se cargan en "Galería" del panel
// y, por si quedó alguna, las fotos que estén dentro de la descripción
export function galeriaDe(item, project) {
  const galeria = item.galeria ?? []
  const urls = new Set(galeria.map((g) => g.url))
  return [...galeria, ...project.gallery.filter((url) => !urls.has(url)).map((url) => ({ tipo: 'foto', url }))]
}

// Ficha -> { kind: 'Programa', name: 'Mujer Emprendedora' }
// (si el título todavía dice "Programa: ..." o "Proyecto: ..." se saca, porque ya se muestra como etiqueta)
export function splitTitle(item) {
  const kind = nombreCategoria(item.categoria)
  return { kind, name: item.titulo.replace(/^(Proyecto|Programa)\s*:\s*/i, '') }
}

// Convierte el contenido en bloques para poder diseñar cada parte por separado:
// tags (hashtags del comienzo), lead (primer párrafo), keys (ítems de la lista), keysIntro,
// body (párrafos), quote (último párrafo) y gallery (las fotos que se agregaron en la descripción)
export function parseProject(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const blocks = []

  doc.body.querySelectorAll(':scope > p, :scope > ul, :scope > ol').forEach((el) => {
    if (el.tagName === 'P') {
      if (el.textContent.trim()) blocks.push({ type: 'p', html: el.innerHTML.trim(), text: el.textContent.trim() })
    } else {
      const items = [...el.querySelectorAll('li')].map((li) => {
        const strong = li.querySelector('strong')
        const startsWithStrong = strong && li.textContent.trim().startsWith(strong.textContent.trim())
        if (startsWithStrong) {
          const title = strong.textContent.trim().replace(/:$/, '')
          strong.remove()
          return { title, html: li.innerHTML.replace(/^\s*[:,]\s*/, '').trim() }
        }
        return { title: null, html: li.innerHTML.trim() }
      })
      blocks.push({ type: 'list', items })
    }
  })

  const gallery = [...new Set([...doc.body.querySelectorAll('img')].map((img) => img.getAttribute('src')).filter(Boolean))]

  let paragraphs = blocks.filter((b) => b.type === 'p')

  // Si el primer párrafo son solo hashtags (ej. "#WEBINARS #TALLERES") se muestran como etiquetas
  let tags = []
  if (paragraphs[0] && /^(#[\p{L}\p{N}_]+\s*)+$/u.test(paragraphs[0].text)) {
    tags = paragraphs[0].text.split(/\s+/).filter(Boolean)
    paragraphs = paragraphs.slice(1)
  }
  const listIndex = blocks.findIndex((b) => b.type === 'list')
  const before = listIndex > 0 ? blocks[listIndex - 1] : null
  const keysIntro = before?.type === 'p' && before.text.endsWith(':') ? before : null

  const lead = paragraphs[0] || null
  const rest = paragraphs.filter((p) => p !== lead && p !== keysIntro)
  const quote = rest.length >= 2 ? rest[rest.length - 1] : null
  const body = rest.filter((p) => p !== quote)

  return {
    tags,
    lead,
    keys: listIndex >= 0 ? blocks[listIndex].items : [],
    keysIntro,
    body,
    quote,
    gallery,
  }
}
