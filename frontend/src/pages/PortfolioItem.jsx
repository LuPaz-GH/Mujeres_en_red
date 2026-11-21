import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { getPortfolio, getProyecto } from '../api/api'
import { TEMAS, galeriaDe, parseProject, splitTitle } from '../api/portfolio'
import { useApi } from '../api/useApi'
import PortfolioGrid from '../components/PortfolioGrid'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import FloatingPetals, { PetalShape } from '../components/motion/FloatingPetals'
import { WhatsappIcon } from '../components/Icons'
import Galeria from '../components/Galeria'
import Pagination from '../components/Pagination'
import PostCard from '../components/PostCard'
import { ErrorMessage, Loader, NotFound } from '../components/Status'
import { PETAL_COLORS } from '../data/brand'
import { useSitio } from '../api/useSitio'
import './pages.css'
import './PortfolioItem.css'

// Notas por página en "Novedades"
const NOTAS_POR_PAGINA = 6

export default function PortfolioItem() {
  const { slug } = useParams()
  const reduce = useReducedMotion()
  const { data: item, loading, error } = useApi(() => getProyecto(slug), [slug])
  const all = useApi(() => getPortfolio(), [])
  const WHATSAPP_URL = useSitio().whatsappUrl
  const [paginaNotas, setPaginaNotas] = useState(1)

  const index = all.data ? all.data.findIndex((p) => p.slug === slug) : 0
  const tema = TEMAS[slug]?.nombre
  const color = TEMAS[slug]?.color ?? PETAL_COLORS[Math.max(index, 0) % PETAL_COLORS.length]
  const others = all.data ? all.data.filter((p) => p.slug !== slug).slice(0, 3) : []

  const title = item ? splitTitle(item) : null
  const project = useMemo(() => (item ? parseProject(item.contenido) : null), [item])

  const galeria = useMemo(() => (item ? galeriaDe(item, project) : []), [item, project])
  // Tres fotos de la galería (repartidas, sin repetir la principal) para acompañar el texto
  const fotosTexto = useMemo(() => {
    const fotos = galeria.filter((g) => g.tipo === 'foto' && g.url !== item?.foto).map((g) => g.url)
    if (fotos.length <= 3) return fotos
    return [0, Math.floor(fotos.length / 3), Math.floor((fotos.length * 2) / 3)].map((i) => fotos[i])
  }, [galeria, item])

  // Al pasar a otra ficha, las notas vuelven a la primera página
  const [slugNotas, setSlugNotas] = useState(slug)
  if (slugNotas !== slug) {
    setSlugNotas(slug)
    setPaginaNotas(1)
  }

  const pageName = title?.name
  useEffect(() => {
    if (pageName) document.title = `${pageName} – Mujeres en Red`
  }, [pageName])

  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  if (!item) return <NotFound />

  const image = item.foto
  const notas = item.notas ?? []
  const totalPaginasNotas = Math.ceil(notas.length / NOTAS_POR_PAGINA)
  const notasDeLaPagina = notas.slice((paginaNotas - 1) * NOTAS_POR_PAGINA, paginaNotas * NOTAS_POR_PAGINA)
  function irAPaginaNotas(n) {
    setPaginaNotas(n)
    document.getElementById('novedades')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
  const kindLower = title.kind.toLowerCase()

  return (
    <div className={`pi${tema ? ` pi--${tema}` : ''}`} style={{ '--accent': color }}>
      {/* ---------- Portada ---------- */}
      <section className="pi-hero">
        <FloatingPetals opacity={0.6} />
        <div className="container pi-hero__grid">
          <div className="pi-hero__text">
            <Link to="/portfolio" className="pi-back">
              ← Qué hacemos
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
      {/* Un solo párrafo: más grande y acompañado de fotos, para que no quede chiquito y suelto */}
      {project.body.length === 1 && (
        <section className="section pi-body pi-historia">
          <div className="container pi-historia__grid">
            <Reveal className="pi-historia__texto">
              <p className="eyebrow">Nuestra propuesta</p>
              <div className="pi-panel pi-panel--grande" style={{ '--c': PETAL_COLORS[(index + 2) % 5] }}>
                <PetalShape color="var(--c)" className="pi-panel__petal" />
                <p dangerouslySetInnerHTML={{ __html: project.body[0].html }} />
              </div>
            </Reveal>
            {fotosTexto.length > 0 && (
              <div className={`pi-historia__fotos pi-historia__fotos--${fotosTexto.length}`}>
                {fotosTexto.map((src, i) => (
                  <Reveal key={src} delay={0.15 + i * 0.12} className="pi-historia__foto">
                    <img src={src} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {project.body.length > 1 && (
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

      {/* ---------- Fotos y videos (se cargan en "Galería" del panel) ---------- */}
      {galeria.length > 0 && (
        <section className="section pi-gallery">
          <div className="container">
            <Reveal as="p" className="eyebrow">
              En imágenes
            </Reveal>
            <Reveal as="h2" className="title-xl">
              Así lo vivimos
            </Reveal>
            <Galeria key={slug} items={galeria} nombre={title.name} />
          </div>
        </section>
      )}

      {/* ---------- Notas del blog sobre esta ficha ---------- */}
      {notas.length > 0 && (
        <section className="section pi-notas" id="novedades">
          <div className="container">
            <Reveal as="p" className="eyebrow">
              Novedades
            </Reveal>
            <Reveal as="h2" className="title-xl">
              Lo último de {title.name}
            </Reveal>
            <div className="post-grid">
              {notasDeLaPagina.map((n, i) => (
                <PostCard key={n.id} post={n} accent={PETAL_COLORS[(index + i) % PETAL_COLORS.length]} />
              ))}
            </div>
            <Pagination page={paginaNotas} totalPages={totalPaginasNotas} onChange={irAPaginaNotas} />
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

      {/* ---------- Más de lo que hacemos ---------- */}
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
                Ver todo lo que hacemos
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  )
}
