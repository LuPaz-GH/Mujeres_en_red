import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { formatDate, get } from '../api/api'
import { nombreCategoria } from '../api/portfolio'
import { SearchIcon } from './Icons'
import './Buscador.css'

// Secciones fijas de la web, con palabras con las que alguien las buscaría
const PAGINAS = [
  { titulo: 'Donar', url: '/donar', claves: 'donar donacion donaciones aporte ayudar colaborar mercado pago transferencia alias cbu paypal qr' },
  { titulo: 'Contacto', url: '/contacto', claves: 'contacto contactar escribir mensaje whatsapp mail correo telefono' },
  { titulo: 'Quiénes somos', url: '/quienes-somos', claves: 'quienes somos historia mision vision fundadoras fundacion valores marca tucuman' },
  { titulo: 'Qué hacemos', url: '/portfolio', claves: 'que hacemos programas networking voluntariado deporvida radio proyectos' },
  { titulo: 'Eventos', url: '/eventos', claves: 'eventos agenda proximos encuentros talleres' },
  { titulo: 'Blog', url: '/blog', claves: 'blog notas noticias novedades' },
  { titulo: 'Catálogo', url: '/catalogo', claves: 'catalogo emprendedoras emprendimientos comprar productos servicios' },
  { titulo: 'Sumá tu emprendimiento', url: '/contacto', claves: 'sumar emprendimiento catalogo inscribirme participar voluntaria voluntariado sumarme' },
  { titulo: 'Privacidad', url: '/privacidad', claves: 'privacidad datos cookies' },
]

const GRUPOS = [
  ['pagina', 'Secciones de la web'],
  ['proyecto', 'Qué hacemos'],
  ['nota', 'Notas del blog'],
  ['evento', 'Eventos'],
  ['emprendimiento', 'Catálogo de emprendedoras'],
]

const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function detalle(r) {
  if (r.tipo === 'nota' || r.tipo === 'evento') return r.detalle ? formatDate(r.detalle) : ''
  if (r.tipo === 'proyecto') return nombreCategoria(r.detalle)
  return r.detalle ?? ''
}

// Botón con lupa para el menú. También se abre con Ctrl + K (o Cmd + K en Mac).
export default function Buscador({ alAbrir }) {
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    function atajo(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAbierto(true)
      }
    }
    document.addEventListener('keydown', atajo)
    return () => document.removeEventListener('keydown', atajo)
  }, [])

  return (
    <>
      <button
        type="button"
        className="buscador-boton"
        aria-label="Buscar en la web"
        title="Buscar (Ctrl + K)"
        onClick={() => {
          alAbrir?.()
          setAbierto(true)
        }}
      >
        <SearchIcon />
        <span className="buscador-boton__texto">Buscar</span>
      </button>
      {createPortal(<AnimatePresence>{abierto && <Ventana onCerrar={() => setAbierto(false)} />}</AnimatePresence>, document.body)}
    </>
  )
}

function Ventana({ onCerrar }) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState({ q: '', resultados: [], cargando: false, error: false })
  const [activo, setActivo] = useState(0)
  const input = useRef(null)
  const navigate = useNavigate()

  // Bloquea el fondo mientras está abierto y cierra con Esc
  useEffect(() => {
    input.current?.focus()
    document.body.style.overflow = 'hidden'
    const esc = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', esc)
    }
  }, [onCerrar])

  // Busca mientras se escribe, con una pausita para no pedir en cada letra
  const q = texto.trim()
  useEffect(() => {
    if (q.length < 2) return
    let vigente = true
    const espera = setTimeout(() => {
      setEstado((e) => ({ ...e, cargando: true, error: false }))
      get(`/buscar?q=${encodeURIComponent(q)}`)
        .then((r) => vigente && setEstado({ q, resultados: r.resultados, cargando: false, error: false }))
        .catch(() => vigente && setEstado((e) => ({ ...e, cargando: false, error: true })))
    }, 250)
    return () => {
      vigente = false
      clearTimeout(espera)
    }
  }, [q])

  const palabras = normalizar(q).split(/\s+/).filter((p) => p.length >= 2)
  const paginas = palabras.length
    ? PAGINAS.filter((p) => palabras.every((w) => normalizar(`${p.titulo} ${p.claves}`).includes(w))).map((p) => ({ ...p, tipo: 'pagina' }))
    : []
  const delServidor = estado.q === q ? estado.resultados : []
  const todos = q.length >= 2 ? [...paginas, ...delServidor] : []
  const grupos = GRUPOS.map(([tipo, nombre]) => [nombre, todos.filter((r) => r.tipo === tipo)]).filter(([, l]) => l.length)
  const orden = grupos.flatMap(([, l]) => l)
  const marcado = Math.min(activo, Math.max(orden.length - 1, 0))

  function teclas(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((marcado + 1) % orden.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((marcado - 1 + orden.length) % orden.length)
    } else if (e.key === 'Enter' && orden[marcado]) {
      e.preventDefault()
      navigate(orden[marcado].url)
      onCerrar()
    }
  }

  return (
    <motion.div className="buscador" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCerrar}>
      <motion.div
        className="buscador__caja"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en la web"
        initial={{ y: -30, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="buscador__campo">
          <SearchIcon />
          <input
            ref={input}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Buscar programas, notas, eventos, emprendedoras…"
            aria-label="¿Qué estás buscando?"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setActivo(0)
            }}
            onKeyDown={teclas}
          />
          <button type="button" className="buscador__cerrar" onClick={onCerrar} aria-label="Cerrar el buscador">
            ✕
          </button>
        </div>

        <div className="buscador__resultados" aria-live="polite">
          {q.length < 2 ? (
            <div className="buscador__sugerencias">
              <p>Probá con:</p>
              {['Movimiento Rosa', 'radio', 'emprendedoras', 'donar', 'Coaching'].map((s) => (
                <button key={s} type="button" onClick={() => setTexto(s)}>
                  {s}
                </button>
              ))}
            </div>
          ) : estado.error ? (
            <p className="buscador__vacio">No pudimos buscar ahora. Probá de nuevo en un ratito.</p>
          ) : orden.length === 0 ? (
            <p className="buscador__vacio">{estado.cargando || estado.q !== q ? 'Buscando…' : `No encontramos nada para “${q}”. Probá con otra palabra.`}</p>
          ) : (
            grupos.map(([nombre, lista]) => (
              <section key={nombre}>
                <h2>{nombre}</h2>
                <ul>
                  {lista.map((r) => {
                    const i = orden.indexOf(r)
                    return (
                      <li key={r.tipo + r.url + r.titulo}>
                        <Link to={r.url} onClick={onCerrar} onMouseEnter={() => setActivo(i)} className={`buscador__item${i === marcado ? ' is-activo' : ''}`}>
                          <span className={`buscador__foto buscador__foto--${r.tipo}`}>
                            {r.foto ? <img src={r.foto} alt="" loading="lazy" /> : <SearchIcon />}
                          </span>
                          <span className="buscador__texto">
                            <strong>{r.titulo}</strong>
                            {r.tipo !== 'pagina' && (
                              <small>
                                {detalle(r) && <em>{detalle(r)}</em>}
                                {r.resumen}
                              </small>
                            )}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
        <p className="buscador__pie">
          <kbd>↑</kbd> <kbd>↓</kbd> para moverte · <kbd>Enter</kbd> para abrir · <kbd>Esc</kbd> para cerrar
        </p>
      </motion.div>
    </motion.div>
  )
}
