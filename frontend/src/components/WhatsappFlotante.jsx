import { whatsappUrl } from '../api/whatsapp'
import { useSitio } from '../api/useSitio'
import { WhatsappIcon } from './Icons'
import './WhatsappFlotante.css'

// Botón verde de WhatsApp, abajo a la derecha en todas las páginas de la web.
// Usa el número de Datos de la web; si está vacío, no aparece.
export default function WhatsappFlotante() {
  const { whatsapp } = useSitio()
  const url = whatsappUrl(whatsapp, '¡Hola! Les escribo desde la web de Mujeres en Red.')
  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noreferrer" className="wa-flotante" aria-label="Escribinos por WhatsApp">
      <WhatsappIcon />
      <span className="wa-flotante__texto">¿Hablamos?</span>
    </a>
  )
}
