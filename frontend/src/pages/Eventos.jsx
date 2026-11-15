import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEventos } from '../api/api'
import { useApi } from '../api/useApi'
import EventoCard from '../components/EventoCard'
import PageIntro from '../components/PageIntro'
import FloatingPetals from '../components/motion/FloatingPetals'
import Reveal from '../components/motion/Reveal'
import { ErrorMessage, Loader } from '../components/Status'
import './pages.css'

// Eventos: los próximos arriba (el más cercano primero) y los últimos que ya pasaron abajo.
// Se cargan desde el panel, en Eventos.
export default function Eventos() {
  const { data, loading, error } = useApi(() => getEventos(), [])

  useEffect(() => {
    document.title = 'Eventos – Mujeres en Red'
  }, [])

  return (
    <>
      <PageIntro
        eyebrow="Eventos"
        title="Nos *encontramos* en *red*"
        lead="Talleres, encuentros y celebraciones para conocernos, aprender y crecer juntas. ¡Sumate al próximo!"
      />
      <section className="section eventos-page">
        <FloatingPetals opacity={0.35} />
        <div className="container">
          {loading && <Loader />}
          {error && <ErrorMessage error={error} />}
          {data && (
            <>
              <Reveal as="h2" className="eventos-page__titulo">
                Próximos eventos
              </Reveal>
              {data.proximos.length > 0 ? (
                <ul className="eventos-grid">
                  {data.proximos.map((e, i) => (
                    <li key={e.id}>
                      <EventoCard evento={e} index={i} />
                    </li>
                  ))}
                </ul>
              ) : (
                <Reveal className="eventos-page__vacio">
                  <p>Por ahora no hay eventos programados. ¡Seguinos en las redes para enterarte de los próximos!</p>
                  <Link to="/contacto" className="btn btn--white">
                    Escribinos
                  </Link>
                </Reveal>
              )}

              {data.pasados.length > 0 && (
                <>
                  <Reveal as="h2" className="eventos-page__titulo eventos-page__titulo--pasados">
                    Eventos anteriores
                  </Reveal>
                  <ul className="eventos-grid">
                    {data.pasados.map((e, i) => (
                      <li key={e.id}>
                        <EventoCard evento={e} index={i} pasado />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
