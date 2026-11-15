import { Link } from 'react-router-dom'
import { getResumen } from '../api/admin'
import { PetalShape } from '../components/motion/FloatingPetals'
import { ErrorMessage, Loader } from '../components/Status'
import { hace, TIPOS, useDatos } from './comun'

// Primera pantalla del panel: accesos rápidos, una tarjeta por sección y lo último que se hizo

// Botones para empezar algo nuevo sin pasar por la lista
const ACCESOS = [
  { to: '/admin/notas/nueva', texto: 'Escribir una nota', icono: '✏️', color: 'rosa' },
  { to: '/admin/portfolio/nuevo', texto: 'Agregar a Qué hacemos', icono: '🌱', color: 'naranja' },
  { to: '/admin/eventos/nuevo', texto: 'Cargar un evento', icono: '📅', color: 'celeste' },
  { to: '/admin/catalogo/nuevo', texto: 'Agregar emprendimiento', icono: '🛍️', color: 'verde' },
  { to: '/admin/equipo/nueva', texto: 'Agregar integrante', icono: '👩', color: 'violeta' },
]

const cuenta = (n, uno, varios) => (n === 1 ? uno : varios)

export default function Inicio({ usuaria }) {
  const { data, loading, error } = useDatos(getResumen)
  const nombre = usuaria.nombre.split(/\s+/)[0]

  return (
    <>
      <div className="adm-saludo">
        <h1>¡Hola, {nombre}!</h1>
        <p>¿Qué querés hacer hoy?</p>
        <div className="adm-accesos">
          {ACCESOS.map((a) => (
            <Link key={a.to} to={a.to} className="adm-acceso" style={{ '--c': `var(--${a.color})` }}>
              <span className="adm-acceso__icono" aria-hidden="true">
                {a.icono}
              </span>
              {a.texto}
            </Link>
          ))}
        </div>
      </div>
      {loading && <Loader />}
      {error && <ErrorMessage error={error} />}
      {data && (
        <div className="adm-tarjetas">
          <Tarjeta to="/admin/notas" color="rosa" numero={data.notas} titulo="Notas" detalle={`${data.borradores} en borrador`} />
          <Tarjeta to="/admin/portfolio" color="naranja" numero={data.proyectos} titulo="Fichas" detalle="En Qué hacemos" />
          <Tarjeta to="/admin/catalogo" color="verde" numero={data.emprendimientos} titulo="Emprendimientos" detalle="En el catálogo" />
          <Tarjeta to="/admin/eventos" color="rosa" numero={data.eventos} titulo={cuenta(data.eventos, 'Próximo evento', 'Próximos eventos')} detalle="En la web" />
          <Tarjeta to="/admin/equipo" color="violeta" numero={data.equipo} titulo="Integrantes" detalle="En Equipo" />
          <Tarjeta
            to="/admin/mensajes"
            color="celeste"
            numero={data.no_leidos}
            titulo={cuenta(data.no_leidos, 'Mensaje sin leer', 'Mensajes sin leer')}
            detalle={`De ${data.mensajes} en total`}
          />
          <Tarjeta to="/admin/papelera" color="violeta" numero={data.papelera} titulo="En la papelera" detalle="Para recuperar" />
        </div>
      )}
      {data && <Novedades novedades={data.novedades} esAdmin={usuaria.rol === 'admin'} />}
    </>
  )
}

function Tarjeta({ to, color, numero, titulo, detalle }) {
  return (
    <Link to={to} className="adm-tarjeta" data-color={color} style={{ '--c': `var(--${color})` }}>
      <PetalShape color="rgba(255,255,255,.3)" className="adm-tarjeta__petalo" />
      <strong>{numero}</strong>
      <span>{titulo}</span>
      <small>{detalle}</small>
    </Link>
  )
}

// "Lo último que pasó": los últimos cambios en el contenido, de cualquier persona del equipo
function Novedades({ novedades, esAdmin }) {
  return (
    <section className="adm-novedades">
      <div className="adm-novedades__cabeza">
        <h2>Lo último que pasó</h2>
        {esAdmin && (
          <Link to="/admin/actividad" className="adm-link">
            Ver toda la actividad
          </Link>
        )}
      </div>
      {novedades.length === 0 ? (
        <p className="adm-novedades__vacio">Todavía no hay cambios. ¡Lo primero que hagas va a aparecer acá!</p>
      ) : (
        <ul>
          {novedades.map((n) => (
            <li key={n.id}>
              <span className="adm-novedades__inicial" aria-hidden="true">
                {n.usuaria.charAt(0).toUpperCase()}
              </span>
              <span className="adm-novedades__texto">
                <strong>{n.usuaria}</strong> {n.accion}
                {TIPOS[n.tipo] && ` ${TIPOS[n.tipo].toLowerCase()}`}
                {n.titulo && <em> {n.titulo}</em>}
              </span>
              <time dateTime={n.fecha}>{hace(n.fecha)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
