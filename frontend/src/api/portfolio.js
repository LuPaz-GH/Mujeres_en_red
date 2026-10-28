// Ayudas para mostrar los proyectos del portfolio que vienen de WordPress

const decode = (html) => {
  const el = document.createElement('textarea')
  el.innerHTML = html
  return el.value
}

// "Proyecto: Coaching Fest" -> { kind: 'Proyecto', name: 'Coaching Fest' }
export function splitTitle(rendered) {
  const title = decode(rendered)
  const m = title.match(/^(Proyecto|Programa)\s*:\s*(.+)$/i)
  if (m) return { kind: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(), name: m[2] }
  return { kind: 'Proyecto', name: title }
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
