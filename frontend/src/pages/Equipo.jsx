import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import PageIntro from '../components/PageIntro'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import FloatingPetals, { PetalShape } from '../components/motion/FloatingPetals'
import { FacebookIcon, InstagramIcon, LinkedinIcon, MailIcon, TiktokIcon } from '../components/Icons'
import { EQUIPO } from '../data/equipo'
import { CONTACT_EMAIL } from '../data/site'
import './pages.css'

const SOCIAL_ICONS = {
  linkedin: { icon: LinkedinIcon, label: 'LinkedIn' },
  instagram: { icon: InstagramIcon, label: 'Instagram' },
  facebook: { icon: FacebookIcon, label: 'Facebook' },
  tiktok: { icon: TiktokIcon, label: 'TikTok' },
}

// Botones de redes de cada integrante (solo las que tiene cargadas)
function MemberSocial({ social, variant }) {
  const entries = Object.entries(social || {}).filter(([key, url]) => url && SOCIAL_ICONS[key])
  if (!entries.length) return null

  return (
    <div className={`member__social member__social--${variant}`}>
      {entries.map(([key, url]) => {
        const { icon: Icon, label } = SOCIAL_ICONS[key]
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon />
            {variant === 'back' && <span>{label}</span>}
          </a>
        )
      })}
    </div>
  )
}

// Tarjeta que gira 180° en 3D: adelante la foto, atrás la biografía
function MemberCard({ m, index }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <Reveal delay={index * 0.15}>
      <div
        className="member"
        style={{ '--accent': m.color }}
        // Con mouse gira al pasar por encima; en el celular gira al tocarla
        onPointerEnter={(e) => e.pointerType === 'mouse' && setFlipped(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setFlipped(false)}
        onClick={() => !window.matchMedia('(hover: hover)').matches && setFlipped(!flipped)}
      >
        <motion.div
          className="member__inner"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        >
          <div className="member__face member__front">
            <div className="member__photo">
              <img src={m.photo} alt={m.name} loading="lazy" />
            </div>
            <PetalShape color={m.color} className="member__petal" />
            <div className="member__info">
              <svg className="member__wave" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 40 C 100 0, 300 0, 400 30 L400 40 Z" />
              </svg>
              <h3>{m.name}</h3>
              <span className="member__role-chip">{m.role}</span>
              <div className="member__actions">
                <span className="member__hint">
                  <span className="member__hint-icon">↻</span> Conocela
                </span>
                <MemberSocial social={m.social} variant="front" />
              </div>
            </div>
          </div>

          <div className="member__face member__back">
            <PetalShape color="#fff" className="member__back-petal" />
            <h3>{m.name}</h3>
            <span className="member__role">{m.role}</span>
            <span className="member__label">Trayectoria</span>
            <ul className="member__bio">
              {m.bio.map((item) => (
                <li key={item}>
                  <PetalShape color="#fff" className="member__bullet" />
                  {item}
                </li>
              ))}
            </ul>
            <MemberSocial social={m.social} variant="back" />
          </div>
        </motion.div>
      </div>
    </Reveal>
  )
}

export default function Equipo() {
  useEffect(() => {
    document.title = 'Equipo – Mujeres en Red'
  }, [])

  return (
    <>
      <PageIntro
        eyebrow="Nuestro equipo"
        title="Las *mujeres* detrás de la *red*"
        lead="Profesionales de distintas disciplinas que ponen su tiempo, su experiencia y su corazón para que la red siga creciendo."
      />

      <section className="section team">
        <FloatingPetals opacity={0.45} />
        <div className="container">
          <div className="team__grid">
            {EQUIPO.map((m, i) => (
              <MemberCard key={m.name} m={m} index={i} />
            ))}
          </div>

          {/* "Sumate" va dentro de la misma sección para que el fondo sea continuo */}
          <Reveal className="join-team">
            <Tilt className="join-team__card" max={6}>
              <img src="/img/iso.png" alt="" className="join-team__flower" aria-hidden="true" />
              <div className="join-team__text">
                <p className="eyebrow eyebrow--light">Sumate</p>
                <h2>¿Te gustaría ser parte del equipo?</h2>
                <p>
                  Mandanos tu CV a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o escribinos contándonos cómo
                  te gustaría colaborar.
                </p>
              </div>
              <div className="join-team__actions">
                <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn--white btn--large">
                  <MailIcon /> Enviar CV
                </a>
                <Link to="/contacto" className="btn btn--light-outline btn--large">
                  Escribinos
                </Link>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </section>
    </>
  )
}
