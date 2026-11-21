import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPortfolio } from '../api/api'
import { CATEGORIAS } from '../api/portfolio'
import { useApi } from '../api/useApi'
import PageIntro from '../components/PageIntro'
import Pagination from '../components/Pagination'
import PortfolioGrid from '../components/PortfolioGrid'
import FloatingPetals from '../components/motion/FloatingPetals'
import Reveal from '../components/motion/Reveal'
import { ErrorMessage, Loader } from '../components/Status'
import './pages.css'

const POR_PAGINA = 6

// Color (del logo) e ícono de cada botón
const ESTILO = {
  programa: {
    color: 'var(--violeta)',
    icono: (
      <path d="M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M8 7h8M8 11h6" />
    ),
  },
  networking: {
    color: 'var(--celeste)',
    icono: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.6c.6-.2 1.3-.3 2-.3 2.8 0 5 2.2 5 5" />
      </>
    ),
  },
  voluntariado: {
    color: 'var(--rosa)',
    icono: (
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
    ),
  },
  deporvida: {
    color: 'var(--verde)',
    icono: (
      <>
        <rect x="9" y="2.5" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
      </>
    ),
  },
}

// "Qué hacemos" (antes Portfolio): un botón por categoría (Programas, Networking, Voluntariado, DeporVida)
// y abajo solo las fichas de la elegida. La elegida queda en la dirección: /portfolio#networking
export default function Portfolio() {
  const { data: items, loading, error } = useApi(() => getPortfolio(), [])
  const { hash } = useLocation()
  const navigate = useNavigate()
  const elegida = CATEGORIAS.find((c) => `#${c.id}` === hash) ?? CATEGORIAS[0]
  const cantidad = (id) => items.filter((p) => (p.categoria || 'proyecto') === id).length
  const fichas = items ? items.filter((p) => (p.categoria || 'proyecto') === elegida.id) : []
  const [pagina, setPagina] = useState({ categoria: elegida.id, numero: 1 })
  const numero = pagina.categoria === elegida.id ? pagina.numero : 1 // al cambiar de botón vuelve a la primera
  const totalPaginas = Math.ceil(fichas.length / POR_PAGINA)
  const fichasDeLaPagina = fichas.slice((numero - 1) * POR_PAGINA, numero * POR_PAGINA)

  useEffect(() => {
    document.title = 'Qué hacemos – Mujeres en Red'
  }, [])

  return (
    <>
      <PageIntro
        eyebrow="Qué hacemos"
        title="Acciones que *transforman* *vidas*"
        lead="Programas, espacios de networking, voluntariado y DeporVida que impulsamos junto a mujeres de Tucumán y el NOA: capacitación, bienestar, liderazgo y emprendimiento."
      />
      <section className="portfolio-section">
        <FloatingPetals opacity={0.35} />
        <div className="container">
          <div className="que-hacemos-botones" role="tablist" aria-label="Qué hacemos">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === elegida.id}
                style={{ '--cat': ESTILO[c.id].color }}
                className={`que-hacemos-boton${c.id === elegida.id ? ' is-activo' : ''}`}
                onClick={() => navigate({ hash: c.id }, { replace: true })}
              >
                <span className="que-hacemos-boton__icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {ESTILO[c.id].icono}
                  </svg>
                </span>
                <span className="que-hacemos-boton__texto">
                  {c.plural}
                  {items && (
                    <small>
                      {cantidad(c.id)} {cantidad(c.id) === 1 ? 'iniciativa' : 'iniciativas'}
                    </small>
                  )}
                </span>
              </button>
            ))}
          </div>

          {loading && <Loader />}
          {error && <ErrorMessage error={error} />}
          {items && (
            <div key={elegida.id} className="que-hacemos-grupo" role="tabpanel">
              <Reveal as="p" className="que-hacemos-grupo__bajada">
                {elegida.bajada}
              </Reveal>
              {fichas.length > 0 ? (
                <>
                  <PortfolioGrid items={fichasDeLaPagina} offset={(numero - 1) * POR_PAGINA} parejo />
                  <Pagination page={numero} totalPages={totalPaginas} onChange={(n) => setPagina({ categoria: elegida.id, numero: n })} />
                </>
              ) : (
                <p className="que-hacemos-grupo__vacio">Pronto vas a encontrar novedades acá.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
