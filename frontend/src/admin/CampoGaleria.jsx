import { useEffect, useMemo, useRef, useState } from 'react'
import { subirFoto, subirVideo } from '../api/admin'
import { NOMBRE_TIPO, miniatura, tipoDeLink } from '../api/galeria'
import { Aviso } from './comun'
import { useDialogos } from './Dialogos'

// Galería de una ficha: fotos, videos subidos y videos de YouTube.
// valor: [{ tipo: 'foto' | 'video' | 'youtube', url }]. Se ordena arrastrando o con las flechas.
export default function CampoGaleria({ valor, onChange, onPrincipal }) {
  const inputFotos = useRef(null)
  const inputVideo = useRef(null)
  const arrastrada = useRef(null)
  const [subiendo, setSubiendo] = useState('')
  const [error, setError] = useState('')
  const { pedir } = useDialogos()
  const items = useMemo(() => valor ?? [], [valor])
  // Lo último que hay en la galería, para no perder fotos si se suben varias tandas seguidas
  const actual = useRef(items)
  useEffect(() => {
    actual.current = items
  }, [items])

  async function subir(archivos, tipo) {
    const lista = [...archivos].filter((a) => a.type.startsWith(tipo === 'foto' ? 'image/' : 'video/'))
    if (!lista.length) return
    setError('')
    const nuevos = []
    try {
      for (const [i, archivo] of lista.entries()) {
        setSubiendo(lista.length > 1 ? `Subiendo ${i + 1} de ${lista.length}…` : 'Subiendo…')
        nuevos.push({ tipo, url: await (tipo === 'foto' ? subirFoto(archivo) : subirVideo(archivo)) })
      }
    } catch (e) {
      setError(nuevos.length ? `Se subieron ${nuevos.length}, pero hubo un problema: ${e.message}` : e.message)
    } finally {
      setSubiendo('')
      if (nuevos.length) {
        actual.current = [...actual.current, ...nuevos]
        onChange(actual.current)
      }
    }
  }

  async function agregarLink() {
    const url = await pedir({
      titulo: 'Agregar un video de YouTube o Instagram',
      campo: 'Link del video o la publicación',
      ayuda: 'https://www.youtube.com/watch?v=...  o  https://www.instagram.com/reel/...',
      boton: 'Agregar',
    })
    if (!url) return
    const tipo = tipoDeLink(url)
    if (!tipo) {
      setError('Ese link no es de YouTube ni de Instagram. Copialo desde el botón "Compartir" de la publicación.')
      return
    }
    setError('')
    onChange([...items, { tipo, url: url.trim() }])
  }

  function mover(desde, hasta) {
    if (hasta < 0 || hasta >= items.length || desde === hasta) return
    const copia = [...items]
    const [item] = copia.splice(desde, 1)
    copia.splice(hasta, 0, item)
    onChange(copia)
  }

  const quitar = (i) => onChange(items.filter((_, j) => j !== i))

  function soltarArchivos(e) {
    if (!e.dataTransfer.files.length) return
    e.preventDefault()
    const archivos = [...e.dataTransfer.files]
    subir(archivos.filter((a) => a.type.startsWith('image/')), 'foto').then(() =>
      subir(archivos.filter((a) => a.type.startsWith('video/')), 'video'),
    )
  }

  const fotos = items.filter((g) => g.tipo === 'foto').length
  const videos = items.length - fotos

  return (
    <div className="adm-campo adm-galeria" onDragOver={(e) => e.preventDefault()} onDrop={soltarArchivos}>
      <span className="adm-campo__nombre">Galería de fotos y videos</span>
      <small className="adm-ayuda">
        Se ven en la web en "Así lo vivimos", de a 12 por página. Podés elegir muchas fotos juntas o arrastrarlas acá.
        Para cambiar el orden, arrastrá una foto a otro lugar o usá las flechas.
      </small>

      <div className="adm-galeria__botones">
        <input ref={inputFotos} type="file" accept="image/*" multiple hidden onChange={(e) => (subir(e.target.files, 'foto'), (e.target.value = ''))} />
        <input ref={inputVideo} type="file" accept="video/*" hidden onChange={(e) => (subir(e.target.files, 'video'), (e.target.value = ''))} />
        <button type="button" className="adm-btn" disabled={!!subiendo} onClick={() => inputFotos.current.click()}>
          + Fotos
        </button>
        <button type="button" className="adm-btn" disabled={!!subiendo} onClick={() => inputVideo.current.click()}>
          + Video
        </button>
        <button type="button" className="adm-btn" disabled={!!subiendo} onClick={agregarLink}>
          + Link de YouTube o Instagram
        </button>
        <span className="adm-galeria__cuenta" aria-live="polite">
          {subiendo ||
            (items.length
              ? [fotos && `${fotos} ${fotos === 1 ? 'foto' : 'fotos'}`, videos && `${videos} ${videos === 1 ? 'video' : 'videos'}`].filter(Boolean).join(' y ')
              : 'Todavía no hay fotos')}
        </span>
      </div>
      <small className="adm-ayuda">Videos desde la compu o el celular: hasta 100 MB (unos 2 o 3 minutos). Si es más largo o ya está publicado, pegá el link de YouTube o Instagram.</small>

      {items.length > 0 && (
        <ol className="adm-galeria__lista">
          {items.map((item, i) => (
            <li
              key={item.url}
              draggable
              onDragStart={() => (arrastrada.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                if (arrastrada.current === null) return
                e.preventDefault()
                e.stopPropagation()
                mover(arrastrada.current, i)
                arrastrada.current = null
              }}
              onDragEnd={() => (arrastrada.current = null)}
            >
              {item.tipo === 'video' ? (
                <video src={`${item.url}#t=0.5`} preload="metadata" muted />
              ) : miniatura(item) ? (
                <img src={miniatura(item)} alt="" loading="lazy" />
              ) : (
                <span className="adm-galeria__instagram" />
              )}
              {item.tipo !== 'foto' && <span className="adm-galeria__tipo">{NOMBRE_TIPO[item.tipo]}</span>}
              <span className="adm-galeria__num">{i + 1}</span>
              <div className="adm-galeria__acciones">
                <button type="button" title="Mover antes" aria-label={`Mover la ${i + 1} antes`} disabled={i === 0} onClick={() => mover(i, i - 1)}>
                  ←
                </button>
                <button
                  type="button"
                  title="Mover después"
                  aria-label={`Mover la ${i + 1} después`}
                  disabled={i === items.length - 1}
                  onClick={() => mover(i, i + 1)}
                >
                  →
                </button>
                {onPrincipal && item.tipo === 'foto' && (
                  <button type="button" title="Usar como foto principal" aria-label={`Usar la ${i + 1} como foto principal`} onClick={() => onPrincipal(item.url)}>
                    ★
                  </button>
                )}
                <button type="button" className="is-quitar" title="Quitar" aria-label={`Quitar la ${i + 1}`} onClick={() => quitar(i)}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Aviso tipo="error">{error}</Aviso>
    </div>
  )
}
