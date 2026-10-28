import { useEffect } from 'react'
import { getPortfolio } from '../api/wp'
import { useWp } from '../api/useWp'
import PageIntro from '../components/PageIntro'
import PortfolioGrid from '../components/PortfolioGrid'
import FloatingPetals from '../components/motion/FloatingPetals'
import { ErrorMessage, Loader } from '../components/Status'
import './pages.css'

export default function Portfolio() {
  const { data: items, loading, error } = useWp(() => getPortfolio(), [])

  useEffect(() => {
    document.title = 'Portfolio – Mujeres en Red'
  }, [])

  return (
    <>
      <PageIntro
        eyebrow="Portfolio"
        title="Proyectos que *transforman* *vidas*"
        lead="Programas y proyectos que impulsamos junto a mujeres de Tucumán y el NOA: capacitación, bienestar, liderazgo y emprendimiento."
      />
      <section className="portfolio-section">
        <FloatingPetals opacity={0.35} />
        <div className="container">
          {loading && <Loader />}
          {error && <ErrorMessage error={error} />}
          {items && <PortfolioGrid items={items} />}
        </div>
      </section>
    </>
  )
}
