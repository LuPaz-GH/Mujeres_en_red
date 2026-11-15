// Cliente de la API para el panel de administración. Todo pide haber iniciado sesión (ver backend/api/lib/panel.php).
// Los listados vienen de a 7 y devuelven { items, total, paginas }. Borrar manda a la papelera.
import { limpiarCache, request } from './api'

let alVencerSesion = () => {}
export const onSesionVencida = (fn) => {
  alVencerSesion = fn
}

async function pedido(path, options = {}) {
  try {
    const data = await request(path, { ...options, headers: { 'X-Requested-With': 'fetch', ...options.headers } })
    if (options.method) limpiarCache()
    return data
  } catch (error) {
    // Se avisa en vez de sacarla del panel, para no perder lo que estaba escribiendo
    if (error.status === 401 && path !== '/sesion') alVencerSesion()
    throw error
  }
}

const enviar = (method, path, datos) =>
  pedido(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })

// Crea si no hay id, actualiza si hay
const guardar = (path, id, datos) => (id ? enviar('PUT', `${path}/${id}`, datos) : enviar('POST', path, datos))
const borrar = (path, id) => pedido(`${path}/${id}`, { method: 'DELETE' })

// { pagina, buscar, desde, hasta, ... } -> "?pagina=1&buscar=hola" (sin los filtros vacíos)
function consulta(filtros = {}) {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor))
  return `?${params}`
}

// Sesión y cuenta propia
export const getSesion = () => pedido('/sesion')
export const entrar = (email, clave) => enviar('POST', '/sesion', { email, clave })
export const salir = () => pedido('/sesion', { method: 'DELETE' })
export const cambiarClave = (actual, nueva) => enviar('PUT', '/admin/clave', { actual, nueva })

// Números de la pantalla de inicio
export const getResumen = () => pedido('/admin/resumen')

// Notas
export async function getNotasPanel(filtros) {
  const { notas, total, paginas } = await pedido(`/admin/notas${consulta(filtros)}`)
  return { items: notas, total, paginas }
}
export const getNotaPanel = (id) => pedido(`/admin/notas/${id}`)
export const guardarNota = (id, datos) => guardar('/admin/notas', id, datos)
export const borrarNota = (id) => borrar('/admin/notas', id)

export const getCategoriasPanel = () => pedido('/admin/categorias')
export const guardarCategoria = (id, nombre) => guardar('/admin/categorias', id, { nombre })
export const borrarCategoria = (id) => borrar('/admin/categorias', id)

// Portfolio
export const getPortfolioPanel = (filtros) => pedido(`/admin/portfolio${consulta(filtros)}`)
export const getProyectoPanel = (id) => pedido(`/admin/portfolio/${id}`)
export const guardarProyecto = (id, datos) => guardar('/admin/portfolio', id, datos)
export const borrarProyecto = (id) => borrar('/admin/portfolio', id)

// Catálogo. Las funciones de rubros devuelven la lista actualizada.
export const getRubros = () => pedido('/admin/rubros')
export const guardarRubro = (id, datos) => guardar('/admin/rubros', id, datos)
export const borrarRubro = (id) => borrar('/admin/rubros', id)
export const getFichas = (filtros) => pedido(`/admin/emprendimientos${consulta(filtros)}`)
export const getFicha = (id) => pedido(`/admin/emprendimientos/${id}`)
export const guardarFicha = (id, datos) => guardar('/admin/emprendimientos', id, datos)
export const borrarFicha = (id) => borrar('/admin/emprendimientos', id)

// Mensajes: además de la lista trae no_leidos
export const getMensajes = (filtros) => pedido(`/admin/mensajes${consulta(filtros)}`)
export const marcarMensaje = (id, leido) => enviar('PUT', `/admin/mensajes/${id}`, { leido })
export const borrarMensaje = (id) => borrar('/admin/mensajes', id)

// Eventos: primero los próximos (el más cercano arriba), después los que ya pasaron
export const getEventosPanel = (filtros) => pedido(`/admin/eventos${consulta(filtros)}`)
export const getEvento = (id) => pedido(`/admin/eventos/${id}`)
export const guardarEvento = (id, datos) => guardar('/admin/eventos', id, datos)
export const borrarEvento = (id) => borrar('/admin/eventos', id)

