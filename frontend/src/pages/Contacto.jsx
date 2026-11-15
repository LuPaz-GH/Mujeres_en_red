import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import PageIntro from '../components/PageIntro'
import ContactForm from '../components/ContactForm'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import { FacebookIcon, InstagramIcon, LinkedinIcon, MailIcon, WhatsappIcon } from '../components/Icons'
import { BRAND } from '../data/brand'
import { usuarioDe, useSitio } from '../api/useSitio'
import './pages.css'

export default function Contacto() {
  const sitio = useSitio()
  const CONTACT_EMAIL = sitio.email
  const { social } = sitio
  // Los que se dejan vacíos en el panel (Datos de la web) no aparecen
  const CHANNELS = [
    { label: 'Email', value: sitio.email, href: sitio.email && `mailto:${sitio.email}`, icon: MailIcon, color: BRAND.violeta },
    { label: 'Instagram', value: `@${usuarioDe(social.instagram)}`, href: social.instagram, icon: InstagramIcon, color: BRAND.rosa },
    { label: 'WhatsApp', value: sitio.whatsapp, href: sitio.whatsappUrl, icon: WhatsappIcon, color: BRAND.verde },
    { label: 'Facebook', value: usuarioDe(social.facebook), href: social.facebook, icon: FacebookIcon, color: BRAND.celeste },
    { label: 'LinkedIn', value: 'Mujeres en Red', href: social.linkedin, icon: LinkedinIcon, color: BRAND.naranja },
  ].filter((c) => c.href)

  useEffect(() => {
    document.title = 'Contacto – Mujeres en Red'
  }, [])

  return (
    <>
      <PageIntro
        eyebrow="Contacto"
        title="*Hablemos*"
        lead="¿Querés sumarte, proponer una alianza o contarnos tu idea? Escribinos y te respondemos a la brevedad."
      />

      <section className="section contact">
        <div className="container contact__grid">
          <div className="contact__channels">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon
              return (
                <Reveal key={c.label} delay={i * 0.08}>
                  <Tilt className="channel" style={{ '--accent': c.color }} max={10}>
                    <a href={c.href} target={c.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer">
                      <span className="channel__icon">
                        <Icon />
                      </span>
                      <span className="channel__text">
                        <strong>{c.label}</strong>
                        <span>{c.value}</span>
                      </span>
                      <span className="channel__arrow">→</span>
                    </a>
                  </Tilt>
                </Reveal>
              )
            })}
          </div>

          <Reveal className="contact__form" delay={0.2}>
            <h2>Mandanos un mensaje</h2>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <section className="section contact-extra">
        <div className="container contact-extra__grid">
          <Reveal>
            <Tilt className="extra-card" style={{ '--accent': BRAND.celeste }} max={8}>
              <h3>¿Te gustaría sumarte a nuestro equipo?</h3>
              <p>
                Mandá tu CV a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quiero sumarme al equipo de Mujeres en Red')}`}
                className="btn btn--white"
              >
                <MailIcon /> Enviar CV
              </a>
            </Tilt>
          </Reveal>
          <Reveal delay={0.1}>
            <Tilt className="extra-card" style={{ '--accent': BRAND.rosa }} max={8}>
              <h3>¿Querés ayudar?</h3>
              <p>Tu donación se transforma en capacitación y acompañamiento para mujeres de Tucumán.</p>
              <Link to="/donar" className="btn btn--white">
                Donar
              </Link>
            </Tilt>
          </Reveal>
        </div>
      </section>
    </>
  )
}
