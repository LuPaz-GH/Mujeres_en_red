import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatDate, getCategories, getPostsFiltered } from '../api/wp'
import { useWp } from '../api/useWp'
import PageIntro from '../components/PageIntro'
import PostCard from '../components/PostCard'
import PostImage from '../components/PostImage'
import Pagination from '../components/Pagination'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import { SearchIcon } from '../components/Icons'
import { ErrorMessage, Loader } from '../components/Status'
import { PETAL_COLORS } from '../data/brand'
import './pages.css'

const PER_PAGE = 9
// Categorías que se muestran como filtro (las de cada rubro del catálogo se agrupan en "Catálogo 2026")
const FILTER_SLUGS = ['noticias', 'catalogo-2026']
const TODAY = new Date().toISOString().slice(0, 10)

const excerpt = (html) => html.replace(/<[^>]+>/g, '').replace(/\[&hellip;\]|&hellip;/g, '…').replace(/&#8211;/g, '–')

function FeaturedPost({ post }) {
  return (
    <Reveal>
      <Tilt className="featured-post" max={5}>
        <Link to={`/${post.slug}`}>
          <div className="featured-post__img">
            <PostImage post={post} size="large" />
            <span className="featured-post__badge">Lo último</span>
          </div>
          <div className="featured-post__body">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <h2 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
            <p>{excerpt(post.excerpt.rendered)}</p>
            <span className="btn btn--gradient">Leer nota →</span>
          </div>
        </Link>
      </Tilt>
    </Reveal>
  )
}

export default function Blog() {
  // Los filtros se guardan en la dirección (/blog?desde=...&hasta=...&pagina=2):
  // así, al entrar a una nota y volver atrás, siguen puestos
  const [params, setParams] = useSearchParams()
  const category = Number(params.get('cat')) || null
  const search = params.get('q') || ''
  const from = params.get('desde') || ''
  const to = params.get('hasta') || ''
  const page = Number(params.get('pagina')) || 1

  const [query, setQuery] = useState(search)
  const [result, setResult] = useState({ posts: [], total: 0, totalPages: 1 })
  const [state, setState] = useState({ loading: true, error: null })
  const listTop = useRef(null)
  const reduce = useReducedMotion()
  const categories = useWp(getCategories, [])

  // Cambia uno o más filtros en la dirección; los vacíos se sacan.
  // Salvo que se cambie la página, se vuelve a la página 1.
  const updateParams = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!('pagina' in changes)) next.delete('pagina')
          Object.entries(changes).forEach(([k, v]) => {
            if (v === null || v === '' || (k === 'pagina' && v === 1)) next.delete(k)
            else next.set(k, String(v))
          })
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    document.title = 'Blog – Mujeres en Red'
  }, [])

  // Espera a que se deje de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim() !== search) updateParams({ q: query.trim() })
    }, 400)
    return () => clearTimeout(t)
  }, [query, search, updateParams])

  // Si "desde" queda después de "hasta", no se busca (se muestra un aviso)
  const invalidRange = Boolean(from && to && from > to)

  useEffect(() => {
    if (invalidRange) return
    let active = true
    setState({ loading: true, error: null })
    getPostsFiltered({ perPage: PER_PAGE, page, category, search, from, to })
      .then((res) => {
        if (!active) return
        setResult(res)
        setState({ loading: false, error: null })
      })
      .catch((error) => active && setState({ loading: false, error }))
    return () => {
      active = false
    }
  }, [page, category, search, from, to, invalidRange])

  // Cualquier cambio de filtro vuelve a la página 1
  const selectCategory = (id) => updateParams({ cat: id })
  const changeFrom = (value) => updateParams({ desde: value })
  const changeTo = (value) => updateParams({ hasta: value })
  const clearDates = () => updateParams({ desde: null, hasta: null })

  // Al cambiar de página, sube hasta el comienzo de las notas
  function changePage(p) {
    updateParams({ pagina: p })
    if (!listTop.current) return
    const top = listTop.current.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const filters = (categories.data || []).filter((c) => FILTER_SLUGS.includes(c.slug))
  const hasFilters = Boolean(category || search || from || to)
  const { posts, total, totalPages } = result
  // La nota destacada grande solo aparece en la primera página y sin filtros
  const showFeatured = !hasFilters && page === 1 && posts.length > 0
  const [featured, ...rest] = showFeatured ? posts : [null, ...posts]
  const firstShown = (page - 1) * PER_PAGE + 1
  const lastShown = Math.min(page * PER_PAGE, total)

  return (
    <>
      <PageIntro
        eyebrow="Novedades"
        title="Lo que *pasa* en la *red*"
        lead="Encuentros, capacitaciones, logros y las historias de las mujeres que forman parte de Mujeres en Red."
      />

      <section className="section blog-page">
        <div className="container">
          <div className="filters filters--blog">
            <label className="search-box">
              <SearchIcon />
              <input
                type="search"
                name="buscar-notas"
                autoComplete="off"
                placeholder="Buscar notas…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <div className="date-range">
              <label>
                <span>Desde</span>
                <input type="date" value={from} max={to || TODAY} onChange={(e) => changeFrom(e.target.value)} />
              </label>
              <label>
                <span>Hasta</span>
                <input type="date" value={to} min={from || undefined} max={TODAY} onChange={(e) => changeTo(e.target.value)} />
              </label>
              {(from || to) && (
                <button type="button" className="date-range__clear" onClick={clearDates}>
                  Limpiar fechas ✕
                </button>
              )}
            </div>

            <div className="chips">
              <button className={`chip ${!category ? 'is-active' : ''}`} onClick={() => selectCategory(null)}>
                Todas
              </button>
              {filters.map((c, i) => (
                <button
                  key={c.id}
                  className={`chip ${category === c.id ? 'is-active' : ''}`}
                  style={{ '--accent': PETAL_COLORS[(i + 1) % 5] }}
                  onClick={() => selectCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {invalidRange && <p className="empty">La fecha “Desde” tiene que ser anterior a la fecha “Hasta”.</p>}
          {state.error && <ErrorMessage error={state.error} />}

          {!invalidRange && (
            <>
              <div ref={listTop} />

              {!state.loading && total > 0 && (
                <p className="results-info">
                  Mostrando {firstShown}–{lastShown} de {total} {total === 1 ? 'nota' : 'notas'}
                </p>
              )}

              {state.loading ? (
                <Loader />
              ) : (
                <>
                  {featured && <FeaturedPost post={featured} />}

                  <motion.div className="post-grid" layout>
                    <AnimatePresence mode="popLayout">
                      {rest.map((p, i) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={reduce ? false : { opacity: 0, y: 50, rotateX: 25 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                          style={{ transformPerspective: 1000 }}
                        >
                          <PostCard post={p} accent={PETAL_COLORS[i % PETAL_COLORS.length]} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {posts.length === 0 && !state.error && (
                    <p className="empty">
                      No encontramos notas{search ? ` para “${search}”` : ''}
                      {from || to ? ' en esas fechas' : ''}.
                    </p>
                  )}

                  <Pagination page={page} totalPages={totalPages} onChange={changePage} />
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
