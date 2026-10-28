import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { MENU, SOCIAL } from '../data/site'
import { PETAL_COLORS } from '../data/brand'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from './Icons'

const HIDDEN_KEY = 'mujeresenred:menu-oculto'

// Lee/guarda si el menú quedó oculto (si el navegador no deja, simplemente no se recuerda)
function readHidden() {
  try {
    return localStorage.getItem(HIDDEN_KEY) === '1'
  } catch {
    return false
  }
}

function saveHidden(value) {
  try {
    localStorage.setItem(HIDDEN_KEY, value ? '1' : '0')
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

// Menú oscuro con el logo; la página activa se marca con una píldora de color que se desliza.
// En la portada flota arriba como píldora; en las demás páginas es una barra lateral a la izquierda
// que se puede ocultar (en celular se usa siempre el menú de arriba).
export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(readHidden)
  const { scrollY } = useScroll()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const collapsed = hidden && !isHome

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40))

  useEffect(() => {
    saveHidden(hidden)
  }, [hidden])

  // Avisa al resto de la página si hay barra lateral abierta, para correr el contenido a la derecha
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('has-sidebar', !isHome)
    root.classList.toggle('sidebar-open', !isHome && !hidden)
  }, [isHome, hidden])

  return (
    <motion.header
      className={`site-header ${isHome ? 'is-pill' : 'is-side'} ${scrolled ? 'is-scrolled' : ''} ${collapsed ? 'is-collapsed' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="site-header__inner" aria-hidden={collapsed || undefined}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand__ring">
            <img src="/img/iso.png" alt="" className="brand__iso" width="40" height="40" />
          </span>
          <span className="brand__name">
            Mujeres <em>en</em> Red
          </span>
        </Link>

        <button
          className={`menu-toggle ${open ? 'is-open' : ''}`}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`site-nav ${open ? 'is-open' : ''}`}>
          <ul>
            {MENU.map((item, i) => (
              <li key={item.to} style={{ '--i': i, '--c': PETAL_COLORS[i % PETAL_COLORS.length] }}>
                <NavLink
                  to={item.to}
                  className={item.bold ? 'is-cta' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !item.bold && (
                        <motion.span
                          layoutId="nav-active"
                          className="nav-active"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="nav-label">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="site-header__social">
            <a href={SOCIAL.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="is-ig">
              <InstagramIcon />
            </a>
            <a href={SOCIAL.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="is-fb">
              <FacebookIcon />
            </a>
            <a href={SOCIAL.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="is-li">
              <LinkedinIcon />
            </a>
          </div>
        </nav>

        {!isHome && (
          <button className="menu-collapse" onClick={() => setHidden(true)} aria-label="Ocultar menú" title="Ocultar menú">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Con el menú oculto queda un botoncito para volver a abrirlo */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            className="menu-reopen"
            onClick={() => setHidden(false)}
            aria-label="Mostrar menú"
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <span className="brand__ring brand__ring--sm">
              <img src="/img/iso.png" alt="" className="brand__iso" width="24" height="24" />
            </span>
            Menú
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
