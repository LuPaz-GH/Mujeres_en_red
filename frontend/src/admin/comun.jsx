import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { subirFoto } from '../api/admin'
import Pagination from '../components/Pagination'
import { useBorrar, useDialogos } from './Dialogos'

// Piezas que se repiten en todas las pantallas del panel

const POR_PAGINA = 7

export const CAMBIOS_SIN_GUARDAR = {
  titulo: 'Tenés cambios sin guardar',
  texto: 'Si salís ahora, se pierden.',
  boton: 'Salir sin guardar',
  peligro: true,
}

// Como useApi, pero al recargar no borra lo que se ve y deja cambiar los datos a mano
export function useDatos(fn, deps = []) {
  const [estado, setEstado] = useState({ data: null, loading: true, error: null })
  const fnActual = useRef(fn)
  fnActual.current = fn

  const recargar = useCallback(async () => {
    try {
      const data = await fnActual.current()
      setEstado({ data, loading: false, error: null })
    } catch (error) {
      setEstado((e) => ({ ...e, loading: false, error }))
    }
  }, [])

  useEffect(() => {
    setEstado((e) => ({ ...e, loading: true }))
    recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((data) => setEstado((e) => ({ ...e, data, error: null })), [])
  return { ...estado, setData, recargar }
}

// Listado que viene del servidor de a 7, con página y filtros
export function useListado(fn, deps = []) {
  const [pagina, setPagina] = useState(1)
  const [filtros, setFiltrosActuales] = useState({})
  const datos = useDatos(() => fn({ pagina, ...filtros }), [pagina, filtros, ...deps])

  const setFiltros = useCallback((nuevos) => {
    setPagina(1)
    setFiltrosActuales(nuevos)
  }, [])

  // Si se borró lo último de la última página, se vuelve a la anterior
  const ultima = datos.data?.paginas
  useEffect(() => {
    if (ultima && pagina > ultima) setPagina(ultima)
  }, [pagina, ultima])

  return { ...datos, pagina, setPagina, filtros, setFiltros }
}

// Campos de un formulario, recordando si hay cambios sin guardar
export function useFormulario(inicial) {
  const [campos, setCampos] = useState(inicial)
  const [sucio, setSucio] = useState(false)

  useEffect(() => {
    if (!sucio) return
    const avisar = (e) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sucio])

  const set = useCallback((nombre, valor) => {
    setCampos((c) => ({ ...c, [nombre]: valor }))
    setSucio(true)
  }, [])

  return { campos, set, sucio, setSucio }
}

// Hoy en el formato de los campos de fecha: "2026-10-30T14:05:00"
export function ahoraLocal() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
}

export function Aviso({ tipo = 'ok', children }) {
  if (!children) return null
  return (
    <p className={`adm-aviso is-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}

// Título de cada sección, con "Volver al inicio" arriba (inicio: false para no mostrarlo)
export function Cabecera({ titulo, children, inicio = true }) {
  return (
    <>
      {inicio && (
        <Link to="/admin" className="adm-volver adm-cabecera__inicio">
          Volver al inicio
        </Link>
      )}
      <div className="adm-cabecera">
        <h1>{titulo}</h1>
        {children && <div className="adm-cabecera__acciones">{children}</div>}
      </div>
    </>
  )
}

// Barra de arriba de cada formulario: volver, y guardar o publicar
export function BarraEdicion({ volver, sucio, guardando, publicada, onGuardar, ver, error, aviso }) {
  const navigate = useNavigate()
  const { confirmar } = useDialogos()

  async function salir(e) {
    e.preventDefault()
    if (!sucio || (await confirmar(CAMBIOS_SIN_GUARDAR))) navigate(volver)
  }

  return (
    <div className="adm-barra">
      <div className="adm-barra__fila">
        <a href={volver} onClick={salir} className="adm-volver">
          Volver a la lista
        </a>
        <span className={`adm-estado ${publicada ? 'is-publicada' : ''}`}>{publicada ? 'Publicada' : 'Borrador'}</span>
        <div className="adm-barra__botones">
          {ver && publicada && !sucio && (
            <a href={ver} target="_blank" rel="noreferrer" className="adm-link">
              Ver en la web
            </a>
          )}
          {publicada ? (
            <>
              <button type="button" className="adm-btn" disabled={guardando} onClick={() => onGuardar(false)}>
                Pasar a borrador
              </button>
              <button type="button" className="adm-btn is-principal" disabled={guardando} onClick={() => onGuardar(true)}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="adm-btn" disabled={guardando} onClick={() => onGuardar(false)}>
                {guardando ? 'Guardando…' : 'Guardar borrador'}
              </button>
              <button type="button" className="adm-btn is-principal" disabled={guardando} onClick={() => onGuardar(true)}>
                Publicar
              </button>
            </>
          )}
        </div>
      </div>
      <Aviso tipo="error">{error}</Aviso>
      <Aviso>{aviso}</Aviso>
    </div>
  )
}

// Mensaje que deja una pantalla al pasar a otra (ej. "Se guardó")
export function useAvisoRecibido() {
  return useLocation().state?.aviso
}

// Cómo se nombra cada cosa en la papelera y en la actividad
export const TIPOS = {
  nota: 'Nota',
  proyecto: 'Proyecto',
  emprendimiento: 'Emprendimiento',
  rubro: 'Rubro',
  categoria: 'Categoría',
  mensaje: 'Mensaje',
  integrante: 'Integrante',
  evento: 'Evento',
  institucion: 'Institución',
  testimonio: 'Testimonio',
  cuenta: 'Cuenta',
}

// "hace 5 minutos", "hace 2 horas", "ayer"... para lo reciente; después, la fecha
export function hace(iso) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export const fechaYHora = (iso) =>
  new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// Buscador con calendario: un solo día, o desde una fecha, hasta otra, o entre las dos
export function Filtros({ onCambio, placeholder, fechas = true, ayudaFechas, children }) {
  const [buscar, setBuscar] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [unDia, setUnDia] = useState(false)
  const [error, setError] = useState('')

  function aplicar(e) {
    e.preventDefault()
    if (!unDia && desde && hasta && desde > hasta) {
      setError('La fecha "desde" no puede ser posterior a la fecha "hasta".')
      return
    }
    setError('')
    onCambio({ buscar: buscar.trim(), desde, hasta: unDia ? desde : hasta })
  }

  function limpiar() {
    setBuscar('')
    setDesde('')
    setHasta('')
    setUnDia(false)
    setError('')
    onCambio({})
  }

  const hayFiltros = buscar || desde || hasta

  return (
    <form className="adm-filtros" onSubmit={aplicar}>
      <label className="adm-filtros__buscar">
        <span>Buscar</span>
        <input type="search" placeholder={placeholder} value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </label>
      {fechas && (
        <>
          <label>
            <span>{unDia ? 'Fecha' : 'Desde'}</span>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          {!unDia && (
            <label>
              <span>Hasta</span>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </label>
          )}
          <label className="adm-check">
            <input type="checkbox" checked={unDia} onChange={(e) => setUnDia(e.target.checked)} />
            Un solo día
          </label>
        </>
      )}
      {children}
      <div className="adm-filtros__botones">
        <button className="adm-btn">Filtrar</button>
        {hayFiltros && (
          <button type="button" className="adm-btn is-suave" onClick={limpiar}>
            Limpiar
          </button>
        )}
      </div>
      {ayudaFechas && <small className="adm-ayuda adm-filtros__ayuda">{ayudaFechas}</small>}
      <div className="adm-filtros__ayuda">
        <Aviso tipo="error">{error}</Aviso>
      </div>
    </form>
  )
}

// Cantidad de resultados, para que se note cuando un filtro está activo
export function Total({ total, singular, plural }) {
  return (
    <p className="adm-total">
      {total === 1 ? `1 ${singular}` : `${total} ${plural}`}
    </p>
  )
}

export function Fila({ to, foto, titulo, detalle, estado, children }) {
  return (
    <li className="adm-fila">
      <Link to={to} className="adm-fila__principal">
        {foto !== undefined && (
          <span className="adm-fila__foto">{foto ? <img src={foto} alt="" loading="lazy" /> : null}</span>
        )}
        <span className="adm-fila__texto">
          <strong>{titulo}</strong>
          <small>{detalle}</small>
        </span>
      </Link>
      {estado !== undefined && <span className={`adm-estado ${estado ? 'is-publicada' : ''}`}>{estado ? 'Publicada' : 'Borrador'}</span>}
      <div className="adm-fila__acciones">
        <Link to={to} className="adm-btn">
          Editar
        </Link>
        {children}
      </div>
    </li>
  )
}

// Foto principal de una nota, proyecto o emprendimiento
export function CampoFoto({ valor, onChange, titulo = 'Foto principal', ayuda }) {
  const input = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  async function elegir(e) {
    const archivo = e.target.files[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendo(true)
    setError('')
    try {
      onChange(await subirFoto(archivo))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="adm-campo">
      <span className="adm-campo__nombre">{titulo}</span>
      <div className="adm-foto">
        <div className="adm-foto__vista">{valor ? <img src={valor} alt="" /> : <span>Sin foto</span>}</div>
        <div className="adm-foto__botones">
          <input ref={input} type="file" accept="image/*" hidden onChange={elegir} />
          <button type="button" className="adm-btn" disabled={subiendo} onClick={() => input.current.click()}>
            {subiendo ? 'Subiendo…' : valor ? 'Cambiar foto' : 'Elegir foto'}
          </button>
          {valor && (
            <button type="button" className="adm-btn is-suave" disabled={subiendo} onClick={() => onChange('')}>
              Quitar
            </button>
          )}
          {ayuda && <small>{ayuda}</small>}
        </div>
      </div>
      <Aviso tipo="error">{error}</Aviso>
    </div>
  )
}

// Lista de categorías o rubros: agregar, cambiar el nombre y borrar.
// onGuardar(item | null, nombre) y onBorrar(id) devuelven una promesa; si fallan se muestra el motivo.
export function ListaNombres({ items, onGuardar, onBorrar, unidad, tipo, recargar, cuenta }) {
  const [nuevo, setNuevo] = useState('')
  const [editando, setEditando] = useState({})
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)

  const paginas = Math.max(1, Math.ceil(items.length / POR_PAGINA))
  const actual = Math.min(pagina, paginas)
  const visibles = items.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA)

  async function hacer(accion) {
    setError('')
    try {
      await accion()
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  async function agregar(e) {
    e.preventDefault()
    if (nuevo.trim() && (await hacer(() => onGuardar(null, nuevo.trim())))) setNuevo('')
  }

  async function renombrar(item) {
    if (await hacer(() => onGuardar(item, editando[item.id].trim()))) {
      setEditando((e) => {
        const resto = { ...e }
        delete resto[item.id]
        return resto
      })
    }
  }

  const borrar = useBorrar({
    tipo,
    accion: onBorrar,
    nombre: (item) => item.nombre,
    onListo: recargar,
    aclaracion: 'Se puede recuperar desde la Papelera.',
  })

  return (
    <div className="adm-nombres">
      <Aviso tipo="error">{error}</Aviso>
      <ul>
        {visibles.map((item) => {
          const valor = editando[item.id] ?? item.nombre
          return (
            <li key={item.id}>
              <input
                aria-label={`Nombre de ${item.nombre}`}
                value={valor}
                onChange={(e) => setEditando({ ...editando, [item.id]: e.target.value })}
              />
              <small>{cuenta(item.cantidad)}</small>
              {valor.trim() && valor !== item.nombre && (
                <button type="button" className="adm-btn is-principal" onClick={() => renombrar(item)}>
                  Guardar
                </button>
              )}
              <button type="button" className="adm-btn is-peligro" onClick={() => borrar(item)}>
                Borrar
              </button>
            </li>
          )
        })}
      </ul>
      <Pagination page={actual} totalPages={paginas} onChange={setPagina} />
      <form onSubmit={agregar} className="adm-nombres__nuevo">
        <input placeholder={unidad} aria-label={unidad} value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
        <button className="adm-btn">Agregar</button>
      </form>
    </div>
  )
}
