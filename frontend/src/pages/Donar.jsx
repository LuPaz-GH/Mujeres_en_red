import { useEffect, useState } from 'react'
import PageIntro from '../components/PageIntro'
import Reveal from '../components/motion/Reveal'
import Tilt from '../components/motion/Tilt'
import FloatingPetals, { PetalShape } from '../components/motion/FloatingPetals'
import { GlobeIcon, MailIcon, WhatsappIcon } from '../components/Icons'
import { BRAND } from '../data/brand'
import { BILLETERAS, DONACIONES } from '../data/donaciones'
import { CONTACT_EMAIL, WHATSAPP_URL } from '../data/site'
import './pages.css'
import './Donar.css'

const IMPACT = [
  {
    title: 'Capacitación',
    text: 'Talleres y ciclos gratuitos de formación en liderazgo, emprendimiento, finanzas y comunicación.',
    color: BRAND.celeste,
  },
  {
    title: 'Acompañamiento',
    text: 'Espacios de bienestar y contención para mujeres en situación de vulnerabilidad.',
    color: BRAND.rosa,
  },
  {
    title: 'Emprendimiento',
    text: 'Impulso a proyectos productivos de mujeres que sostienen la economía de sus barrios.',
    color: BRAND.verde,
  },
]

// Botón que copia un dato (alias, CBU) y avisa "¡Copiado!"
function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* si el navegador no deja copiar, el dato igual queda visible para copiarlo a mano */
    }
  }

  return (
    <div className="copy-field">
      <span className="copy-field__label">{label}</span>
      <div className="copy-field__row">
        <code>{value}</code>
        <button type="button" onClick={copy} className={copied ? 'is-copied' : ''}>
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

// Etiquetas con las billeteras desde las que se puede pagar
function Wallets() {
  return (
    <div className="wallets">
      <span className="wallets__label">Funciona con</span>
      <div className="wallets__list">
        {BILLETERAS.map((b) => (
          <span key={b}>{b}</span>
        ))}
        <span>y más</span>
      </div>
    </div>
  )
}

function Method({ color, icon, title, subtitle, children, delay }) {
  return (
    <Reveal delay={delay}>
      <Tilt className="method" style={{ '--c': color }} max={6}>
        <PetalShape color="#fff" className="method__petal" />
        <div className="method__head">
          <span className="method__icon">{icon}</span>
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="method__body">{children}</div>
      </Tilt>
    </Reveal>
  )
}

export default function Donar() {
  useEffect(() => {
    document.title = 'Donar – Mujeres en Red'
  }, [])

  const t = DONACIONES.transferencia
  const hasTransfer = Boolean(t.alias || t.cbu)
  let i = 0

  return (
    <>
      <PageIntro
        eyebrow="Doná"
        title="Tu aporte *transforma* *vidas*"
        lead="Cada donación se convierte en capacitación, acompañamiento y oportunidades para mujeres de Tucumán y el NOA. Elegí la forma que te quede más cómoda."
      />

      {/* ---------- En qué se usa ---------- */}
      <section className="section donate-impact">
        <div className="container">
          <Reveal as="p" className="eyebrow">
            Impacto local directo
          </Reveal>
          <Reveal as="h2" className="title-xl">
            ¿Qué hacemos con tu aporte?
          </Reveal>
          <div className="impact-grid">
            {IMPACT.map((it, idx) => (
              <Reveal key={it.title} delay={idx * 0.1}>
                <div className="impact" style={{ '--c': it.color }}>
                  <span className="impact__num">0{idx + 1}</span>
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Formas de donar ---------- */}
      <section className="section donate-methods">
        <FloatingPetals opacity={0.35} />
        <div className="container">
          <Reveal as="p" className="eyebrow eyebrow--light">
            Formas de donar
          </Reveal>
          <Reveal as="h2" className="title-xl">
            Elegí cómo ayudar
          </Reveal>

          <div className="methods-grid">
            {DONACIONES.mercadoPago && (
              <Method
                delay={i++ * 0.1}
                color="#009ee3"
                icon={<span className="method__emoji">💳</span>}
                title="Tarjeta, efectivo o Mercado Pago"
                subtitle="Crédito, débito, prepaga, Pago Fácil o Rapipago"
              >
                {/* Pasos del link de pago: el medio de pago se elige en la segunda pantalla de Mercado Pago */}
                <ol className="method__steps">
                  <li>Escribí el monto que quieras donar.</li>
                  <li>
                    Tocá <strong>Continuar</strong>.
                  </li>
                  <li>
                    Elegí cómo pagar. <strong>No necesitás cuenta de Mercado Pago:</strong> usá las opciones de “Sin
                    cuenta de Mercado Pago”.
                  </li>
                </ol>
                {/* Mismas palabras que muestra la pantalla de Mercado Pago, para que se reconozcan al llegar */}
                <div className="mp-options">
                  <div>
                    <strong>💳 Tarjeta</strong>
                    <span>
                      Crédito, débito o prepaga. Sirven las tarjetas de <b>Naranja X, Ualá, Brubank</b> y cualquier Visa
                      o Mastercard.
                    </span>
                  </div>
                  <div>
                    <strong>💳💳 2 tarjetas de crédito</strong>
                    <span>Dividí el monto entre dos tarjetas.</span>
                  </div>
                  <div>
                    <strong>💵 Efectivo</strong>
                    <span>
                      <b>Pago Fácil o Rapipago</b>: te dan un número de referencia (también te llega por mail) para
                      pagar en la sucursal.
                    </span>
                  </div>
                </div>
                <a href={DONACIONES.mercadoPago} target="_blank" rel="noreferrer" className="btn btn--white btn--large">
                  Donar ahora →
                </a>
              </Method>
            )}

            {DONACIONES.qr && (
              <Method
                delay={i++ * 0.1}
                color={BRAND.naranja}
                icon={<span className="method__emoji">📱</span>}
                title="Pagá con QR"
                subtitle="Desde la app de tu billetera o banco"
              >
                <div className="method__qr">
                  <img src={DONACIONES.qr} alt="Código QR para donar a Mujeres en Red" />
                </div>
                <p>Abrí tu billetera, elegí “Pagar con QR”, escaneá el código y poné el monto.</p>
                <Wallets />
              </Method>
            )}

            {hasTransfer && (
              <Method
                delay={i++ * 0.1}
                color={BRAND.violeta}
                icon={<span className="method__emoji">🏦</span>}
                title="Transferencia bancaria"
                subtitle="Desde cualquier banco o billetera virtual"
              >
                <Wallets />
                {t.alias && <CopyField label="Alias" value={t.alias} />}
                {t.cbu && <CopyField label="CBU / CVU" value={t.cbu} />}
                <dl className="method__data">
                  {t.titular && (
                    <>
                      <dt>Titular</dt>
                      <dd>{t.titular}</dd>
                    </>
                  )}
                  {t.cuit && (
                    <>
                      <dt>CUIT</dt>
                      <dd>{t.cuit}</dd>
                    </>
                  )}
                  {t.banco && (
                    <>
                      <dt>Banco</dt>
                      <dd>{t.banco}</dd>
                    </>
                  )}
                </dl>
              </Method>
            )}

            {DONACIONES.paypal && (
              <Method
                delay={i++ * 0.1}
                color={BRAND.celeste}
                icon={<GlobeIcon />}
                title="Desde el exterior"
                subtitle="PayPal, en cualquier moneda"
              >
                <p>Si vivís fuera de Argentina, podés ayudarnos con PayPal.</p>
                <a href={DONACIONES.paypal} target="_blank" rel="noreferrer" className="btn btn--white btn--large">
                  Donar con PayPal →
                </a>
              </Method>
            )}

            <Method
              delay={i++ * 0.1}
              color={BRAND.verde}
              icon={<span className="method__emoji">🤝</span>}
              title="Tiempo, saberes o materiales"
              subtitle="Otra forma de sumar"
            >
              <ul className="method__list">
                <li>Sumate como voluntaria o dictá un taller.</li>
                <li>Doná materiales, insumos o espacios para nuestras actividades.</li>
                <li>Tu empresa puede ser aliada de nuestros programas.</li>
              </ul>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn--white btn--large">
                <WhatsappIcon /> Hablemos
              </a>
            </Method>
          </div>
        </div>
      </section>

      {/* ---------- Comprobante ---------- */}
      <section className="section donate-receipt">
        <div className="container">
          <Reveal>
            <Tilt className="receipt" max={5}>
              <img src="/img/iso.png" alt="" className="receipt__flower" aria-hidden="true" />
              <div className="receipt__text">
                <span className="receipt__heart" aria-hidden="true">
                  ♥
                </span>
                <h3>¿Ya donaste? ¡Gracias!</h3>
                <p>
                  Tu aporte ya está transformando vidas. Si necesitás un comprobante o querés contarnos de tu donación,
                  escribinos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
                <div className="buttons">
                  <a
                    href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Doné a Mujeres en Red')}`}
                    className="btn btn--white btn--large"
                  >
                    <MailIcon /> Escribinos
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn--large receipt__wa">
                    <WhatsappIcon /> WhatsApp
                  </a>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </section>
    </>
  )
}
