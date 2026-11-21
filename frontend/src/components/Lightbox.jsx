import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { direccionEmbebida } from '../api/galeria'
import './Lightbox.css'

// Cada elemento puede ser la dirección de una foto o { tipo: 'foto' | 'video' | 'youtube', url }
const comoItem = (x) => (typeof x === 'string' ? { tipo: 'foto', url: x } : x)

// Visor de fotos y videos a pantalla completa, con flechas, teclado (← → Esc), deslizar con el dedo y contador
export default function Lightbox({ images, index, onChange, onClose }) {
  const open = index !== null && images.length > 0
  const toque = useRef(null)
  const siguiente = () => onChange((index + 1) % images.length)
  const anterior = () => onChange((index - 1 + images.length) % images.length)

  // En el celular: deslizar a la izquierda pasa a la siguiente, a la derecha vuelve
  function alSoltar(e) {
    if (toque.current === null || images.length < 2) return
    const dx = e.changedTouches[0].clientX - toque.current
    toque.current = null
    if (Math.abs(dx) > 50) (dx < 0 ? siguiente : anterior)()
  }

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, index, images.length, onChange, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
          onTouchEnd={alSoltar}
          role="dialog"
          aria-label="Foto ampliada"
        >
          <Medio key={index} item={comoItem(images[index])} />

          <button className="lightbox__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                className="lightbox__nav lightbox__nav--prev"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation()
                  anterior()
                }}
              >
                ←
              </button>
              <button
                className="lightbox__nav lightbox__nav--next"
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation()
                  siguiente()
                }}
              >
                →
              </button>
              <span className="lightbox__count">
                {index + 1} / {images.length}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Medio({ item }) {
  const animacion = {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.35 },
    onClick: (e) => e.stopPropagation(),
  }
  if (item.tipo === 'video') {
    return <motion.video key={item.url} src={item.url} controls autoPlay playsInline className="lightbox__img lightbox__video" {...animacion} />
  }
  if (item.tipo === 'youtube' || item.tipo === 'instagram') {
    return (
      <motion.div key={item.url} className={`lightbox__youtube${item.tipo === 'instagram' ? ' lightbox__instagram' : ''}`} {...animacion}>
        <iframe
          src={direccionEmbebida(item, true)}
          title={item.tipo === 'youtube' ? 'Video de YouTube' : 'Publicación de Instagram'}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </motion.div>
    )
  }
  return <motion.img key={item.url} src={item.url} alt="" className="lightbox__img" {...animacion} />
}
