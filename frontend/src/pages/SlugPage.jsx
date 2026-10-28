import { useParams } from 'react-router-dom'
import { getPage, getPost } from '../api/wp'
import { useWp } from '../api/useWp'
import { ErrorMessage, Loader, NotFound } from '../components/Status'
import { WpPageView } from './WpPage'
import Post from './Post'

// Resuelve /:slug -> primero busca una nota del blog y, si no existe, una página
export default function SlugPage() {
  const { slug } = useParams()
  const { data, loading, error } = useWp(async () => {
    const post = await getPost(slug)
    if (post) return { type: 'post', item: post }
    const page = await getPage(slug)
    return page ? { type: 'page', item: page } : null
  }, [slug])

  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <NotFound />
  if (data.type === 'page') return <WpPageView page={data.item} />
  return <Post key={data.item.id} post={data.item} />
}
