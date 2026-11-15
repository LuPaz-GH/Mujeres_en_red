import { getInstituciones } from '../api/api'
import { useApi } from '../api/useApi'
import { PETAL_COLORS } from '../data/brand'
import Reveal from './motion/Reveal'
import FloatingPetals from './motion/FloatingPetals'
import './Instituciones.css'

// "Instituciones que nos acompañan" del inicio. Se cargan y ordenan desde el panel (Instituciones).
// Si una institución no tiene logo, se muestran sus iniciales en un color del logo.

const CHICAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en'])

// "Universidad Nacional de Tucumán" -> "UNT"
export function iniciales(nombre) {
  return nombre
    .split(/\s+/)
    .filter((p) => p && !CHICAS.has(p.toLowerCase()))
    .slice(0, 3)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function Institucion({ inst, index }) {
  const color = PETAL_COLORS[index % PETAL_COLORS.length]
  const contenido = (
    <>
      <span className="institucion__logo" style={{ '--color': color }}>
        {inst.logo ? <img src={inst.logo} alt="" loading="lazy" /> : <span aria-hidden="true">{iniciales(inst.nombre)}</span>}
      </span>
      <span className="institucion__nombre">{inst.nombre}</span>
      {inst.detalle && <span className="institucion__detalle">{inst.detalle}</span>}
    </>
  )
  return (
    <Reveal as="li" className="institucion" delay={(index % 4) * 0.06} style={{ '--color': color }}>
      {inst.link ? (
        <a href={inst.link} target="_blank" rel="noreferrer">
          {contenido}
        </a>
      ) : (
        <div>{contenido}</div>
      )}
    </Reveal>
  )
}

export default function Instituciones() {
  const { data } = useApi(() => getInstituciones(), [])
  if (!data?.length) return null // si no hay ninguna cargada, el bloque no aparece

  return (
    <section className="section instituciones" id="instituciones">
      <FloatingPetals opacity={0.45} />
      <div className="container">
        <Reveal as="p" className="eyebrow eyebrow--light">
          Trabajamos en red
        </Reveal>
        <Reveal as="h2" className="title-xl">
          Instituciones que nos acompañan
        </Reveal>
        <ul className="instituciones__grid">
          {data.map((inst, i) => (
            <Institucion key={inst.id} inst={inst} index={i} />
          ))}
        </ul>
      </div>
    </section>
  )
}
