import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { getPage } from '../api/wp'
import { useWp } from '../api/useWp'
import { parseCatalog } from '../api/catalog'
import PageIntro from '../components/PageIntro'
import Pagination from '../components/Pagination'
import Tilt from '../components/motion/Tilt'
import { PetalShape } from '../components/motion/FloatingPetals'
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
  SearchIcon,
  TiktokIcon,
  WhatsappIcon,
} from '../components/Icons'
import { ErrorMessage, Loader } from '../components/Status'
import { PETAL_COLORS } from '../data/brand'
import './pages.css'

const ICONS = {
  whatsapp: WhatsappIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TiktokIcon,
  email: MailIcon,
  linkedin: LinkedinIcon,
  web: GlobeIcon,
}

const LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  email: 'Email',
  linkedin: 'LinkedIn',
  web: 'Sitio web',
}

const PER_PAGE = 6

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function BusinessCard({ entry, color }) {
  const whatsapp = entry.links.find((l) => l.type === 'whatsapp')
  const others = entry.links.filter((l) => l !== whatsapp)

  return (
    <Tilt className="biz" style={{ '--accent': color }} max={8}>
      {/* Cabecera de color con el logo grande flotando */}
      <div className="biz__cover">
        {entry.img && <div className="biz__cover-bg" style={{ backgroundImage: `url(${entry.img})` }} />}
        <PetalShape color="rgba(255,255,255,.22)" className="biz__deco biz__deco--1" />
        <PetalShape color="rgba(255,255,255,.16)" className="biz__deco biz__deco--2" />
        <span className="biz__tag">{entry.category}</span>
        <div className="biz__logo-ring">
          <div className="biz__logo">
            {entry.img ? <img src={entry.img} alt={entry.name} loading="lazy" /> : <span>{entry.name[0]}</span>}
          </div>
        </div>
      </div>

      <div className="biz__body">
        <h3>{entry.name}</h3>
        <p className="biz__desc">{entry.description}</p>
        <div className="biz__actions">
          {whatsapp && (
            <a href={whatsapp.href} target="_blank" rel="noreferrer" className="biz__wa">
              <WhatsappIcon />
              <span>
                <strong>Escribir por WhatsApp</strong>
                {whatsapp.label && <small>{whatsapp.label}</small>}
              </span>
            </a>
          )}
          {others.length > 0 && (
            <div className="biz__social">
              {others.map((l) => {
                const Icon = ICONS[l.type]
                return (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer" aria-label={LABELS[l.type]} title={LABELS[l.type]}>
                    <Icon />
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Tilt>
  )
}

export default function Catalogo() {
  const { data: page, loading, error } = useWp(() => getPage('catalogo'), [])
  const [category, setCategory] = useState(null)
  const [query, setQuery] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const reduce = useReducedMotion()
  const gridTop = useRef(null)

  // Al cambiar el filtro o la búsqueda se vuelve a la página 1
  function changeCategory(c) {
    setCategory(c)
    setPageNum(1)
  }

  function changeQuery(q) {
    setQuery(q)
    setPageNum(1)
  }

  // Al cambiar de página, sube hasta el comienzo de las tarjetas
  function changePage(p) {
    setPageNum(p)
    if (!gridTop.current) return
    const top = gridTop.current.getBoundingClientRect().top + window.scrollY - 110
    window.scrollTo({ top, behavior: 'smooth' })
  }

  useEffect(() => {
    document.title = 'Catálogo 2026 – Mujeres en Red'
  }, [])

  const catalog = useMemo(() => (page ? parseCatalog(page.content.rendered) : null), [page])
  const colorOf = (cat) => PETAL_COLORS[(catalog?.categories.indexOf(cat) ?? 0) % PETAL_COLORS.length]

  const visible = useMemo(() => {
    if (!catalog) return []
    const q = normalize(query.trim())
    return catalog.entries.filter(
      (e) =>
        (!category || e.category === category) &&
        (!q || normalize(`${e.name} ${e.description} ${e.category}`).includes(q)),
    )
  }, [catalog, category, query])

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const currentPage = Math.min(pageNum, totalPages)
  const pageItems = visible.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  return (
    <>
      <PageIntro
        eyebrow="Catálogo 2026"
        title="Emprendedoras que *inspiran*"
        lead="Emprendimientos y servicios profesionales de las mujeres de nuestra red. Elegí, contactá y apoyá lo local."
      >
        <div className="intro-stats">
          <div>
            <strong>{catalog ? catalog.entries.length : '—'}</strong>
            <span>emprendimientos</span>
          </div>
          <div>
            <strong>{catalog ? catalog.categories.length : '—'}</strong>
            <span>rubros</span>
          </div>
          <Link to="/contacto" className="btn btn--gradient btn--large">
            Sumá tu emprendimiento
          </Link>
        </div>
      </PageIntro>

      <section className="section catalog">
        <div className="container">
          <div className="filters">
            <label className="search-box">
              <SearchIcon />
              <input
                type="search"
                name="buscar-catalogo"
                autoComplete="off"
                placeholder="Buscar: alfajores, ropa, diseño…"
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
              />
            </label>
            {catalog && (
              <div className="chips">
                <button className={`chip ${!category ? 'is-active' : ''}`} onClick={() => changeCategory(null)}>
                  Todos
                </button>
                {catalog.categories.map((c) => (
                  <button
                    key={c}
                    className={`chip ${category === c ? 'is-active' : ''}`}
                    style={{ '--accent': colorOf(c) }}
                    onClick={() => changeCategory(category === c ? null : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && <Loader />}
          {error && <ErrorMessage error={error} />}

          {catalog && visible.length > 0 && (
            <p className="results-info" ref={gridTop}>
              Mostrando {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, visible.length)} de{' '}
              {visible.length} emprendimientos
            </p>
          )}

          <motion.div className="biz-grid" layout>
            <AnimatePresence mode="popLayout">
              {pageItems.map((e, i) => (
                <motion.div
                  key={e.name + e.category}
                  layout
                  initial={reduce ? false : { opacity: 0, scale: 0.8, rotateY: -30 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
                  transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformPerspective: 1000 }}
                >
                  <BusinessCard entry={e} color={colorOf(e.category)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {catalog && visible.length === 0 && <p className="empty">No encontramos emprendimientos con esa búsqueda.</p>}

          <Pagination page={currentPage} totalPages={totalPages} onChange={changePage} />
        </div>
      </section>
    </>
  )
}
