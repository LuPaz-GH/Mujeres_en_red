// Ayudas para la galería de fotos y videos. Item: { tipo: 'foto' | 'video' | 'youtube' | 'instagram', url }

// Código del video en un link de YouTube (watch?v=, youtu.be/, shorts/, embed/, live/)
export const idYoutube = (url) =>
  url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)?.[1]

// Publicación o reel de Instagram -> { tipo: 'p' | 'reel', id }
export function idInstagram(url) {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reels?|tv)\/([\w-]+)/)
  return m && { tipo: m[1] === 'p' ? 'p' : 'reel', id: m[2] }
}

// Qué es un link pegado: 'youtube', 'instagram' o null si no es de ninguno
export const tipoDeLink = (url) => (idYoutube(url) ? 'youtube' : idInstagram(url) ? 'instagram' : null)

// Dirección para mostrar el video dentro de la web
export function direccionEmbebida(item, autoplay = false) {
  if (item.tipo === 'youtube') return `https://www.youtube-nocookie.com/embed/${idYoutube(item.url)}?rel=0${autoplay ? '&autoplay=1' : ''}`
  const ig = idInstagram(item.url)
  return `https://www.instagram.com/${ig.tipo}/${ig.id}/embed/`
}

// Foto que se muestra en la miniatura (de YouTube, la que genera YouTube; Instagram no da una: null)
export function miniatura(item) {
  if (item.tipo === 'youtube') return `https://i.ytimg.com/vi/${idYoutube(item.url)}/hqdefault.jpg`
  if (item.tipo === 'instagram') return null
  return item.url
}

export const NOMBRE_TIPO = { foto: 'Foto', video: 'Video', youtube: 'YouTube', instagram: 'Instagram' }
