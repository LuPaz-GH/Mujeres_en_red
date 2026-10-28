import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { WP_URL } from '../api/wp'
import ContactForm from './ContactForm'

const SITE_HOSTS = ['mujeresenred.com.ar', 'www.mujeresenred.com.ar']

// Limpia el HTML que devuelve WordPress:
// - saca el encabezado/menú que algunas páginas tienen copiado adentro (lo dibuja React)
// - saca scripts y estilos sueltos
// - convierte los links internos en rutas de React
// - reemplaza el formulario de Contact Form 7 por un lugar donde va el formulario de React
export function cleanWpHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  doc.querySelectorAll('header.wp-block-template-part, script, noscript, style').forEach((el) => el.remove())

  doc.querySelectorAll('a[href]').forEach((a) => {
    try {
      const url = new URL(a.getAttribute('href'), WP_URL)
      const isInternal = SITE_HOSTS.includes(url.hostname) && !url.pathname.startsWith('/wp-content')
      if (isInternal) {
        let path = url.pathname.replace(/\/$/, '') || '/'
        path = path.replace(/^\/portfolio_item\//, '/portfolio/')
        a.setAttribute('href', path + url.hash)
        a.setAttribute('data-internal', '')
        a.removeAttribute('target')
      }
    } catch {
      /* href inválido: se deja como está */
    }
  })

  let hasForm = false
  doc.querySelectorAll('.wpcf7').forEach((form) => {
    const slot = doc.createElement('div')
    slot.setAttribute('data-slot', 'contact-form')
    form.replaceWith(slot)
    hasForm = true
  })

  const firstBlock = doc.body.firstElementChild
  const startsWithCover =
    !!firstBlock && (firstBlock.matches('.wp-block-cover') || !!firstBlock.querySelector(':scope > .wp-block-cover'))

  return { html: doc.body.innerHTML, startsWithCover, hasForm }
}

export default function WpContent({ html, className = '' }) {
  const ref = useRef(null)
  const navigate = useNavigate()
  const [formSlot, setFormSlot] = useState(null)
  const cleaned = useMemo(() => cleanWpHtml(html), [html])

  useLayoutEffect(() => {
    setFormSlot(cleaned.hasForm ? ref.current?.querySelector('[data-slot="contact-form"]') : null)
  }, [cleaned])

  // Navegación sin recargar la página al hacer clic en links internos
  function handleClick(e) {
    const a = e.target.closest('a[data-internal]')
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return
    const href = a.getAttribute('href')
    if (href.startsWith('#')) return
    e.preventDefault()
    navigate(href)
  }

  return (
    <>
      <div
        ref={ref}
        className={`wp-content ${className}`}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: cleaned.html }}
      />
      {formSlot && createPortal(<ContactForm />, formSlot)}
    </>
  )
}
