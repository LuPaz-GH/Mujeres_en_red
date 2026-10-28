import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { contentImages, featuredImage, formatDate, getAdjacentPosts, getRelatedPosts, postTerms } from '../api/wp'
import PostImage from '../components/PostImage'
import { useWp } from '../api/useWp'
import WpContent from '../components/WpContent'
import PostCard from '../components/PostCard'
import Lightbox from '../components/Lightbox'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import FloatingPetals, { PetalShape } from '../components/motion/FloatingPetals'
import { FacebookIcon, LinkedinIcon, TwitterIcon, WhatsappIcon } from '../components/Icons'
import { PETAL_COLORS } from '../data/brand'
import './pages.css'
import './Post.css'

const GALLERY_PREVIEW = 12 // fotos que se ven antes de "Ver todas"

const decode = (html) => {
  const el = document.createElement('textarea')
  el.innerHTML = html
  return el.value
}

function readingMinutes(html) {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

// Botones para compartir la nota
function Share({ title, variant }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const text = encodeURIComponent(`${title} – Mujeres en Red`)
  const u = encodeURIComponent(url)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* si el navegador no deja copiar, no pasa nada */
    }
  }

  const links = [
    { label: 'WhatsApp', icon: WhatsappIcon, href: `https://wa.me/?text=${text}%20${u}`, c: '#25d366' },
    { label: 'Facebook', icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, c: '#1877f2' },
    { label: 'X', icon: TwitterIcon, href: `https://twitter.com/intent/tweet?text=${text}&url=${u}`, c: '#111' },
    { label: 'LinkedIn', icon: LinkedinIcon, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, c: '#0a66c2' },
  ]

  return (
    <div className={`share share--${variant}`}>
      <span className="share__label">Compartí</span>
      {links.map(({ label, icon: Icon, href, c }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Compartir en ${label}`} title={label} style={{ '--c': c }}>
          <Icon />
        </a>
      ))}
      <button type="button" onClick={copy} className={copied ? 'is-copied' : ''} aria-label="Copiar link" title="Copiar link">
        {copied ? '✓' : '🔗'}
      </button>
    </div>
  )
}

export default function Post({ post }) {
  const reduce = useReducedMotion()
  const bodyRef = useRef(null)
  const heroRef = useRef(null)
  const [lightbox, setLightbox] = useState({ images: [], index: null })

  const title = decode(post.title.rendered)
  const image = featuredImage(post, 'full')
  const hasVisual = Boolean(image) || contentImages(post, 1).length > 0
  const { categories, tags } = postTerms(post)
  const author = post._embedded?.author?.[0]?.name
  const minutes = useMemo(() => readingMinutes(post.content.rendered), [post])
  const accent = PETAL_COLORS[post.id % PETAL_COLORS.length]

  const related = useWp(() => getRelatedPosts(post), [post.id])
  const adjacent = useWp(() => getAdjacentPosts(post), [post.id])

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

  useEffect(() => {
    document.title = `${title} – Mujeres en Red`
  }, [title])

  // Galerías largas: se muestran las primeras fotos y un botón para ver todas (no se oculta nada)
  useEffect(() => {
    const root = bodyRef.current
    if (!root) return
    root.querySelectorAll('.wp-block-gallery').forEach((gallery) => {
      const count = gallery.querySelectorAll('img').length
      if (count <= GALLERY_PREVIEW || gallery.dataset.enhanced) return
      gallery.dataset.enhanced = '1'
      gallery.classList.add('is-collapsed')
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'gallery-more'
      btn.textContent = `Ver las ${count} fotos`
      btn.addEventListener('click', () => {
        gallery.classList.remove('is-collapsed')
        btn.remove()
      })
      gallery.after(btn)
    })
  }, [post.id])

  // Al tocar cualquier foto de la nota se abre en grande
  const handleClick = useCallback((e) => {
    const img = e.target.closest('img')
    if (!img || !bodyRef.current?.contains(img)) return
    e.preventDefault()
    const imgs = [...bodyRef.current.querySelectorAll('img')]
    const full = imgs.map((el) => {
      const link = el.closest('a')?.getAttribute('href')
      return link && /\.(jpe?g|png|webp|gif)$/i.test(link) ? link : el.currentSrc || el.src
    })
    setLightbox({ images: full, index: imgs.indexOf(img) })
  }, [])

  return (
    <article className="blog-post" style={{ '--accent': accent }}>
      {/* ---------- Portada ---------- */}
      <header className={`post-hero ${hasVisual ? 'has-visual' : ''}`} ref={heroRef}>
        {/* De fondo, la misma foto desenfocada (solo da color; la foto completa va en el marco) */}
        {image && (
          <motion.div className="post-hero__bg" style={reduce ? { backgroundImage: `url(${image})` } : { y: bgY, backgroundImage: `url(${image})` }} />
        )}
        <div className="post-hero__overlay" />
        <FloatingPetals opacity={0.5} />
        <div className="container post-hero__content">
          <div className="post-hero__text">
          <Link to="/blog" className="post-back">
            ← Blog
          </Link>
          {categories.length > 0 && (
            <div className="post-cats">
              {categories.map((c, i) => (
                <span key={c.id} style={{ '--c': PETAL_COLORS[(i + 1) % 5] }}>
                  {decode(c.name)}
                </span>
              ))}
            </div>
          )}
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>
          <div className="post-meta">
            <span>📅 {formatDate(post.date)}</span>
            <span>⏱ {minutes} min de lectura</span>
            {author && <span>✍️ {author}</span>}
          </div>
          </div>

          {/* La foto entera, sin recortar; si no tiene foto, el mosaico con las imágenes de la nota */}
          {hasVisual && (
            <motion.figure
              className="post-hero__frame"
              initial={reduce ? false : { opacity: 0, scale: 0.92, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {image ? (
                <img src={image} alt={title} onClick={() => setLightbox({ images: [image], index: 0 })} />
              ) : (
                <div className="post-hero__mosaic">
                  <PostImage post={post} />
                </div>
              )}
            </motion.figure>
          )}
        </div>
      </header>

      {/* ---------- Nota ---------- */}
      <section className="post-main">
        <PetalShape color={accent} className="post-main__petal post-main__petal--1" />
        <PetalShape color={PETAL_COLORS[(post.id + 2) % 5]} className="post-main__petal post-main__petal--2" />
        <div className="post-layout">
          <aside className="post-rail">
            <Share title={title} variant="rail" />
          </aside>

          <div className="post-paper">
            <div ref={bodyRef} onClick={handleClick}>
              <WpContent html={post.content.rendered} className="post-body" />
            </div>

            {tags.length > 0 && (
              <div className="post-tags">
                {tags.map((t) => (
                  <span key={t.id}>#{decode(t.name)}</span>
                ))}
              </div>
            )}

            <Share title={title} variant="inline" />

            <div className="post-signature">
              <span className="post-signature__logo">
                <img src="/img/iso.png" alt="" />
              </span>
              <div>
                <strong>Fundación Mujeres en Red</strong>
                <p>Construimos redes que acompañan, sostienen y transforman la vida de las mujeres de Tucumán y el NOA.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Anterior / siguiente ---------- */}
      {adjacent.data && (adjacent.data.prev || adjacent.data.next) && (
        <nav className="post-adjacent container" aria-label="Más notas">
          {adjacent.data.prev ? (
            <Link to={`/${adjacent.data.prev.slug}`} className="adjacent adjacent--prev">
              <span>← Nota anterior</span>
              <strong>{decode(adjacent.data.prev.title.rendered)}</strong>
            </Link>
          ) : (
            <span />
          )}
          {adjacent.data.next && (
            <Link to={`/${adjacent.data.next.slug}`} className="adjacent adjacent--next">
              <span>Nota siguiente →</span>
              <strong>{decode(adjacent.data.next.title.rendered)}</strong>
            </Link>
          )}
        </nav>
      )}

      {/* ---------- Seguí leyendo ---------- */}
      {related.data?.length > 0 && (
        <section className="section post-related">
          <div className="container">
            <Reveal as="p" className="eyebrow">
              Seguí leyendo
            </Reveal>
            <Reveal as="h2" className="title-xl">
              Más historias de la red
            </Reveal>
            <div className="post-grid">
              {related.data.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.1}>
                  <PostCard post={p} accent={PETAL_COLORS[(i + 1) % 5]} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Invitación ---------- */}
      <section className="section post-cta-wrap">
        <div className="container">
          <Reveal>
            <Tilt className="post-cta" max={5}>
              <img src="/img/iso.png" alt="" className="post-cta__flower" aria-hidden="true" />
              <div className="post-cta__text">
                <h2>¿Te inspiró esta historia?</h2>
                <p>Sumate a la red o ayudanos a que haya muchas más como esta.</p>
                <div className="buttons">
                  <Link to="/contacto" className="btn btn--white btn--large">
                    Quiero sumarme
                  </Link>
                  <Link to="/donar" className="btn btn--large post-cta__donate">
                    ♥ Donar
                  </Link>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </section>

      <Lightbox
        images={lightbox.images}
        index={lightbox.index}
        onChange={(index) => setLightbox((l) => ({ ...l, index }))}
        onClose={() => setLightbox((l) => ({ ...l, index: null }))}
      />
    </article>
  )
}
