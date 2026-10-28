import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useInView, useMotionValue, useScroll, useTransform } from 'motion/react'
import { WP_URL } from '../api/wp'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import FloatingPetals, { PetalShape } from '../components/motion/FloatingPetals'
import { BRAND } from '../data/brand'
import './QuienesSomos.css'

const img = (path) => `${WP_URL}/wp-content/uploads/${path}`

const PILLARS = [
  {
    title: 'Misión',
    color: BRAND.celeste,
    text: 'Generar espacios de intercambio interdisciplinarios para potenciar el desarrollo de las mujeres de nuestra comunidad.',
  },
  {
    title: 'Equidad',
    color: BRAND.verde,
    text: 'Trabajamos por un mundo más equitativo, con especial apoyo a mujeres en situación de vulnerabilidad social.',
  },
  {
    title: 'Liderazgo',
    color: BRAND.violeta,
    text: 'Somos una plataforma de impulso para mujeres que quieren desarrollar su perfil profesional, emprendedor y de liderazgo. Y un espacio dedicado al bienestar.',
  },
  {
    title: 'Alianzas',
    color: BRAND.rosa,
    text: 'Promovemos lazos, alianzas y vínculos entre diferentes agentes de la sociedad, bajo un esquema de beneficios mutuos.',
  },
  {
    title: 'Alcance',
    color: BRAND.naranja,
    text: 'Desde Tucumán conectamos con mujeres del interior y del NOA, y proyectamos nuestras redes a Latinoamérica y Europa.',
  },
]

// Íconos de línea para los números (brote, calendario, personas, globo)
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const StatIcons = {
  sprout: (
    <svg {...svgProps}>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-7 8-7 0 5-3 7-8 7z" />
      <path d="M12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5z" />
      <path d="M7 21h10" />
    </svg>
  ),
  calendar: (
    <svg {...svgProps}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  ),
  people: (
    <svg {...svgProps}>
      <circle cx="12" cy="7" r="3" />
      <circle cx="5" cy="9" r="2.3" />
      <circle cx="19" cy="9" r="2.3" />
      <path d="M7 20v-1a5 5 0 0 1 10 0v1" />
      <path d="M2 19v-.5A3.5 3.5 0 0 1 6.5 15M22 19v-.5a3.5 3.5 0 0 0-4.5-3.5" />
    </svg>
  ),
  globe: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
}

const STATS = [
  { value: 2012, label: 'Nace la red', from: 1990, icon: 'sprout', color: BRAND.verde },
  { value: new Date().getFullYear() - 2012, prefix: '+', label: 'Años de trabajo', icon: 'calendar', color: BRAND.naranja },
  { value: 3, label: 'Fundadoras', icon: 'people', color: BRAND.rosa },
  { value: 2, label: 'Continentes', icon: 'globe', color: BRAND.celeste },
]

const HISTORY = [
  {
    year: '2012',
    title: 'Empieza la red',
    image: img('2024/01/HISTORIA-2012.jpg'),
    color: BRAND.celeste,
    text: 'Comienza a construirse nuestra red de la mano de Romina Soria, Mercedes Young y Regina Martínez Rieskes. Mercedes y Romina participaron del mentoreo anual de Voces Vitales Argentina durante 2010 y 2011.',
  },
  {
    year: '2012 – 2014',
    title: 'Charlas y conversatorios',
    image: img('2024/01/HISTORIA-2014-1024x683.jpg'),
    color: BRAND.verde,
    text: 'Organizamos charlas de debate y conversatorios sobre género y cómo lo transitan las mujeres en sus distintas profesiones. Avanzamos también en el emprendedurismo femenino, siempre apoyándonos en la capacitación.',
  },
  {
    year: '2015 – 2016',
    title: 'Convocatoria masiva',
    image: img('2024/01/HISTORIA-2015-1024x683.jpg'),
    color: BRAND.violeta,
    text: 'En alianza con Voces Vitales comenzamos a realizar actividades y capacitaciones masivas. Nuestro primer gran desafío: la Global Mentoring Walk, Caminata de Mentoreo, edición Tucumán 2015.',
  },
  {
    year: '2017 – 2023',
    title: 'Redes que crecen',
    image: img('2024/01/HISTORIA-2020-1024x576.jpg'),
    color: BRAND.rosa,
    text: 'Las redes que fuimos creando y la necesidad de trabajar por la equidad de género y el liderazgo femenino de las futuras generaciones nos mantienen en este camino. Cada acción, por pequeña que parezca, representa el cambio que queremos ver.',
  },
  {
    year: '2025',
    title: 'Marca Tucumán',
    image: img('2025/12/20251117_105836-1024x576.jpg'),
    color: BRAND.naranja,
    text: 'El IDEP nos otorgó la distinción Marca Tucumán, un reconocimiento a nuestro compromiso con el desarrollo social y digital de la región.',
    link: '/mujeres-en-red-recibe-la-distincion-marca-tucuman-un-sello-de-calidad-y-orgullo-provincial',
  },
]

