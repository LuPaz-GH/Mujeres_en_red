import { motion, useReducedMotion } from 'motion/react'

// Aparece al entrar en pantalla, girando desde atrás en 3D
export default function Reveal({ children, delay = 0, className, as = 'div', style, ...rest }) {
  const reduce = useReducedMotion()
  const Tag = motion[as]

  if (reduce) return <Tag className={className} style={style} {...rest}>{children}</Tag>

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 70, rotateX: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
      style={{ transformPerspective: 1000, transformOrigin: '50% 100%', ...style }}
    >
      {children}
    </Tag>
  )
}
