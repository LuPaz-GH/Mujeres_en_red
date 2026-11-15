import { Link } from 'react-router-dom'
import { useSitio } from '../api/useSitio'
import { MENU } from '../data/site'
import { ArrowIcon, FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from './Icons'
import Reveal from './motion/Reveal'
import Tilt from './motion/Tilt'
import FloatingPetals from './motion/FloatingPetals'

const YEAR = new Date().getFullYear()

// Bloque "¡Conectate con nosotras!" + pie de página
export default function Footer() {
  const sitio = useSitio()
  const { social } = sitio
  const connect = [
    { label: 'Contacto', to: '/contacto', color: 'var(--celeste)' },
    { label: 'Instagram', href: social.instagram, color: 'var(--rosa)' },
    { label: 'WhatsApp', href: sitio.whatsappUrl, color: 'var(--verde)' },
  ].filter((c) => c.to || c.href)

  return (
    <>
      <section className="social-cta">
        <FloatingPetals opacity={0.35} />
        <div className="container">
          <Reveal as="h2">¡Conectate con nosotras!</Reveal>
          <div className="social-cta__grid">
            {connect.map((c, i) => {
              const content = (
                <>
                  <span>{c.label}</span>
                  <ArrowIcon />
                </>
              )
              return (
                <Reveal key={c.label} delay={i * 0.1}>
                  <Tilt className="social-cta__item" style={{ '--accent': c.color }} max={10}>
                    {c.to ? (
                      <Link to={c.to}>{content}</Link>
                    ) : (
                      <a href={c.href} target="_blank" rel="noreferrer">
                        {content}
                      </a>
                    )}
                  </Tilt>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="petal-bar" aria-hidden="true" />
        <div className="container site-footer__grid">
          <div>
            <Link to="/" className="brand brand--footer">
              <span className="brand__iso-wrap">
                <img src="/img/iso.png" alt="" className="brand__iso" width="56" height="56" />
              </span>
              <span className="brand__name">
                Mujeres <em>en</em> Red
              </span>
            </Link>
            <p>
              Buscamos generar espacios de intercambio interdisciplinarios para potenciar el desarrollo de las mujeres
              de nuestra comunidad. Queremos inspirar a las próximas generaciones de mujeres a ser líderes y agentes
              transformadoras de nuestra comunidad.
            </p>
            <Link to="/donar" className="btn btn--gradient">
              Donar
            </Link>
          </div>
          <div>
            <h3>Navegá</h3>
            <ul className="site-footer__links">
              {MENU.map((m) => (
                <li key={m.to}>
                  <Link to={m.to}>{m.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Seguinos</h3>
            <div className="site-footer__social">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
                  <TwitterIcon />
                </a>
              )}
              {social.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <LinkedinIcon />
                </a>
              )}
            </div>
            {sitio.email && (
              <p className="site-footer__mail">
                <a href={`mailto:${sitio.email}`}>{sitio.email}</a>
              </p>
            )}
          </div>
        </div>
        <div className="container site-footer__bottom">
          <p>
            © {YEAR} Fundación Mujeres en Red · Tucumán, Argentina
            {sitio.transparencia.cuit && ` · CUIT ${sitio.transparencia.cuit}`} · <Link to="/privacidad">Privacidad</Link> ·{' '}
            <Link to="/admin">Acceso</Link>
          </p>        </div>
      </footer>
    </>
  )
}
