import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import Reveal from './motion/Reveal'
import './SyncraBloque.css'

// Bloque del inicio que presenta a SYNCRA Studios (https://syncrastudios.com.ar/):
// subtitulado inclusivo en vivo y accesibilidad. Textos tomados de su propia web, y con sus colores
// (negro, grilla fina y amarillo), no los de la fundación.

const URL_SYNCRA = 'https://syncrastudios.com.ar/'
const FRASE = 'Conectamos personas, palabra por palabra.'

const SERVICIOS = [
  { icono: '🎤', titulo: 'Subtitulado en vivo', texto: 'Eventos presenciales, congresos, webinars y streaming.' },
  { icono: '🎬', titulo: 'Posproducción', texto: 'Películas, documentales, cursos y videos institucionales.' },
  { icono: '♿', titulo: 'Accesibilidad', texto: 'Para que cada palabra llegue a todo el público.' },
]

// Recuadro que imita un subtítulo en vivo escribiéndose
function SubtituloEnVivo() {
  const reduce = useReducedMotion()
  const [letras, setLetras] = useState(reduce ? FRASE.length : 0)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setLetras((n) => (n >= FRASE.length + 25 ? 0 : n + 1)), 70)
    return () => clearInterval(t)
  }, [reduce])

  return (
    <div className="syncra__pantalla" aria-hidden="true">
      <span className="syncra__vivo">● EN VIVO</span>
      <p className="syncra__subtitulo">
        {FRASE.slice(0, letras)}
        <span className="syncra__cursor" />
      </p>
    </div>
  )
}

export default function SyncraBloque() {
  return (
    <section className="syncra" id="syncra">
      {/* Pastillas grises y puntos amarillos, como en la web de SYNCRA */}
      <div className="syncra__adorno" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={i % 3 === 0 ? 'is-punto' : 'is-pastilla'}
            style={{ '--i': i, '--arriba': `${(i * 37) % 70}%`, '--alto': `${40 + ((i * 13) % 40)}px` }}
          />
        ))}
      </div>
      <div className="container syncra__grid">
        <div className="syncra__texto">
          <Reveal as="p" className="syncra__etiqueta">
            <span aria-hidden="true" /> Accesibilidad e inclusión
          </Reveal>
          <Reveal as="h2" className="syncra__titulo" aria-label="SYNCRA Studios">
            <span className="syncra__marca">SYNCRA</span>
            <span className="syncra__studios">STUDIOS</span>
          </Reveal>
          <Reveal as="p" className="syncra__bajada" delay={0.1}>
            Subtitulado inclusivo y accesibilidad universal.
          </Reveal>
          <Reveal as="p" delay={0.15}>
            SYNCRA Studios es un equipo de estenotipistas profesionales que subtitula en tiempo real eventos, congresos y
            transmisiones por streaming, y también videos grabados. A diferencia de la transcripción automática, capta el
            contexto y la intención de cada frase, para que todas las personas, incluidas las personas sordas o con
            dificultades auditivas, puedan seguir cada palabra.
          </Reveal>
          <ul className="syncra__servicios">
            {SERVICIOS.map((s, i) => (
              <Reveal as="li" key={s.titulo} delay={0.2 + i * 0.08}>
                <span className="syncra__icono" aria-hidden="true">
                  {s.icono}
                </span>
                <span>
                  <strong>{s.titulo}</strong>
                  {s.texto}
                </span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.3}>
            <a href={URL_SYNCRA} target="_blank" rel="noreferrer" className="syncra__boton">
              Conocé SYNCRA Studios
              <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
        </div>
        <Reveal className="syncra__visual" delay={0.15}>
          <SubtituloEnVivo />
          <blockquote className="syncra__frase">
            “{FRASE}”
            <cite>SYNCRA Studios</cite>
          </blockquote>
        </Reveal>
      </div>
    </section>
  )
}
