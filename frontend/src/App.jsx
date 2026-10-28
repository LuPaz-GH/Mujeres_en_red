import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import Header from './components/Header'
import Footer from './components/Footer'
import { NotFound } from './components/Status'
import ScrollProgress from './components/motion/ScrollProgress'
import Home from './pages/Home'
import QuienesSomos from './pages/QuienesSomos'
import Equipo from './pages/Equipo'
import Catalogo from './pages/Catalogo'
import Contacto from './pages/Contacto'
import Donar from './pages/Donar'
import Blog from './pages/Blog'
import Portfolio from './pages/Portfolio'
import PortfolioItem from './pages/PortfolioItem'
import SlugPage from './pages/SlugPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Sección de la web según la dirección; cada una tiene su color (ver "Color de cada página" en index.css)
const SECTIONS = ['quienes-somos', 'portfolio', 'equipo', 'blog', 'catalogo', 'contacto', 'donar']

function sectionOf(pathname) {
  const first = pathname.split('/')[1]
  if (!first) return 'inicio'
  return SECTIONS.includes(first) ? first : 'blog' // las notas del blog viven en la raíz
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
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
          <Route path="/equipo" element={<Equipo />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/donar" element={<Donar />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<PortfolioItem />} />
          {/* Las notas del blog viven en la raíz, igual que en WordPress: /titulo-de-la-nota */}
          <Route path="/:slug" element={<SlugPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.main>
      <Footer />
    </>
  )
}
