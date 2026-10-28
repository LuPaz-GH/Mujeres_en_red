import { useEffect } from 'react'
import { getPage } from '../api/wp'
import { useWp } from '../api/useWp'
import WpContent, { cleanWpHtml } from '../components/WpContent'
import { ErrorMessage, Loader, NotFound, PageHero } from '../components/Status'

// Página cuyo contenido se edita desde WordPress (Quiénes somos, Equipo, Catálogo, Contacto...)
export function WpPageView({ page }) {
  useEffect(() => {
    document.title = `${page.title.rendered.replace(/&#8211;/g, '–')} – Mujeres en Red`
  }, [page])

  const { startsWithCover } = cleanWpHtml(page.content.rendered)

  return (
    <>
      {!startsWithCover && <PageHero title={page.title.rendered} />}
      <WpContent html={page.content.rendered} className="wp-page" />
    </>
  )
}

export default function WpPage({ slug }) {
  const { data: page, loading, error } = useWp(() => getPage(slug), [slug])

  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  if (!page) return <NotFound />
  return <WpPageView page={page} />
}
