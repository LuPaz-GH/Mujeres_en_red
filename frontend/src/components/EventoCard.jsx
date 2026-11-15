import { PETAL_COLORS } from '../data/brand'
import Reveal from './motion/Reveal'
import Tilt from './motion/Tilt'
import './EventoCard.css'

// "2026-11-20" -> { dia: '20', mes: 'nov', semana: 'jueves', larga: 'jueves 20 de noviembre' }
function partes(fecha) {
  const d = new Date(`${fecha}T12:00:00`)
  return {
    dia: d.toLocaleDateString('es-AR', { day: 'numeric' }),
    mes: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
    larga: d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

// Tarjeta de un evento: fecha grande a la izquierda, datos y botón de inscripción.
// pasado: se ve más apagada y sin botón
export default function EventoCard({ evento, index = 0, pasado = false }) {
  const f = partes(evento.fecha)
  const color = PETAL_COLORS[index % PETAL_COLORS.length]

  return (
    <Reveal delay={(index % 3) * 0.1}>
      <Tilt className={`evento${pasado ? ' is-pasado' : ''}`} style={{ '--accent': color }} max={6}>
        <article id={evento.slug}>
          {evento.foto && <img className="evento__foto" src={evento.foto} alt="" loading="lazy" />}
          <div className="evento__cuerpo">
            <time className="evento__fecha" dateTime={evento.fecha}>
              <strong>{f.dia}</strong>
              <span>{f.mes}</span>
            </time>
            <div className="evento__texto">
              <h3>{evento.titulo}</h3>
              <p className="evento__datos">
                <span>📅 {f.larga}</span>
                {evento.hora && <span>🕒 {evento.hora}</span>}
                {evento.lugar && <span>📍 {evento.lugar}</span>}
              </p>
              {evento.descripcion && <p className="evento__descripcion">{evento.descripcion}</p>}
              {evento.link && !pasado && (
                <a href={evento.link} target="_blank" rel="noreferrer" className="btn evento__boton">
                  Quiero participar →
                </a>
              )}
            </div>
          </div>
        </article>
      </Tilt>
    </Reveal>
  )
}
