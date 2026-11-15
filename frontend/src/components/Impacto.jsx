import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { useSitio } from '../api/useSitio'
import { BRAND } from '../data/brand'
import Reveal from './motion/Reveal'
import './Impacto.css'

// Números de impacto del inicio ("14 años acompañando a mujeres tucumanas"...). Se cambian en el panel: Datos de la web.

// Colores del logo que se leen bien sobre el fondo oscuro (el violeta no)
const COLORES = [BRAND.rosa, BRAND.celeste, BRAND.verde, BRAND.naranja]

// "+2.000" -> { antes: '+', valor: 2000, despues: '', miles: true }
function separar(numero) {
  const m = String(numero).match(/^(\D*)([\d.,]+)(.*)$/)
  if (!m) return null
  const miles = /[.,]\d{3}/.test(m[2])
  return { antes: m[1], valor: Number(m[2].replace(/[.,]/g, '')), despues: m[3], miles }
}

// Cuenta desde 0 hasta el número cuando aparece en pantalla (sin animación si se pidió reducir movimiento)
function Contador({ numero }) {
  const ref = useRef(null)
  const visto = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const partes = separar(numero)
  const [actual, setActual] = useState(reduce || !partes ? partes?.valor : 0)

  useEffect(() => {
    if (!visto || reduce || !partes) return
    const inicio = performance.now()
    const dura = 1600
    let cuadro
    const paso = (t) => {
      const p = Math.min(1, (t - inicio) / dura)
      setActual(Math.round(partes.valor * (1 - Math.pow(1 - p, 3))))
      if (p < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visto, reduce, numero])

  if (!partes) return <span ref={ref}>{numero}</span>
  const texto = partes.miles ? actual.toLocaleString('es-AR') : String(actual)
  return (
    <span ref={ref} aria-label={numero}>
      <span aria-hidden="true">
        {partes.antes}
        {texto}
        {partes.despues}
      </span>
    </span>
  )
}

export default function Impacto() {
  const { impacto } = useSitio()
  if (!impacto.length) return null

  return (
    <section className="impacto" aria-label="Nuestro impacto">
      <div className="container">
        <ul className="impacto__lista" style={{ '--n': impacto.length }}>
          {impacto.map((item, i) => (
            <Reveal as="li" key={i} delay={i * 0.1} className="impacto__item" style={{ '--color': COLORES[i % COLORES.length] }}>
              <strong className="impacto__numero">
                <Contador numero={item.numero} />
              </strong>
              <span className="impacto__texto">{item.texto}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
