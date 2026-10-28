import { contentImages, featuredImage } from '../api/wp'
import { PetalShape } from './motion/FloatingPetals'

// Foto de una nota. Si no tiene foto propia (o tiene la imagen gris genérica),
// arma un mosaico con las imágenes que hay dentro de la nota; si tampoco hay, muestra la flor sobre color.
export default function PostImage({ post, size = 'medium_large', className = '' }) {
  const img = featuredImage(post, size)
  if (img) return <img src={img} alt="" loading="lazy" className={className} />

  const inside = contentImages(post, 4)
  if (inside.length > 0) {
    return (
      <div className={`post-mosaic post-mosaic--${inside.length} ${className}`}>
        {inside.map((src) => (
          <span key={src}>
            <img src={src} alt="" loading="lazy" />
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={`post-noimg ${className}`}>
      <PetalShape color="#fff" className="post-noimg__petal" />
    </div>
  )
}
