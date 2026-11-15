// Datos fijos del sitio. El WhatsApp, el correo, las redes y las formas de donar se cambian desde el panel
// (Datos de la web): ver api/useSitio.js. Los de acá abajo se usan solo mientras cargan, o si la API no responde.
// Página Equipo: oculta por ahora (no está en el menú y /equipo lleva al inicio). Para mostrarla, poner true.
// Mientras tanto se puede ir cargando desde el panel, en Equipo.
export const EQUIPO_VISIBLE = false

export const MENU = [
  { label: 'Quienes Somos', to: '/quienes-somos' },
  { label: 'Qué hacemos', to: '/portfolio' },
  { label: 'Eventos', to: '/eventos' },
  ...(EQUIPO_VISIBLE ? [{ label: 'Equipo', to: '/equipo' }] : []),
  { label: 'Blog', to: '/blog' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Contacto', to: '/contacto' },
]

// Mismas claves que la tabla "ajustes" del backend (y backend/contenido/ajustes.json)
export const AJUSTES_INICIALES = {
  whatsapp: '381 641-0228',
  email: 'info@mujeresenred.com.ar',
  instagram: 'https://www.instagram.com/mujeresenred',
  facebook: 'https://www.facebook.com/mujeresenredtucuman',
  twitter: 'https://twitter.com/mujeresenredtuc',
  linkedin: 'https://www.linkedin.com/company/mujeres-en-red/',
  mercadopago: 'https://link.mercadopago.com.ar/mujeresered',
  paypal: '',
  qr: '',
  transferencia_titular: '',
  transferencia_alias: '',
  transferencia_cbu: '',
  transferencia_cuit: '',
  transferencia_banco: '',
  impacto: JSON.stringify([
    { numero: '14', texto: 'años acompañando a mujeres tucumanas' },
    { numero: '27', texto: 'emprendedoras en nuestro catálogo' },
    { numero: '6', texto: 'instituciones que nos acompañan' },
  ]),
  razon_social: '',
  cuit: '',
  personeria: '',
  memoria: '',
}
