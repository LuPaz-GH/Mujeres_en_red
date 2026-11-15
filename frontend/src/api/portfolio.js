// Ayudas para mostrar las fichas de "Qué hacemos" (la sección vive en /portfolio)

// Cómo se agrupa cada ficha en la página "Qué hacemos" (mismo orden en que se muestran)
export const CATEGORIAS = [
  { id: 'programa', singular: 'Programa', plural: 'Programas', bajada: 'Acompañamos a las mujeres todo el año con formación y apoyo.' },
  { id: 'proyecto', singular: 'Proyecto', plural: 'Proyectos', bajada: 'Campañas y acciones sobre temas que nos importan.' },
  { id: 'networking', singular: 'Networking', plural: 'Networking', bajada: 'Encuentros para conocernos, conectarnos y crecer juntas.' },
]

// Ficha -> { kind: 'Programa', name: 'Mujer Emprendedora' }
// (si el título todavía dice "Programa: ..." o "Proyecto: ..." se saca, porque ya se muestra como etiqueta)
export function splitTitle(item) {
  const kind = (CATEGORIAS.find((c) => c.id === item.categoria) ?? CATEGORIAS[1]).singular
  return { kind, name: item.titulo.replace(/^(Proyecto|Programa)\s*:\s*/i, '') }
}

// Convierte el contenido en bloques para poder diseñar cada parte por separado:
// tags (hashtags del comienzo), lead (primer párrafo), keys (ítems de la lista), keysIntro,
// body (párrafos) y quote (último párrafo)
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
          return { title, html: li.innerHTML.replace(/^\s*:\s*/, '').trim() }
        }
        return { title: null, html: li.innerHTML.trim() }
      })
      blocks.push({ type: 'list', items })
    }
  })

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
  }
}
