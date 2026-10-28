import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import FloatingPetals from './motion/FloatingPetals'

export function Loader() {
  return (
    <div className="status">
      <div className="petal-loader" aria-label="Cargando">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={{ '--i': i }} />
        ))}
      </div>
    </div>
  )
}

export function ErrorMessage({ error }) {
  return (
    <div className="status">
      <p>No pudimos cargar el contenido. {error?.message}</p>
    </div>
  )
}

export function NotFound() {
  return (
    <>
      <PageHero title="Página no encontrada" />
      <div className="status">
        <p>La página que buscás no existe.</p>
        <Link to="/" className="btn">
          Volver al inicio
        </Link>
      </div>
    </>
  )
}

// Portada interna: con imagen (si hay) o con degradé de los colores del logo
export function PageHero({ title, image }) {
  const reduce = useReducedMotion()
  return (
    <section className={`page-hero ${image ? 'has-image' : ''}`}>
      {image && <div className="page-hero__img" style={{ backgroundImage: `url(${image})` }} />}
      <div className="page-hero__overlay" />
      <FloatingPetals opacity={image ? 0.5 : 0.9} />
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 40, rotateX: 40 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 800 }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
    </section>
  )
}
