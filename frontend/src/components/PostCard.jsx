import { Link } from 'react-router-dom'
import { formatDate } from '../api/api'
import PostImage from './PostImage'
import Tilt from './motion/Tilt'

export default function PostCard({ post, accent }) {
  return (
    <Tilt className="post-card" style={{ '--accent': accent }} max={8}>
      <Link to={`/${post.slug}`}>
        <div className="post-card__img">
          <PostImage post={post} />
        </div>
        <div className="post-card__body">
          <time dateTime={post.fecha}>{formatDate(post.fecha)}</time>
          <h3>{post.titulo}</h3>
        </div>
      </Link>
    </Tilt>
  )
}
