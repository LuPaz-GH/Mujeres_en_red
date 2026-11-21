import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { PetalShape } from '../components/motion/FloatingPetals'
import { cambiarClave, entrar, getMensajes, getSesion, onSesionVencida, salir } from '../api/admin'
import { ErrorMessage, Loader } from '../components/Status'
import { Aviso, Cabecera } from './comun'
import { DialogosProvider } from './Dialogos'
import { Categorias, NotaEditar, Notas } from './Notas'
import { ProyectoEditar, Proyectos } from './Portfolio'
import { FichaEditar, Fichas, Rubros } from './Catalogo'
import Inicio from './Inicio'
import Mensajes from './Mensajes'
import { CuentaEditar, Cuentas } from './Cuentas'
import Actividad from './Actividad'
import Papelera from './Papelera'
import { EquipoLista, IntegranteEditar } from './Equipo'
import Datos from './Datos'
import { EventoEditar, EventosLista } from './Eventos'
import { InstitucionEditar, InstitucionesLista } from './Instituciones'
import { TestimonioEditar, TestimoniosLista } from './Testimonios'
import Visitas from './Visitas'
import './admin.css'

// Panel de administración (/admin): se entra con el link "Acceso" del pie de la web

function FormularioEntrar({ onEntrar, titulo }) {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const { usuaria } = await entrar(email.trim(), clave)
      onEntrar(usuaria)
    } catch (err) {
      setError(err.status && err.status < 500 ? err.message : 'No pudimos conectarnos. Probá de nuevo en un rato.')
      setEnviando(false)
    }
  }

  return (
    <form className="adm-entrar__caja" onSubmit={enviar}>
      <img src="/img/iso.png" alt="" width="64" height="64" />
      <h1>{titulo}</h1>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Correo electrónico</span>
        <input type="email" required autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Contraseña</span>
        <input type="password" required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
      </label>
      <Aviso tipo="error">{error}</Aviso>
      <button className="adm-btn is-principal" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
      <Link to="/" className="adm-volver adm-entrar__volver">
        Volver a la web
      </Link>
    </form>
  )
}

function Cuenta({ usuaria }) {
  const [campos, setCampos] = useState({ actual: '', nueva: '', repetida: '' })
  const [estado, setEstado] = useState({})
  const set = (e) => setCampos({ ...campos, [e.target.name]: e.target.value })

  async function guardar(e) {
    e.preventDefault()
    if (campos.nueva !== campos.repetida) {
      setEstado({ error: 'Las dos contraseñas nuevas no coinciden.' })
      return
    }
    try {
      await cambiarClave(campos.actual, campos.nueva)
      setCampos({ actual: '', nueva: '', repetida: '' })
      setEstado({ aviso: 'Listo, tu contraseña cambió.' })
    } catch (err) {
      setEstado({ error: err.message })
    }
  }

  return (
    <div className="adm-ficha">
      <Cabecera titulo="Mi cuenta" />
      <p className="adm-intro">
        {usuaria.nombre} · {usuaria.email}
      </p>
      <form onSubmit={guardar}>
        <h2>Cambiar la contraseña</h2>
        <label className="adm-campo">
          <span className="adm-campo__nombre">Contraseña actual</span>
          <input type="password" name="actual" required autoComplete="current-password" value={campos.actual} onChange={set} />
        </label>
        <label className="adm-campo">
          <span className="adm-campo__nombre">Contraseña nueva (al menos 8 caracteres)</span>
          <input type="password" name="nueva" required minLength="8" autoComplete="new-password" value={campos.nueva} onChange={set} />
        </label>
        <label className="adm-campo">
          <span className="adm-campo__nombre">Repetí la contraseña nueva</span>
          <input type="password" name="repetida" required autoComplete="new-password" value={campos.repetida} onChange={set} />
        </label>
        <Aviso tipo="error">{estado.error}</Aviso>
        <Aviso>{estado.aviso}</Aviso>
        <button className="adm-btn is-principal">Cambiar contraseña</button>
      </form>
    </div>
  )
}

