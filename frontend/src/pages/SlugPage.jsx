import { useParams } from 'react-router-dom'
import { getNota, getPagina } from '../api/api'
import { useApi } from '../api/useApi'
import { ErrorMessage, Loader, NotFound } from '../components/Status'
import { WpPageView } from './WpPage'
import Post from './Post'

// Resuelve /:slug -> primero busca una nota del blog y, si no existe, una página
export default function SlugPage() {
  const { slug } = useParams()
  const { data, loading, error } = useApi(async () => {
    const post = await getNota(slug)
    if (post) return { type: 'post', item: post }
    const page = await getPagina(slug)
    return page ? { type: 'page', item: page } : null
  }, [slug])

  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <NotFound />
  if (data.type === 'page') return <WpPageView page={data.item} />
  return <Post key={data.item.id} post={data.item} />
}
