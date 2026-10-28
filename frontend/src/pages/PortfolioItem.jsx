import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { featuredImage, getPortfolio, getPortfolioItem } from '../api/wp'
import { parseProject, splitTitle } from '../api/portfolio'
import { useWp } from '../api/useWp'
import PortfolioGrid from '../components/PortfolioGrid'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import FloatingPetals, { PetalShape } from '../components/motion/FloatingPetals'
import { WhatsappIcon } from '../components/Icons'
import { ErrorMessage, Loader, NotFound } from '../components/Status'
import { PETAL_COLORS } from '../data/brand'
import { WHATSAPP_URL } from '../data/site'
import './pages.css'
import './PortfolioItem.css'

export default function PortfolioItem() {
  const { slug } = useParams()
  const reduce = useReducedMotion()
  const { data: item, loading, error } = useWp(() => getPortfolioItem(slug), [slug])
  const all = useWp(() => getPortfolio(), [])

  const index = all.data ? all.data.findIndex((p) => p.slug === slug) : 0
  const color = PETAL_COLORS[Math.max(index, 0) % PETAL_COLORS.length]
  const others = all.data ? all.data.filter((p) => p.slug !== slug).slice(0, 3) : []

  const title = item ? splitTitle(item.title.rendered) : null
  const project = useMemo(() => (item ? parseProject(item.content.rendered) : null), [item])

  const pageName = title?.name
  useEffect(() => {
    if (pageName) document.title = `${pageName} – Mujeres en Red`
  }, [pageName])

  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  if (!item) return <NotFound />

  const image = featuredImage(item, 'full')
  const kindLower = title.kind.toLowerCase()

  return (
    <div className="pi" style={{ '--accent': color }}>
      {/* ---------- Portada ---------- */}
      <section className="pi-hero">
        <FloatingPetals opacity={0.6} />
        <div className="container pi-hero__grid">
          <div className="pi-hero__text">
            <Link to="/portfolio" className="pi-back">
              ← Portfolio
            </Link>
            {/* Con "reducir movimiento" activado se muestran directo, sin animación */}
            <motion.div
              className="pi-tags"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <span className="pi-kind">{title.kind}</span>
              {project.tags.map((t) => (
                <span key={t} className="pi-tag">
                  {t}
                </span>
              ))}
            </motion.div>
            <h1>
              {title.name.split(' ').map((w, i) => (
                <motion.span
                  key={i}
                  className="word"
                  initial={reduce ? false : { opacity: 0, y: 60, rotateX: 90 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  {w}{' '}
                </motion.span>
              ))}
            </h1>
            {project.lead && (
              <Reveal as="p" className="pi-hero__lead" delay={0.4}>
                <span dangerouslySetInnerHTML={{ __html: project.lead.html }} />
              </Reveal>
            )}
            <Reveal className="buttons" delay={0.55}>
              <Link to="/contacto" className="btn btn--white btn--large">
                Quiero participar
              </Link>
              <Link to="/donar" className="btn btn--large pi-donate">
                ♥ Donar
              </Link>
            </Reveal>
          </div>

          {image && (
            <motion.div
              className="pi-hero__media"
              initial={reduce ? false : { opacity: 0, rotateY: -40, scale: 0.85 }}
              whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 1200 }}
            >
              <div className="pi-hero__backdrop" />
              <Tilt className="pi-hero__frame" max={10}>
                <img src={image} alt={title.name} />
              </Tilt>
              <PetalShape color="#fff" className="pi-hero__petal pi-hero__petal--1" />
              <PetalShape color={PETAL_COLORS[(index + 2) % 5]} className="pi-hero__petal pi-hero__petal--2" />
            </motion.div>
          )}
        </div>
      </section>

      {/* ---------- Ejes (los ítems de la lista) ---------- */}
      {project.keys.length > 0 && (
        <section className="section pi-keys">
          <div className="container">
            <Reveal as="p" className="eyebrow">
              Ejes del {kindLower}
            </Reveal>
            <Reveal as="h2" className="title-xl">
              Lo que vas a vivir
            </Reveal>
            {project.keysIntro && (
              <Reveal as="p" className="lead">
                <span dangerouslySetInnerHTML={{ __html: project.keysIntro.html.replace(/:\s*$/, '.') }} />
              </Reveal>
            )}
            <div className="pi-keys__grid">
              {project.keys.map((k, i) => (
                <Reveal key={i} delay={i * 0.12}>
                  <Tilt className="pi-key" style={{ '--c': PETAL_COLORS[(index + i + 1) % 5] }} max={12}>
                    <span className="pi-key__num">{String(i + 1).padStart(2, '0')}</span>
                    <PetalShape color="#fff" className="pi-key__petal" />
                    {k.title && <h3>{k.title}</h3>}
                    <p dangerouslySetInnerHTML={{ __html: k.html }} />
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Texto ---------- */}
      {project.body.length > 0 && (
        <section className="section pi-body">
          <div className="container pi-body__grid">
            {project.body.map((p, i) => (
              <Reveal key={i} delay={(i % 2) * 0.1}>
                <div className="pi-panel" style={{ '--c': PETAL_COLORS[(index + i + 2) % 5] }}>
                  <PetalShape color="var(--c)" className="pi-panel__petal" />
                  <p dangerouslySetInnerHTML={{ __html: p.html }} />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Frase destacada ---------- */}
      {project.quote && (
        <section className="pi-quote">
          <FloatingPetals opacity={0.5} />
          <div className="container">
            <Reveal>
              <span className="pi-quote__mark" aria-hidden="true">
                “
              </span>
              <p dangerouslySetInnerHTML={{ __html: project.quote.html }} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Invitación ---------- */}
      <section className="section pi-cta">
        <div className="container">
          <Reveal>
            <Tilt className="pi-cta__card" max={6}>
              <img src="/img/iso.png" alt="" className="pi-cta__flower" aria-hidden="true" />
              <div className="pi-cta__text">
                <h2>¿Querés sumarte a {title.name}?</h2>
                <p>Escribinos y te contamos cómo participar de la próxima edición.</p>
                <div className="buttons">
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn--white btn--large">
                    <WhatsappIcon /> WhatsApp
                  </a>
                  <Link to="/contacto" className="btn btn--light-outline btn--large">
                    Escribinos
                  </Link>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </section>

      {/* ---------- Otros proyectos ---------- */}
      {others.length > 0 && (
        <section className="portfolio-section pi-more">
          <div className="container">
            <Reveal as="p" className="eyebrow eyebrow--light">
              Seguí recorriendo
            </Reveal>
            <Reveal as="h2" className="title-xl">
              Otros proyectos
            </Reveal>
            <PortfolioGrid items={others} />
            <Reveal className="buttons buttons--center">
              <Link to="/portfolio" className="btn btn--light-outline btn--large">
                Ver todo el portfolio
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  )
}
