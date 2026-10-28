import { motion } from 'motion/react'

// Números a mostrar: siempre la primera, la última y las vecinas de la actual (con "…" en los saltos)
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…' + p)
    result.push(p)
  })
  return result
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination-bar" aria-label="Paginado">
      <button
        className="pagination-bar__arrow"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        ←
      </button>

      <div className="pagination-bar__pages">
        {pageList(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="pagination-bar__dots">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`pagination-bar__num ${p === page ? 'is-active' : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p === page && (
                <motion.span
                  layoutId="pagination-active"
                  className="pagination-bar__active"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span>{p}</span>
            </button>
          ),
        )}
      </div>

      <button
        className="pagination-bar__arrow"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
      >
        →
      </button>
    </nav>
  )
}
