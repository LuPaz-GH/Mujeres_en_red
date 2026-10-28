import { Link } from 'react-router-dom'
import { featuredImage } from '../api/wp'
import { splitTitle } from '../api/portfolio'
import { PETAL_COLORS } from '../data/brand'
import Reveal from './motion/Reveal'
import Tilt from './motion/Tilt'
import { PetalShape } from './motion/FloatingPetals'

// Grilla tipo mosaico: la primera tarjeta es grande y el resto se acomoda alrededor
export default function PortfolioGrid({ items, offset = 0 }) {
  return (
    <ul className="portfolio-grid">
      {items.map((item, i) => {
        const { kind, name } = splitTitle(item.title.rendered)
        const color = PETAL_COLORS[(i + offset) % PETAL_COLORS.length]
        return (
          <Reveal as="li" key={item.id} delay={(i % 3) * 0.1}>
            <Tilt className="portfolio-card" style={{ '--accent': color }} max={8}>
              <Link to={`/portfolio/${item.slug}`}>
                <img src={featuredImage(item, 'large') || featuredImage(item)} alt="" loading="lazy" />
                <span className="portfolio-card__shade" />
                <span className="portfolio-card__num">{String(i + 1 + offset).padStart(2, '0')}</span>
                <PetalShape color={color} className="portfolio-card__petal" />
                <div className="portfolio-card__body">
                  <span className="portfolio-card__kind">{kind}</span>
                  <h3>{name}</h3>
                  <span className="portfolio-card__more">
                    Ver {kind.toLowerCase()} <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            </Tilt>
          </Reveal>
        )
      })}
    </ul>
  )
}