function Panel({ usuaria, onSalir }) {
  const { pathname } = useLocation()
  const [noLeidos, setNoLeidos] = useState(0)

  const contarMensajes = useCallback(() => {
    getMensajes({ por_pagina: 1 })
      .then(({ no_leidos }) => setNoLeidos(no_leidos))
      .catch(() => {})
  }, [])

  useEffect(contarMensajes, [contarMensajes, pathname])

  const esAdmin = usuaria.rol === 'admin'
  // Las secciones van agrupadas en el menú; cada una lleva un color de los pétalos del logo
  const grupos = [
    {
      titulo: 'Contenido de la web',
      secciones: [
        ['/admin/notas', 'Notas', 'rosa'],
        ['/admin/portfolio', 'Qué hacemos', 'naranja'],
        ['/admin/eventos', 'Eventos', 'celeste'],
        ['/admin/catalogo', 'Catálogo', 'verde'],
        ['/admin/instituciones', 'Instituciones', 'naranja'],
        ['/admin/testimonios', 'Testimonios', 'rosa'],
        ['/admin/equipo', 'Equipo', 'violeta'],
      ],
    },
    {
      titulo: 'Comunicación',
      secciones: [
        ['/admin/mensajes', 'Mensajes', 'celeste'],
        ...(esAdmin ? [['/admin/visitas', 'Visitas', 'verde']] : []),
      ],
    },
    {
      titulo: esAdmin ? 'Administración' : 'Otros',
      secciones: [
        ...(esAdmin
          ? [
              ['/admin/datos', 'Datos de la web', 'verde'],
              ['/admin/cuentas', 'Cuentas', 'rosa'],
              ['/admin/actividad', 'Actividad', 'naranja'],
            ]
          : []),
        ['/admin/papelera', 'Papelera', 'violeta'],
      ],
    },
  ]
  const secciones = grupos.flatMap((g) => g.secciones)
  const enInicio = /^\/admin\/?$/.test(pathname)
  const actual = secciones.find(([to]) => pathname.startsWith(to))
  const fondo = enInicio ? 'inicio' : (actual?.[2] ?? 'violeta')
  const iniciales = usuaria.nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  // Las secciones están detrás del botón "Menú": se abre un panel con los grupos y se cierra al elegir una,
  // al tocar afuera o con la tecla Escape
  const [menuAbierto, setMenuAbierto] = useState(false)
  useEffect(() => setMenuAbierto(false), [pathname])
  useEffect(() => {
    if (!menuAbierto) return
    const cerrar = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !e.target.closest('.adm-menu, .adm-menu-boton')) setMenuAbierto(false)
    }
    document.addEventListener('keydown', cerrar)
    document.addEventListener('pointerdown', cerrar)
    return () => {
      document.removeEventListener('keydown', cerrar)
      document.removeEventListener('pointerdown', cerrar)
    }
  }, [menuAbierto])

  return (
    <div className="adm" data-fondo={fondo} style={{ '--c': `var(--${actual?.[2] ?? 'violeta'})` }}>
      <PetalShape color="rgba(255,255,255,.22)" className="adm-adorno adm-adorno--1" />
      <PetalShape color="rgba(255,255,255,.22)" className="adm-adorno adm-adorno--2" />
      <header className="adm-arriba">
        <Link to="/admin" className="adm-marca">
          <img src="/img/iso.png" alt="" width="32" height="32" />
          Panel
        </Link>
        <button
          type="button"
          className="adm-menu-boton"
          aria-expanded={menuAbierto}
          aria-controls="adm-secciones"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          <span aria-hidden="true">{menuAbierto ? '✕' : '☰'}</span>
          {menuAbierto ? 'Cerrar' : 'Menú'}
          {!menuAbierto && <span className="adm-menu-boton__actual">· {enInicio ? 'Inicio' : (actual?.[1] ?? '')}</span>}
          {!menuAbierto && noLeidos > 0 && <span className="adm-globo">{noLeidos}</span>}
        </button>
        <nav id="adm-secciones" className="adm-menu" aria-label="Secciones del panel" hidden={!menuAbierto}>
          <NavLink to="/admin" end className="adm-menu__inicio">
            <span aria-hidden="true">🏠</span> Inicio del panel
          </NavLink>
          <div className="adm-menu__grupos">
            {grupos.map((g) => (
              <div key={g.titulo} className="adm-menu__grupo">
                <p className="adm-menu__titulo">{g.titulo}</p>
                {g.secciones.map(([to, nombre, color]) => (
                  <NavLink key={to} to={to} data-color={color} style={{ '--c': `var(--${color})` }}>
                    <span className="adm-menu__punto" aria-hidden="true" />
                    {nombre}
                    {nombre === 'Mensajes' && noLeidos > 0 && <span className="adm-globo">{noLeidos}</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </nav>
        <div className="adm-arriba__fin">
          <a href="/" target="_blank" rel="noreferrer" className="adm-arriba__boton is-web">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Ver la web
          </a>
          <Link to="/admin/cuenta" className="adm-yo" title="Mi cuenta">
            <span className="adm-yo__foto" aria-hidden="true">
              {iniciales}
            </span>
            <span className="adm-yo__texto">
              <strong>{usuaria.nombre}</strong>
              <small>{esAdmin ? 'Administradora' : 'Voluntaria'}</small>
            </span>
          </Link>
          <button type="button" onClick={onSalir} className="adm-arriba__boton is-salir">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Salir
          </button>
        </div>
      </header>
      <main className="adm-contenido">
        <Routes>
          <Route path="/admin" element={<Inicio usuaria={usuaria} />} />
          <Route path="/admin/notas" element={<Notas />} />
          <Route path="/admin/notas/categorias" element={<Categorias />} />
          <Route path="/admin/notas/nueva" element={<NotaEditar />} />
          <Route path="/admin/notas/:id" element={<NotaEditar />} />
          <Route path="/admin/portfolio" element={<Proyectos />} />
          <Route path="/admin/portfolio/nuevo" element={<ProyectoEditar />} />
          <Route path="/admin/portfolio/:id" element={<ProyectoEditar />} />
          <Route path="/admin/catalogo" element={<Fichas />} />
          <Route path="/admin/catalogo/rubros" element={<Rubros />} />
          <Route path="/admin/catalogo/nuevo" element={<FichaEditar />} />
          <Route path="/admin/catalogo/:id" element={<FichaEditar />} />
          <Route path="/admin/eventos" element={<EventosLista />} />
          <Route path="/admin/eventos/nuevo" element={<EventoEditar />} />
          <Route path="/admin/eventos/:id" element={<EventoEditar />} />
          <Route path="/admin/testimonios" element={<TestimoniosLista />} />
          <Route path="/admin/testimonios/nuevo" element={<TestimonioEditar />} />
          <Route path="/admin/testimonios/:id" element={<TestimonioEditar />} />
          <Route path="/admin/instituciones" element={<InstitucionesLista />} />
          <Route path="/admin/instituciones/nueva" element={<InstitucionEditar />} />
          <Route path="/admin/instituciones/:id" element={<InstitucionEditar />} />
          <Route path="/admin/equipo" element={<EquipoLista />} />
          <Route path="/admin/equipo/nueva" element={<IntegranteEditar />} />
          <Route path="/admin/equipo/:id" element={<IntegranteEditar />} />
          <Route path="/admin/mensajes" element={<Mensajes onCambio={contarMensajes} />} />
          {esAdmin && <Route path="/admin/datos" element={<Datos />} />}
          {esAdmin && <Route path="/admin/visitas" element={<Visitas />} />}
          {esAdmin && <Route path="/admin/cuentas" element={<Cuentas usuaria={usuaria} />} />}
          {esAdmin && <Route path="/admin/cuentas/nueva" element={<CuentaEditar />} />}
          {esAdmin && <Route path="/admin/cuentas/:id" element={<CuentaEditar />} />}
          {esAdmin && <Route path="/admin/actividad" element={<Actividad />} />}
          <Route path="/admin/papelera" element={<Papelera esAdmin={esAdmin} />} />
          <Route path="/admin/cuenta" element={<Cuenta usuaria={usuaria} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function Admin() {
  const [sesion, setSesion] = useState({ cargando: true })
  const [vencida, setVencida] = useState(false)

  useEffect(() => {
    document.title = 'Panel – Mujeres en Red'
    onSesionVencida(() => setVencida(true))
    getSesion()
      .then(({ usuaria }) => setSesion({ usuaria }))
      .catch((error) => setSesion({ error }))
  }, [])

  async function cerrarSesion() {
    await salir().catch(() => {})
    setSesion({})
  }

  if (sesion.cargando) return <Loader />
  if (sesion.error) return <ErrorMessage error={sesion.error} />

  return (
    <>
      <meta name="robots" content="noindex" />
      {sesion.usuaria ? (
        <DialogosProvider>
          <Panel usuaria={sesion.usuaria} onSalir={cerrarSesion} />
        </DialogosProvider>
      ) : (
        <div className="adm-entrar">
          <FormularioEntrar titulo="Acceso al panel" onEntrar={(usuaria) => setSesion({ usuaria })} />
        </div>
      )}
      {/* Se abre encima para no perder lo que estaba escribiendo: al entrar de nuevo, sigue donde estaba */}
      {vencida && sesion.usuaria && (
        <div className="adm-entrar is-encima" role="dialog" aria-modal="true" aria-label="La sesión se cerró">
          <FormularioEntrar titulo="Se cerró tu sesión. Entrá de nuevo para seguir." onEntrar={() => setVencida(false)} />
        </div>
      )}
    </>
  )
}
