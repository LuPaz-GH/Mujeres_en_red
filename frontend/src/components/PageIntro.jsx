import { motion, useReducedMotion } from 'motion/react'
import FloatingPetals from './motion/FloatingPetals'
import Reveal from './motion/Reveal'

// Portada de color para las páginas internas.
// title: texto; las palabras entre asteriscos (*así*) se pintan de color.
export default function PageIntro({ eyebrow, title, lead, children, aside, variant = 'hero' }) {
  const reduce = useReducedMotion()
  const words = title.split(' ')
  const colors = ['var(--rosa)', 'var(--violeta)', 'var(--celeste)', 'var(--naranja)', 'var(--verde)']
  let colorIndex = 0

  return (
    <section className={`page-intro page-intro--${variant} ${aside ? 'has-aside' : ''}`}>
      <FloatingPetals opacity={0.8} />
      <div className="container page-intro__grid">
        <div className="page-intro__text">
          {eyebrow && (
            <Reveal as="p" className="eyebrow">
              {eyebrow}
            </Reveal>
          )}
          <h1>
            {words.map((w, i) => {
              const highlight = w.startsWith('*')
              const color = highlight ? colors[colorIndex++ % colors.length] : undefined
              return (
                <motion.span
                  key={i}
                  className="word"
                  style={color ? { color } : undefined}
                  initial={reduce ? false : { opacity: 0, y: 60, rotateX: 90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  {w.replace(/\*/g, '')}{' '}
                </motion.span>
              )
            })}
          </h1>
          {lead && (
            <Reveal as="p" className="page-intro__lead" delay={0.4}>
              {lead}
            </Reveal>
          )}
          {children && <Reveal delay={0.55}>{children}</Reveal>}
        </div>
        {aside && <div className="page-intro__aside">{aside}</div>}
      </div>
    </section>
  )
}
