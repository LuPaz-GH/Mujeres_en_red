// Lee la página "Catálogo" de WordPress y la convierte en datos:
// cada título (h2) es un rubro y cada bloque "imagen + texto" es un emprendimiento.
// Así el catálogo se sigue cargando desde WordPress como siempre.

const clean = (s) => s.replace(/\s+/g, ' ').trim()

function isValidUrl(href) {
  try {
    return new URL(href).hostname.includes('.')
  } catch {
    return false
  }
}

function linkType(href) {
  if (/wa\.link|wa\.me|whatsapp/i.test(href)) return 'whatsapp'
  if (/instagram\.com/i.test(href)) return 'instagram'
  if (/facebook\.com|fb\.com/i.test(href)) return 'facebook'
  if (/tiktok\.com/i.test(href)) return 'tiktok'
  if (/^mailto:/i.test(href)) return 'email'
  if (/linkedin\.com/i.test(href)) return 'linkedin'
  return 'web'
}

function parseEntry(block, category) {
  const content = block.querySelector('.wp-block-media-text__content') || block
  const img = block.querySelector('img')?.getAttribute('src') || null
  const name = clean(content.querySelector('strong')?.textContent || '')

  // Descripción: los párrafos sin links que no son el nombre
  let description = [...content.querySelectorAll('p')]
    .filter((p) => !p.querySelector('a') && clean(p.textContent) && clean(p.textContent) !== name)
    .map((p) => clean(p.textContent))
    .join(' ')
  // A veces el nombre está en el mismo párrafo que la descripción: se saca para no repetirlo
  if (name && description.startsWith(name)) description = description.slice(name.length).trim()

  const links = []
  const seen = new Set()
  content.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href').trim()
    if (!/^(https?:|mailto:)/i.test(href) || /\s/.test(href) || seen.has(href)) return
    if (/^https?:/i.test(href) && !isValidUrl(href)) return // links mal cargados
    seen.add(href)
    const type = linkType(href)
    let label = clean(a.textContent)
    if (type === 'whatsapp') label = label.replace(/^(cel\.?|[:\s])*/i, '')
    links.push({ type, href, label })
  })

  return { name, description, img, links, category }
}

export function parseCatalog(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const categories = []
  const entries = []
  let current = 'Otros'

  doc.body.querySelectorAll('h2, .wp-block-media-text').forEach((el) => {
    if (el.tagName === 'H2') {
      current = clean(el.textContent).replace(/\.$/, '')
      if (current && !categories.includes(current)) categories.push(current)
    } else {
      const entry = parseEntry(el, current)
      if (entry.name) entries.push(entry)
    }
  })

  return { categories, entries }
}
