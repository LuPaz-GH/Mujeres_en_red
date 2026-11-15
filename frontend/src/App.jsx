import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import Header from './components/Header'
import Footer from './components/Footer'
import { Loader, NotFound } from './components/Status'
import ScrollProgress from './components/motion/ScrollProgress'
import Home from './pages/Home'
import QuienesSomos from './pages/QuienesSomos'
import Equipo from './pages/Equipo'
import Catalogo from './pages/Catalogo'
import Contacto from './pages/Contacto'
import Donar from './pages/Donar'
import Blog from './pages/Blog'
import Portfolio from './pages/Portfolio'
import Eventos from './pages/Eventos'
import Privacidad from './pages/Privacidad'
import WhatsappFlotante from './components/WhatsappFlotante'
import PortfolioItem from './pages/PortfolioItem'
import SlugPage from './pages/SlugPage'
import { registrarVisita } from './api/api'
import { EQUIPO_VISIBLE } from './data/site'

// El panel se descarga aparte: quien visita la web no lo necesita
const Admin = lazy(() => import('./admin/Admin'))

// Cuenta cada página que se abre, para los gráficos de Visitas del panel
function ContarVisita() {
  const { pathname } = useLocation()
  useEffect(() => {
    registrarVisita(pathname)
  }, [pathname])
  return null
}

// Al cambiar de página se arranca desde arriba. Y si se toca un link a la página en la que ya se está
// (ej. el logo "Mujeres en Red" estando en el inicio), como la dirección no cambia, se sube suavemente.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    function alTocar(e) {
      // (no se mira e.defaultPrevented: los <Link> de la web siempre lo marcan, porque cambian de página sin recargar)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target.closest('a[href]')
      if (!link || link.target === '_blank') return
      const destino = new URL(link.href, window.location.href)
      if (destino.origin !== window.location.origin || destino.pathname !== window.location.pathname || destino.hash) return
      const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' })
    }
    document.addEventListener('click', alTocar)
    return () => document.removeEventListener('click', alTocar)
  }, [])
  return null
}

// Sección de la web según la dirección; cada una tiene su color (ver "Color de cada página" en index.css)
const SECTIONS = ['quienes-somos', 'portfolio', 'eventos', 'privacidad', 'equipo', 'blog', 'catalogo', 'contacto', 'donar']

function sectionOf(pathname) {
  const first = pathname.split('/')[1]
  if (!first) return 'inicio'
  return SECTIONS.includes(first) ? first : 'blog' // las notas del blog viven en la raíz
}

export default function App() {
  const location = useLocation()

  if (/^\/admin(\/|$)/.test(location.pathname)) {
    return (
      <Suspense fallback={<Loader />}>
        <ScrollToTop />
        <Admin />
      </Suspense>
    )
  }

  return (
    <>
      <ScrollToTop />
      <ContarVisita />
      <ScrollProgress />
      <Header />
      {/* Cada cambio de página entra con un pequeño giro en 3D */}
      <motion.main
        id="content"
        data-page={sectionOf(location.pathname)}
        key={location.pathname}
        initial={{ opacity: 0, rotateX: 6, y: 40 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 1600, transformOrigin: '50% 0%' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/equipo" element={EQUIPO_VISIBLE ? <Equipo /> : <Navigate to="/" replace />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/donar" element={<Donar />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<PortfolioItem />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          {/* Las notas del blog viven en la raíz, igual que en WordPress: /titulo-de-la-nota */}
          <Route path="/:slug" element={<SlugPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.main>
      <Footer />
      <WhatsappFlotante />
    </>
  )
}