const STATEMENT =
  'Inspiramos a las próximas generaciones a convertirse en *líderes* y agentes de cambio, construyendo redes basadas en la *sororidad:* *mujeres* *ayudando* *a* *mujeres.*'

/* ---------- Portada ---------- */
function Hero() {
  const photos = [
    { src: img('2024/01/portada1-1024x500.jpg'), cls: 'qs-hero__photo--1', color: BRAND.rosa },
    { src: img('2024/01/HISTORIA-2015-1024x683.jpg'), cls: 'qs-hero__photo--2', color: BRAND.celeste },
    { src: img('2025/12/DSC_0204-scaled.jpg'), cls: 'qs-hero__photo--3', color: BRAND.verde },
  ]

  return (
    <section className="qs-hero">
      <FloatingPetals opacity={0.8} />
      <div className="container qs-hero__grid">
        <div className="qs-hero__text">
          <Reveal as="p" className="eyebrow">
            Quiénes somos
          </Reveal>
          <h1>
            {['Mujeres', 'ayudando', 'a', 'mujeres'].map((w, i) => (
              <motion.span
                key={i}
                className={`word ${i === 1 ? 'word--rosa' : i === 3 ? 'word--violeta' : ''}`}
                initial={{ opacity: 0, y: 60, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {w}{' '}
              </motion.span>
            ))}
          </h1>
          <Reveal as="p" className="qs-hero__lead" delay={0.5}>
            Somos una organización integrada por mujeres comprometidas con el cambio y la transformación social. Desde
            2012 diseñamos y gestionamos proyectos para mejorar las oportunidades de las mujeres tucumanas.
          </Reveal>
          <Reveal className="buttons" delay={0.6}>
            <Link to="/equipo" className="btn btn--gradient btn--large">
              Conocé al equipo
            </Link>
            <a href="#historia" className="btn btn--outline btn--large">
              Nuestra historia
            </a>
          </Reveal>
        </div>

        <div className="qs-hero__photos">
          {photos.map((p, i) => (
            <motion.div
              key={p.cls}
              className={`qs-hero__photo ${p.cls}`}
              initial={{ opacity: 0, scale: 0.6, rotateY: -60, rotateZ: i % 2 ? 12 : -12 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, rotateZ: [-4, 5, -3][i] }}
              transition={{ delay: 0.3 + i * 0.18, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 1000, '--accent': p.color }}
            >
              <Tilt max={16}>
                <img src={p.src} alt="" />
              </Tilt>
            </motion.div>
          ))}
          <PetalShape color={BRAND.naranja} className="qs-hero__petal qs-hero__petal--1" />
          <PetalShape color={BRAND.celeste} className="qs-hero__petal qs-hero__petal--2" />
        </div>
      </div>
    </section>
  )
}

/* ---------- Frase que se ilumina con el scroll ---------- */
function Word({ children, progress, range, highlight }) {
  const opacity = useTransform(progress, range, [0.15, 1])
  const y = useTransform(progress, range, [12, 0])
  return (
    <motion.span className={`qs-statement__word ${highlight ? 'is-highlight' : ''}`} style={{ opacity, y }}>
      {children}
    </motion.span>
  )
}

function Statement() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const words = STATEMENT.split(' ')

  return (
    <section className="qs-statement" ref={ref}>
      <div className="container">
        <p>
          {words.map((w, i) => {
            const highlight = w.startsWith('*')
            const clean = w.replace(/\*/g, '')
            return (
              <Word
                key={i}
                progress={scrollYProgress}
                range={[i / words.length, (i + 1) / words.length]}
                highlight={highlight}
              >
                {clean}
              </Word>
            )
          })}
        </p>
      </div>
    </section>
  )
}

/* ---------- Pilares ---------- */
function Pillars() {
  return (
    <section className="section qs-pillars">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          Lo que nos mueve
        </Reveal>
        <Reveal as="h2" className="title-xl">
          Cinco pétalos, una red
        </Reveal>
        <div className="qs-pillars__grid">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <Tilt className="qs-pillar" style={{ '--accent': p.color }} max={12}>
                <span className="qs-pillar__num">0{i + 1}</span>
                <PetalShape color="#fff" className="qs-pillar__petal" />
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Números que cuentan solos ---------- */
function Counter({ value, from = 0, prefix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const mv = useMotionValue(from)
  const rounded = useTransform(mv, (v) => prefix + Math.round(v))

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, value, { duration: 2, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [inView, mv, value])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

function Stats() {
  return (
    <section className="qs-stats">
      <div className="container qs-stats__grid">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1}>
            <Tilt className="qs-stat" style={{ '--c': s.color }} max={12}>
              <span className="qs-stat__icon">{StatIcons[s.icon]}</span>
              <strong className="qs-stat__num">
                <Counter value={s.value} from={s.from} prefix={s.prefix} />
              </strong>
              <span className="qs-stat__label">{s.label}</span>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------- Línea de tiempo ---------- */
function History() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section className="section qs-history" id="historia">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          Desde el comienzo
        </Reveal>
        <Reveal as="h2" className="title-xl">
          Nuestra historia
        </Reveal>

        <div className="timeline" ref={ref}>
          <div className="timeline__track" aria-hidden="true">
            <motion.div className="timeline__line" style={{ scaleY: lineScale }} />
          </div>

          {HISTORY.map((h, i) => (
            <div key={h.year} className={`timeline__item ${i % 2 ? 'is-right' : ''}`} style={{ '--accent': h.color }}>
              <motion.span
                className="timeline__dot"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              />
              <motion.div
                className="timeline__card"
                initial={{ opacity: 0, x: i % 2 ? 80 : -80, rotateY: i % 2 ? -35 : 35 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformPerspective: 1200 }}
              >
                <Tilt max={8} className="timeline__tilt">
                  <div className="timeline__img">
                    <img src={h.image} alt="" loading="lazy" />
                  </div>
                  <div className="timeline__body">
                    <span className="timeline__year">{h.year}</span>
                    <h3>{h.title}</h3>
                    <p>{h.text}</p>
                    {h.link && (
                      <Link to={h.link} className="timeline__link">
                        Leer la nota →
                      </Link>
                    )}
                  </div>
                </Tilt>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Cierre ---------- */
function Cta() {
  return (
    <section className="section qs-cta">
      <div className="container">
        <Reveal>
          <Tilt className="qs-cta__card" max={6}>
            <FloatingPetals opacity={0.5} />
            <h2>¿Querés ser parte de la red?</h2>
            <p>Sumate como voluntaria, participá de nuestros programas o ayudanos con una donación.</p>
            <div className="buttons">
              <Link to="/contacto" className="btn btn--white btn--large">
                Escribinos
              </Link>
              <Link to="/donar" className="btn btn--light-outline btn--large">
                Donar
              </Link>
            </div>
          </Tilt>
        </Reveal>
      </div>
    </section>
  )
}

export default function QuienesSomos() {
  useEffect(() => {
    document.title = 'Quiénes somos – Mujeres en Red'
  }, [])

  return (
    <>
      <Hero />
      <Statement />
      <Pillars />
      <Stats />
      <History />
      <Cta />
    </>
  )
}
