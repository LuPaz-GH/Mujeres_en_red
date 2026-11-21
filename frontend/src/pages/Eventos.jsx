import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEventos } from '../api/api'
import { useApi } from '../api/useApi'
import EventoCard from '../components/EventoCard'
import PageIntro from '../components/PageIntro'
import Pagination from '../components/Pagination'
import FloatingPetals from '../components/motion/FloatingPetals'
import Reveal from '../components/motion/Reveal'
import { ErrorMessage, Loader } from '../components/Status'
import './pages.css'

const POR_PAGINA = 6

// Lista con páginas de a 6
function ListaEventos({ eventos, pasado = false }) {
  const [pagina, setPagina] = useState(1)
  const total = Math.ceil(eventos.length / POR_PAGINA)
  const visibles = eventos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  return (
    <>
      <ul className="eventos-grid">
        {visibles.map((e, i) => (
          <li key={e.id}>
            <EventoCard evento={e} index={i} pasado={pasado} />
          </li>
        ))}
      </ul>
      <Pagination page={pagina} totalPages={total} onChange={setPagina} />
    </>
  )
}

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
                <ListaEventos eventos={data.proximos} />
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
                  <ListaEventos eventos={data.pasados} pasado />
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
