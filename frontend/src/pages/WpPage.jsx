import { useEffect } from 'react'
import { getPagina } from '../api/api'
import { useApi } from '../api/useApi'
import WpContent, { cleanWpHtml } from '../components/WpContent'
import { ErrorMessage, Loader, NotFound, PageHero } from '../components/Status'

// Página suelta que vino de WordPress (ej. "Qué hacemos")
export function WpPageView({ page }) {
  useEffect(() => {
    document.title = `${page.titulo} – Mujeres en Red`
  }, [page])

  const { startsWithCover } = cleanWpHtml(page.contenido)

  return (
    <>
      {!startsWithCover && <PageHero title={page.titulo} />}
      <WpContent html={page.contenido} className="wp-page" />
    </>
  )
}

export default function WpPage({ slug }) {
  const { data: page, loading, error } = useApi(() => getPagina(slug), [slug])

  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  if (!page) return <NotFound />
  return <WpPageView page={page} />
}
