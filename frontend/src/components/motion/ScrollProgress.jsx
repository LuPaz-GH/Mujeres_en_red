import { motion, useScroll, useSpring } from 'motion/react'

// Barra fina arriba de todo con los colores del logo, que avanza con el scroll
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25 })
  return <motion.div className="scroll-progress" style={{ scaleX }} />
}
