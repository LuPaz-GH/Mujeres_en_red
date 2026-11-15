// "381 641-0228" -> "https://wa.me/5493816410228" (formato de Argentina: 54 + 9 + característica + número, sin 0 ni 15)
// texto: mensaje que aparece ya escrito al abrir el chat
export function whatsappUrl(numero, texto = '') {
  let digitos = String(numero || '').replace(/\D/g, '')
  if (digitos.length < 8) return ''
  if (!digitos.startsWith('54')) {
    digitos = digitos.replace(/^0/, '')
    // 381 15 513-4073 -> 381 513-4073
    if (digitos.length === 12) digitos = digitos.replace(/^(\d{2,4})15/, '$1')
    digitos = `549${digitos}`
  }
  return `https://wa.me/${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
}
