import { Suspense, lazy, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { WP_URL, formatDate, getPortfolio, getPosts } from '../api/wp'
import { useWp } from '../api/useWp'
import PortfolioGrid from '../components/PortfolioGrid'
import { ArrowIcon } from '../components/Icons'
import PostImage from '../components/PostImage'
import { Loader } from '../components/Status'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import FloatingPetals, { PetalShape } from '../components/motion/FloatingPetals'
import { BRAND, PETAL_COLORS } from '../data/brand'

// La flor 3D se carga aparte para que el resto de la página aparezca enseguida
const Flower3D = lazy(() => import('../components/three/Flower3D'))

const img = (path) => `${WP_URL}/wp-content/uploads/${path}`

const PROGRAMS = [
  { title: 'Voluntariado', image: img('2025/05/DSC_0199-1024x683.jpg'), color: BRAND.verde, to: '#' },
  { title: 'Comunicar para Transformar', image: img('2025/10/2-1024x768.jpg'), color: BRAND.celeste, to: '#' },
  { title: 'Coaching Fest', image: img('2025/12/DSC_0035-1024x683.jpg'), color: BRAND.naranja, to: '#' },
]

const HERO_WORDS = ['acompañan', 'sostienen', 'transforman']

function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const flowerY = useTransform(scrollYProgress, [0, 1], [0, 220])
  const flowerScale = useTransform(scrollYProgress, [0, 1], [1, 0.75])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80])

  return (
    <section className="hero" ref={ref}>
      <div className="hero__blobs" aria-hidden="true">
        {PETAL_COLORS.map((c, i) => (
          <span key={c} style={{ '--c': c, '--i': i }} />
        ))}
      </div>

      <div className="container hero__grid">
        <motion.div className="hero__text" style={reduce ? undefined : { y: textY }}>
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Fundación · Tucumán · NOA
          </motion.p>
          <h1>
            {'Construimos redes que'.split(' ').map((w, i) => (
              <motion.span
                key={i}
                className="word"
                initial={{ opacity: 0, y: 50, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {w}{' '}
              </motion.span>
            ))}
            {HERO_WORDS.map((w, i) => (
              <motion.span
                key={w}
                className="word word--color"
                style={{ '--c': [BRAND.rosa, BRAND.celeste, BRAND.verde][i] }}
                initial={{ opacity: 0, y: 50, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {w}
                {i < 1 ? ', ' : i < 2 ? ' y ' : ''}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="hero__lead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Somos una fundación que acompaña a mujeres desde el desarrollo personal, profesional y comunitario en el
            NOA. Te invitamos a sumarte a nuestro catálogo.
          </motion.p>
          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <Link to="/catalogo" className="btn btn--gradient btn--large">
              Ver catálogo
            </Link>
            <Link to="/donar" className="btn btn--white btn--large hero__donate">
              ♥ Donar
            </Link>
          </motion.div>
        </motion.div>

        <motion.div className="hero__flower" style={reduce ? undefined : { y: flowerY, scale: flowerScale }}>
          <div className="hero__flower-glow" aria-hidden="true" />
          {reduce ? (
            <img src="/img/iso.png" alt="Logo de Mujeres en Red" />
          ) : (
            <Suspense fallback={<img src="/img/iso.png" alt="" className="hero__flower-fallback" />}>
              <Flower3D />
            </Suspense>
          )}
        </motion.div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}

function About() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const backY = useTransform(scrollYProgress, [0, 1], [60, -60])
  const frontY = useTransform(scrollYProgress, [0, 1], [-30, 50])

  return (
    <section className="section about" ref={ref}>
      <div className="container about__grid">
        <div className="about__photos">
          <motion.div className="about__photo about__photo--back" style={{ y: backY }}>
            <Tilt max={10}>
              <img src={img('2025/12/DSC_0204-scaled.jpg')} alt="Encuentro de Mujeres en Red" loading="lazy" />
            </Tilt>
          </motion.div>
          <motion.div className="about__photo about__photo--front" style={{ y: frontY }}>
            <Tilt max={14}>
              <img src={img('2025/04/20240928_1109471-1-1024x577.jpg')} alt="Emprender Coaching Fest" loading="lazy" />
            </Tilt>
          </motion.div>
          <PetalShape color={BRAND.rosa} className="about__petal" />
        </div>

        <div>
          <Reveal as="p" className="eyebrow">
            Quiénes somos
          </Reveal>
          <Reveal as="h2" className="title-xl">
            Mujeres en Red
          </Reveal>
          <Reveal as="p" delay={0.1}>
            Somos una organización integrada por mujeres comprometidas con el cambio y la transformación social.
            Creemos firmemente en el impacto positivo que el involucramiento y el compromiso pueden generar cuando las
            mujeres trabajan juntas por un objetivo común.
          </Reveal>
          <Reveal as="p" delay={0.2}>
            Nuestra misión es generar espacios de intercambio interdisciplinarios para potenciar el desarrollo de las
            mujeres en nuestra comunidad. Inspiramos a las próximas generaciones a convertirse en líderes y agentes de
            cambio, construyendo redes basadas en la <strong>sororidad</strong>: mujeres ayudando a mujeres a superar
            desafíos y a alcanzar sus propias metas.
          </Reveal>
          <Reveal className="buttons" delay={0.3}>
            <Link to="/quienes-somos" className="btn">
              Conocenos
            </Link>
            <Link to="/donar" className="btn btn--outline">
              Donar
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Donate() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])

  return (
    <section className="donate" ref={ref}>
      <motion.div
        className="donate__bg"
        style={{ y: bgY, backgroundImage: `url(${img('2025/12/DSC_0073-1024x683.jpg')})` }}
      />
      <div className="donate__overlay" />
      <div className="container">
        <Reveal className="donate__card">
          <h2>¿Por qué donar?</h2>
          <p>
            Donar a <strong>Mujeres en Red</strong> es invertir en el motor de cambio más potente de nuestra comunidad:
            la autonomía femenina. A diferencia de las grandes organizaciones globales, nosotras operamos con un{' '}
            <strong>impacto local directo</strong>, eliminando intermediarios para que cada aporte se convierta en
            servicios de asistencia jurídica, refugio y capacitación técnica para mujeres en situaciones de
            vulnerabilidad.
          </p>
          <p>
            Tu apoyo no es sólo una ayuda asistencial; es el capital semilla que permite a cientos de mujeres romper el
            ciclo de violencia y liderar proyectos productivos que sostienen la economía de nuestros barrios.
          </p>
          <Link to="/donar" className="btn btn--gradient btn--large">
            Quiero donar
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

export default function Home() {
  const portfolio = useWp(() => getPortfolio(6), [])
  const posts = useWp(() => getPosts(5), [])

  useEffect(() => {
    document.title = 'Mujeres en Red – Construir redes de apoyo, formación y transformación.'
  }, [])

  return (
    <>
      <Hero />
      <About />

      {/* Portfolio */}
      <section className="portfolio-section" id="portfolio">
        <FloatingPetals opacity={0.3} />
        <div className="container">
          <Reveal as="p" className="eyebrow eyebrow--light">
            Lo que hacemos
          </Reveal>
          <Reveal as="h2" className="title-xl">
            Proyectos
          </Reveal>
          {portfolio.loading && <Loader />}
          {portfolio.data && <PortfolioGrid items={portfolio.data} />}
          <Reveal className="buttons buttons--center">
            <Link to="/portfolio" className="btn btn--light-outline">
              Ver todos los proyectos
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Programas */}
      <section className="section programs" id="services">
        <div className="container">
          <Reveal as="p" className="eyebrow">
            Nuestros
          </Reveal>
          <Reveal as="h2" className="title-xl">
            Programas
          </Reveal>
          <Reveal as="p" className="lead" delay={0.1}>
            Diseñamos e implementamos programas sociales, formativos y de acompañamiento que impulsan el desarrollo
            integral de las mujeres. A través de capacitaciones, espacios de bienestar, liderazgo, emprendimiento y
            acción comunitaria, brindamos herramientas concretas para fortalecer su autonomía personal, profesional y
            emocional. Cada programa nace del trabajo en red y del compromiso con la transformación social de las
            mujeres de Tucumán y el NOA.
          </Reveal>
          <div className="program-grid">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.15}>
                <Tilt className="program-card" style={{ '--accent': p.color }} max={14}>
                  <Link to={p.to}>
                    <div className="program-card__img" style={{ backgroundImage: `url(${p.image})` }} />
                    <div className="program-card__overlay" />
                    <PetalShape color={p.color} className="program-card__petal" />
                    <div className="program-card__body">
                      <h3>{p.title}</h3>
                      <span>Ver más →</span>
                    </div>
                  </Link>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Donate />

      {/* Blog */}
      <section className="section news" id="news">
        <div className="container">
          <Reveal as="p" className="eyebrow">
            Novedades
          </Reveal>
          <Reveal as="h2" className="title-xl">
            Blog
          </Reveal>
          {posts.loading && <Loader />}
          {posts.data?.length > 0 && (
            <div className="news-mag">
              {/* La más reciente, en grande */}
              <Reveal className="news-mag__main">
                <Tilt className="news-feature" style={{ '--accent': PETAL_COLORS[1] }} max={6}>
                  <Link to={`/${posts.data[0].slug}`}>
                    <PostImage post={posts.data[0]} size="large" className="news-feature__img" />
                    <span className="news-feature__shade" />
                    <span className="news-feature__badge">Lo último</span>
                    <div className="news-feature__body">
                      <time dateTime={posts.data[0].date}>{formatDate(posts.data[0].date)}</time>
                      <h3 dangerouslySetInnerHTML={{ __html: posts.data[0].title.rendered }} />
                      <span className="news-feature__more">
                        Leer nota <ArrowIcon />
                      </span>
                    </div>
                  </Link>
                </Tilt>
              </Reveal>

              {/* Las siguientes, en tarjetas con foto chica */}
              <ul className="news-mag__list">
                {posts.data.slice(1, 5).map((post, i) => (
                  <Reveal as="li" key={post.id} delay={i * 0.08} style={{ '--accent': PETAL_COLORS[(i + 2) % 5] }}>
                    <Link to={`/${post.slug}`} className="news-item">
                      <span className="news-item__img">
                        <PostImage post={post} size="medium" />
                      </span>
                      <span className="news-item__body">
                        <time dateTime={post.date}>{formatDate(post.date)}</time>
                        <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                      </span>
                      <span className="news-item__arrow">
                        <ArrowIcon />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          )}
          {posts.data?.length > 0 && (
            <Reveal className="buttons buttons--center">
              <Link to="/blog" className="btn btn--gradient btn--large">
                Ver todas las notas →
              </Link>
            </Reveal>
          )}

          <Reveal>
            <Tilt className="join" max={5}>
              <div>
                <h3>¿Querés sumarte a nuestro equipo?</h3>
                <p>Mirá cómo participar o escribinos y saludanos.</p>
              </div>
              <Link to="/contacto" className="btn btn--white">
                Escribinos
              </Link>
            </Tilt>
          </Reveal>
        </div>
      </section>
    </>
  )
}
