import { useState } from 'react'
import { enviarContacto } from '../api/api'

const EMPTY = { nombre: '', email: '', telefono: '', asunto: '', mensaje: '' }

// Formulario de contacto. El mensaje llega por mail a la fundación y queda guardado en el panel.
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
      const res = await enviarContacto({ ...fields, trampa: e.target.elements.trampa.value })
      setStatus({ state: 'ok', message: res.mensaje || '¡Gracias! Tu mensaje fue enviado.' })
      setFields(EMPTY)
      setHuman(false)
    } catch (error) {
      const message = error.status && error.status < 500 ? error.message : 'No se pudo enviar el mensaje. Intentá de nuevo más tarde.'
      setStatus({ state: 'error', message })
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        Tu nombre
        <input name="nombre" type="text" required autoComplete="name" value={fields.nombre} onChange={update} />
      </label>
      <label>
        Tu correo electrónico
        <input name="email" type="email" required autoComplete="email" value={fields.email} onChange={update} />
      </label>
      <label>
        Tu WhatsApp (opcional, para responderte por ahí)
        <input name="telefono" type="tel" autoComplete="tel" placeholder="Ej. 381 5134073" value={fields.telefono} onChange={update} />
      </label>
      <label>
        Asunto
        <input name="asunto" type="text" required value={fields.asunto} onChange={update} />
      </label>
      <label>
        Tu mensaje (opcional)
        <textarea name="mensaje" rows="8" value={fields.mensaje} onChange={update} />
      </label>

      {/* Campo trampa para bots: las personas no lo ven */}
      <input type="text" name="trampa" tabIndex="-1" autoComplete="off" className="hp-field" />

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
