import { useState } from 'react'
import { sendContactForm } from '../api/wp'
import { CONTACT_FORM_ID } from '../data/site'

const EMPTY = { 'your-name': '', 'your-email': '', 'your-subject': '', 'your-message': '' }

// Formulario de contacto. Envía al mismo Contact Form 7 que usa hoy WordPress,
// así los mensajes siguen llegando al mismo correo.
export default function ContactForm() {
  const [fields, setFields] = useState(EMPTY)
  const [human, setHuman] = useState(false)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  const update = (e) => setFields({ ...fields, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!human) {
      setStatus({ state: 'error', message: 'Por favor, confirmá que no sos un robot.' })
      return
    }
    setStatus({ state: 'sending', message: '' })
    try {
      const res = await sendContactForm(CONTACT_FORM_ID, {
        ...fields,
        kc_captcha: 'kc_human',
        kc_honeypot: e.target.elements.kc_honeypot.value,
      })
      if (res.status === 'mail_sent') {
        setStatus({ state: 'ok', message: res.message || '¡Gracias! Tu mensaje fue enviado.' })
        setFields(EMPTY)
        setHuman(false)
      } else {
        setStatus({ state: 'error', message: res.message || 'No se pudo enviar el mensaje.' })
      }
    } catch {
      setStatus({ state: 'error', message: 'No se pudo enviar el mensaje. Intentá de nuevo más tarde.' })
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        Tu nombre
        <input name="your-name" type="text" required autoComplete="name" value={fields['your-name']} onChange={update} />
      </label>
      <label>
        Tu correo electrónico
        <input name="your-email" type="email" required autoComplete="email" value={fields['your-email']} onChange={update} />
      </label>
      <label>
        Asunto
        <input name="your-subject" type="text" required value={fields['your-subject']} onChange={update} />
      </label>
      <label>
        Tu mensaje (opcional)
        <textarea name="your-message" rows="8" value={fields['your-message']} onChange={update} />
      </label>

      {/* Campo trampa para bots: las personas no lo ven */}
      <input type="text" name="kc_honeypot" tabIndex="-1" autoComplete="off" className="hp-field" />

      <label className="contact-form__check">
        <input type="checkbox" checked={human} onChange={(e) => setHuman(e.target.checked)} />
        No soy un robot
      </label>

      <button type="submit" className="btn" disabled={status.state === 'sending'}>
        {status.state === 'sending' ? 'Enviando…' : 'Enviar'}
      </button>

      {status.message && <p className={`contact-form__msg is-${status.state}`}>{status.message}</p>}
    </form>
  )
}
