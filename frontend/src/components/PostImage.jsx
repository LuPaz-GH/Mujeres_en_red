import { PetalShape } from './motion/FloatingPetals'

// Foto de una nota. Si no tiene foto propia, arma un mosaico con las imágenes que hay dentro de la nota;
// si tampoco hay, muestra la flor sobre color.
export default function PostImage({ post, className = '' }) {
  if (post.foto) return <img src={post.foto} alt="" loading="lazy" className={className} />

  const inside = post.imagenes || []
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