// Instituciones que nos acompañan: vienen todas juntas. ordenarInstituciones devuelve la lista nueva.
export const getInstitucionesPanel = () => pedido('/admin/instituciones')
export const getInstitucion = (id) => pedido(`/admin/instituciones/${id}`)
export const guardarInstitucion = (id, datos) => guardar('/admin/instituciones', id, datos)
export const borrarInstitucion = (id) => borrar('/admin/instituciones', id)
export const ordenarInstituciones = (ids) => enviar('PUT', '/admin/instituciones/orden', { ids })

// Testimonios del inicio: vienen todos juntos. ordenarTestimonios devuelve la lista nueva.
export const getTestimoniosPanel = () => pedido('/admin/testimonios')
export const getTestimonio = (id) => pedido(`/admin/testimonios/${id}`)
export const guardarTestimonio = (id, datos) => guardar('/admin/testimonios', id, datos)
export const borrarTestimonio = (id) => borrar('/admin/testimonios', id)
export const ordenarTestimonios = (ids) => enviar('PUT', '/admin/testimonios/orden', { ids })

// Equipo: son pocas, vienen todas juntas (sin páginas). ordenarEquipo devuelve la lista nueva.
export const getEquipoPanel = () => pedido('/admin/equipo')
export const getIntegrante = (id) => pedido(`/admin/equipo/${id}`)
export const guardarIntegrante = (id, datos) => guardar('/admin/equipo', id, datos)
export const borrarIntegrante = (id) => borrar('/admin/equipo', id)
export const ordenarEquipo = (ids) => enviar('PUT', '/admin/equipo/orden', { ids })

// Datos de la web (solo administradoras): WhatsApp, correo, redes y formas de donar
export const getAjustesPanel = () => pedido('/admin/ajustes')
export const guardarAjustes = (datos) => enviar('PUT', '/admin/ajustes', datos)

// Visitas a la web (solo administradoras): totales y datos para los gráficos de los últimos N días
export const getVisitas = (dias) => pedido(`/admin/visitas?dias=${dias}`)

// Solo administradoras: cuentas, actividad y papelera
export const getCuentas = (filtros) => pedido(`/admin/usuarias${consulta(filtros)}`)
export const getCuenta = (id) => pedido(`/admin/usuarias/${id}`)
export const guardarCuenta = (id, datos) => guardar('/admin/usuarias', id, datos)
export const borrarCuenta = (id) => borrar('/admin/usuarias', id)
export const getActividad = (filtros) => pedido(`/admin/actividad${consulta(filtros)}`)
export const getPapelera = (filtros) => pedido(`/admin/papelera${consulta(filtros)}`)
export const restaurar = (tipo, id) => pedido(`/admin/papelera/${tipo}/${id}`, { method: 'POST' })
export const eliminarDefinitivo = (tipo, id) => pedido(`/admin/papelera/${tipo}/${id}`, { method: 'DELETE' })

// Fotos: se achican en el navegador antes de subirlas. Una foto de celular pasa de 8 MB a menos de 1 MB,
// sube mucho más rápido y no choca con el límite de tamaño del hosting.
const MAX_LADO = 1920

async function achicarFoto(archivo) {
  if (archivo.type === 'image/gif') return archivo
  try {
    const foto = await createImageBitmap(archivo)
    const escala = Math.min(1, MAX_LADO / Math.max(foto.width, foto.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(foto.width * escala)
    canvas.height = Math.round(foto.height * escala)
    canvas.getContext('2d').drawImage(foto, 0, 0, canvas.width, canvas.height)
    const tipo = archivo.type === 'image/png' ? 'image/png' : 'image/jpeg' // PNG mantiene los fondos transparentes
    const blob = await new Promise((listo) => canvas.toBlob(listo, tipo, 0.85))
    if (!blob || blob.size >= archivo.size) return archivo
    return new File([blob], archivo.name.replace(/\.\w+$/, tipo === 'image/png' ? '.png' : '.jpg'), { type: tipo })
  } catch {
    return archivo // si el navegador no la puede leer, que decida el servidor
  }
}

// -> dirección de la foto ya subida
export async function subirFoto(archivo) {
  const form = new FormData()
  form.append('foto', await achicarFoto(archivo))
  const { url } = await pedido('/admin/fotos', { method: 'POST', body: form })
  return url
}
