import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { PETAL_COLORS } from '../../data/brand'

export function PetalShape({ color, className, style }) {
  return (
    <svg viewBox="0 0 100 150" className={className} style={style} aria-hidden="true">
      <path
        d="M50 150 C35 120 8 90 10 55 C12 18 88 18 90 55 C92 90 65 120 50 150 Z"
        fill={color}
      />
    </svg>
  )
}

// Pétalos decorativos que flotan y se mueven a distinta velocidad con el scroll (paralaje)
const DEFAULT_LAYOUT = [
  { top: '8%', left: '4%', size: 70, rotate: -30, speed: 140 },
  { top: '18%', right: '6%', size: 46, rotate: 40, speed: -90 },
  { top: '62%', left: '9%', size: 38, rotate: 160, speed: 200 },
  { top: '75%', right: '12%', size: 64, rotate: -120, speed: -160 },
  { top: '40%', right: '30%', size: 26, rotate: 80, speed: 260 },
]

function FloatingPetal({ p, color, progress, index }) {
  const y = useTransform(progress, [0, 1], [p.speed, -p.speed])
  const rotate = useTransform(progress, [0, 1], [p.rotate, p.rotate + (index % 2 ? 90 : -90)])
  const rotateY = useTransform(progress, [0, 1], [0, 360])

  return (
    <motion.div
      className="floating-petal"
      style={{ top: p.top, left: p.left, right: p.right, width: p.size, y, rotate, rotateY }}
    >
      <PetalShape color={color} />
    </motion.div>
  )
}

export default function FloatingPetals({ layout = DEFAULT_LAYOUT, opacity = 0.9 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  if (reduce) return null

  return (
    <div ref={ref} className="floating-petals" style={{ opacity }} aria-hidden="true">
      {layout.map((p, i) => (
        <FloatingPetal key={i} p={p} index={i} color={PETAL_COLORS[i % PETAL_COLORS.length]} progress={scrollYProgress} />
      ))}
    </div>
  )
}
