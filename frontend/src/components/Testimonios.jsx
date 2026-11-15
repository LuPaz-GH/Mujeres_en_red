import { getTestimonios } from '../api/api'
import { useApi } from '../api/useApi'
import { PETAL_COLORS } from '../data/brand'
import Reveal from './motion/Reveal'
import FloatingPetals from './motion/FloatingPetals'
import './Testimonios.css'

// Testimonios del inicio: frases de mujeres que participaron. Se cargan en el panel (Testimonios).
// Si no hay ninguno, el bloque no aparece.
export default function Testimonios() {
  const { data } = useApi(() => getTestimonios(), [])
  if (!data?.length) return null

  return (
    <section className="section testimonios" id="testimonios">
      <FloatingPetals opacity={0.4} />
      <div className="container">
        <Reveal as="p" className="eyebrow eyebrow--light">
          Sus palabras
        </Reveal>
        <Reveal as="h2" className="title-xl">
          Lo que dicen de la red
        </Reveal>
        <ul className="testimonios__grid">
          {data.map((t, i) => {
            const color = PETAL_COLORS[i % PETAL_COLORS.length]
            return (
              <Reveal as="li" key={t.id} delay={(i % 3) * 0.1} className="testimonio" style={{ '--color': color }}>
                <figure>
                  <span className="testimonio__comillas" aria-hidden="true">
                    “
                  </span>
                  <blockquote>{t.texto}</blockquote>
                  <figcaption>
                    <span className="testimonio__foto">
                      {t.foto ? <img src={t.foto} alt="" loading="lazy" /> : <span aria-hidden="true">{t.nombre.charAt(0).toUpperCase()}</span>}
                    </span>
                    <span>
                      <strong>{t.nombre}</strong>
                      {t.detalle && <small>{t.detalle}</small>}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
