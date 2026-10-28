import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

// Visor de fotos a pantalla completa, con flechas, teclado (← → Esc) y contador
export default function Lightbox({ images, index, onChange, onClose }) {
  const open = index !== null && images.length > 0

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
          role="dialog"
          aria-label="Foto ampliada"
        >
          <motion.img
            key={images[index]}
            src={images[index]}
            alt=""
            className="lightbox__img"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
          />

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
                  onChange((index - 1 + images.length) % images.length)
                }}
              >
                ←
              </button>
              <button
                className="lightbox__nav lightbox__nav--next"
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange((index + 1) % images.length)
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
