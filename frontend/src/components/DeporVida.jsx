import { Link } from 'react-router-dom'
import { FacebookIcon, GlobeIcon, InstagramIcon } from './Icons'
import Reveal from './motion/Reveal'
import { BRAND } from '../data/brand'
import './DeporVida.css'

// Cuándo y dónde se escucha (los datos salen del cartel del programa)
export function DeporVidaAlAire() {
  return (
    <section className="dv-aire">
      <div className="container dv-aire__fila">
        <Reveal className="dv-aire__titulo">
          <span className="dv-aire__vivo">
            <i aria-hidden="true" /> Por radio
          </span>
          <h2>Todos los sábados</h2>
          <p>LV12 Radio Independencia, Tucumán</p>
        </Reveal>
        <Reveal className="dv-aire__diales" delay={0.1}>
          <span className="dv-aire__dial">
            <small>FM</small>105.1
          </span>
          <span className="dv-aire__dial">
            <small>AM</small>590
          </span>
        </Reveal>
        <Reveal className="dv-aire__links" delay={0.2}>
          <a href="https://www.lv12.com.ar/" target="_blank" rel="noreferrer" className="btn btn--white btn--large">
            <GlobeIcon /> Ir a la web de LV12
          </a>
          <ul>
            <li>
              <a href="https://www.instagram.com/vdepor/" target="_blank" rel="noreferrer">
                <InstagramIcon /> Instagram
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/depor.vida.739" target="_blank" rel="noreferrer">
                <FacebookIcon /> Facebook
              </a>
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

const SUMATE = [
  {
    color: BRAND.rosa,
    titulo: 'Contá tu historia',
    texto: '¿Emprendés, hacés deporte o liderás un proyecto en Tucumán? Escribinos y contanos tu historia.',
    boton: 'Quiero contarla',
    to: '/contacto',
  },
  {
    color: BRAND.verde,
    titulo: 'Conocé a las emprendedoras',
    texto: 'El programa difunde las historias, los servicios y los productos de las integrantes de nuestro Catálogo.',
    boton: 'Ver el Catálogo',
    to: '/catalogo',
  },
  {
    color: BRAND.naranja,
    titulo: 'Patrociná el programa',
    texto: '¿Tenés una empresa o institución? El patrocinio se destina 100% a fines sociales y operativos de la Fundación.',
    boton: 'Quiero patrocinar',
    to: '/contacto',
  },
]

export function DeporVidaSumate() {
  return (
    <section className="section dv-sumate">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          Participá
        </Reveal>
        <Reveal as="h2" className="title-xl">
          Sumate a la radio
        </Reveal>
        <div className="dv-sumate__grilla">
          {SUMATE.map((s, i) => (
            <Reveal key={s.titulo} delay={i * 0.1} className="dv-sumate__tarjeta" style={{ '--c': s.color }}>
              <h3>{s.titulo}</h3>
              <p>{s.texto}</p>
              <Link to={s.to}>{s.boton} →</Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
