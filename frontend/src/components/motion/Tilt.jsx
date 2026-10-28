import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

// Tarjeta que se inclina en 3D siguiendo el mouse, con un brillo que sigue al cursor
export default function Tilt({ children, className = '', max = 12, style, ...rest }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const sx = useSpring(x, { stiffness: 200, damping: 18 })
  const sy = useSpring(y, { stiffness: 200, damping: 18 })
  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const glareX = useTransform(sx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(sy, [0, 1], ['0%', '100%'])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,.35), transparent 55%)`

  if (reduce) return <div className={className} style={style} {...rest}>{children}</div>

  function handleMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width)
    y.set((e.clientY - r.top) / r.height)
  }

  function handleLeave() {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      className={`tilt ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      {...rest}
    >
      {children}
      <motion.span className="tilt__glare" style={{ background: glare }} aria-hidden="true" />
    </motion.div>
  )
}
