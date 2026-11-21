import { useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { miniatura } from '../api/galeria'
import Lightbox from './Lightbox'
import Pagination from './Pagination'
import './Galeria.css'

// Fotos y videos por página: 12 llenan 3 filas de 4 (o 4 de 3, o 6 de 2), sin huecos
const POR_PAGINA = 12

// De a 4 por fila; si son 3, 6 o 9, de a 3, así no queda una fila a medias
const columnas = (n) => (n % 4 !== 0 && n % 3 === 0 ? 3 : 4)

function Miniatura({ item, alt }) {
  if (item.tipo === 'video') return <video src={`${item.url}#t=0.5`} preload="metadata" muted playsInline aria-label={alt} />
  if (item.tipo === 'instagram') {
    return (
      <span className="galeria__instagram" role="img" aria-label={alt}>
        Ver en Instagram
      </span>
    )
  }
  return <img src={miniatura(item)} alt={alt} loading="lazy" />
}

// Galería con páginas y visor a pantalla completa (se pasa de una a otra con flechas o deslizando)
export default function Galeria({ items, nombre }) {
  const reduce = useReducedMotion()
  const [pagina, setPagina] = useState(1)
  const [abierta, setAbierta] = useState(null)
  const arriba = useRef(null)

  const total = Math.ceil(items.length / POR_PAGINA)
  const desde = (pagina - 1) * POR_PAGINA
  const visibles = items.slice(desde, desde + POR_PAGINA)

  function cambiarPagina(n) {
    setPagina(n)
    arriba.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="galeria" ref={arriba}>
      <div className="galeria__grilla" style={{ '--columnas': columnas(visibles.length) }}>
        {visibles.map((item, i) => {
          const n = desde + i + 1
          return (
            <button
              key={item.url}
              type="button"
              className={`galeria__item${item.tipo !== 'foto' ? ' es-video' : ''}`}
              onClick={() => setAbierta(n - 1)}
              aria-label={`${item.tipo === 'foto' ? 'Ver foto' : 'Ver video'} ${n} de ${items.length}`}
            >
              <Miniatura item={item} alt={`${nombre}, ${n}`} />
              {item.tipo !== 'foto' && (
                <span className="galeria__play" aria-hidden="true">
                  ▶
                </span>
              )}
            </button>
          )
        })}
      </div>
      {total > 1 && (
        <>
          <p className="galeria__cuenta">
            {desde + 1}–{desde + visibles.length} de {items.length}
          </p>
          <Pagination page={pagina} totalPages={total} onChange={cambiarPagina} />
        </>
      )}
      <Lightbox images={items} index={abierta} onChange={setAbierta} onClose={() => setAbierta(null)} />
    </div>
  )
}
