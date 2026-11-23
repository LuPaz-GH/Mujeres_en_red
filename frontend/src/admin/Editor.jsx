import { useEffect, useRef, useState } from 'react'
import { subirFoto, subirVideo } from '../api/admin'
import { direccionEmbebida, tipoDeLink } from '../api/galeria'
import { Aviso } from './comun'
import { useDialogos } from './Dialogos'
import '../pages/Post.css'

// Editor de texto de notas y proyectos. Edita el HTML directamente, sin convertirlo a otro formato,
// porque las notas que vinieron de WordPress tienen galerías y bloques que hay que conservar tal cual.

const VACIO = '<p><br></p>'

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// El HTML limpio que se guarda: sin renglones vacíos al final y con párrafos reales (el portfolio los necesita)
function serializar(editor) {
  const copia = editor.cloneNode(true)
  for (const n of [...copia.childNodes]) {
    const suelto = n.nodeType === Node.TEXT_NODE && n.textContent.trim()
    if (!suelto && !(n.nodeName === 'DIV' && !n.className)) continue
    const p = document.createElement('p')
    n.replaceWith(p)
    if (suelto) p.append(n)
    else p.append(...n.childNodes)
  }
  copia.querySelectorAll('b').forEach((b) => cambiarEtiqueta(b, 'strong'))
  copia.querySelectorAll('i').forEach((i) => cambiarEtiqueta(i, 'em'))

  copia.querySelectorAll(':scope > p').forEach((p) => parrafoVacio(p) && p.remove())
  return copia.textContent.trim() || copia.querySelector('img') ? copia.innerHTML.trim() : ''
}

const parrafoVacio = (el) => el?.nodeName === 'P' && !el.textContent.trim() && !el.querySelector('img')

// Chrome mete las listas adentro de un párrafo, y eso no es HTML válido: se sacan sin mover el cursor
function sacarListasDeParrafos(editor) {
  const seleccion = window.getSelection()
  const { anchorNode, anchorOffset } = seleccion
  editor.querySelectorAll(':scope > p > ul, :scope > p > ol').forEach((lista) => {
    const p = lista.parentNode
    p.replaceWith(...p.childNodes)
  })
  if (anchorNode && editor.contains(anchorNode)) seleccion.collapse(anchorNode, anchorOffset)
}

function cambiarEtiqueta(el, etiqueta) {
  const nuevo = document.createElement(etiqueta)
  nuevo.append(...el.childNodes)
  el.replaceWith(nuevo)
}

// Las mismas marcas que usaba WordPress, para que se vean igual que las fotos de las notas viejas
function bloqueFotos(urls) {
  const figura = (url) => `<figure class="wp-block-image size-large"><a href="${url}"><img src="${url}" alt=""></a></figure>`
  const plantilla = document.createElement('template')
  plantilla.innerHTML =
    urls.length === 1
      ? figura(urls[0])
      : `<figure class="wp-block-gallery has-nested-images columns-default is-cropped">${urls.map(figura).join('')}</figure>`
  return plantilla.content.firstElementChild
}

// Video subido a la web o de YouTube, como bloque propio entre párrafos
function bloqueVideo(tipo, url) {
  const plantilla = document.createElement('template')
  plantilla.innerHTML =
    tipo !== 'video'
      ? `<figure class="wp-block-embed is-type-video is-provider-${tipo}"><div class="wp-block-embed__wrapper"><iframe src="${direccionEmbebida({ tipo, url })}" title="${tipo === 'youtube' ? 'Video de YouTube' : 'Publicación de Instagram'}" allowfullscreen loading="lazy"></iframe></div></figure>`
      : `<figure class="wp-block-video"><video controls preload="metadata" src="${url}"></video></figure>`
  return plantilla.content.firstElementChild
}

// Foto, video o placa de YouTube/Instagram sobre la que está el mouse (o que se tocó): la más chica que la contiene.
// En una galería es cada foto por separado.
function multimediaDe(objetivo, raiz) {
  const el = objetivo?.closest?.('figure, video, iframe, img')
  if (!el || !raiz.contains(el) || el === raiz) return null
  return el.closest('figure') && raiz.contains(el.closest('figure')) ? el.closest('figure') : el
}

function direccionCompleta(texto) {
  const url = texto.trim()
  if (/^(https?:|mailto:|\/)/i.test(url)) return url
  return url.includes('@') && !url.includes('/') ? `mailto:${url}` : `https://${url}`
}

// onMouseDown evita que el botón le saque la selección al texto
function Boton({ titulo, onClick, children }) {
  return (
    <button type="button" title={titulo} aria-label={titulo} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  )
}

export default function Editor({ valor, onChange, etiqueta }) {
  const editor = useRef(null)
  const inputFotos = useRef(null)
  const inputVideo = useRef(null)
  const rango = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  // Foto o video marcado, con su lugar dentro del editor, para mostrar encima el botón "Quitar"
  const [marcado, setMarcado] = useState(null)
  const caja = useRef(null)
  const { pedir } = useDialogos()

  // El contenido se pone una sola vez: después lo maneja el navegador mientras se escribe
  useEffect(() => {
    editor.current.innerHTML = valor || VACIO
    document.execCommand('defaultParagraphSeparator', false, 'p')
    document.execCommand('styleWithCSS', false, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const avisar = () => onChange(serializar(editor.current))

  // El botón va arriba a la derecha de la foto, pero si es muy alta (una placa de Instagram)
  // baja con la pantalla para no quedar tapado por la barra de arriba
  function ubicar(el) {
    if (!el?.isConnected) return setMarcado(null)
    const a = el.getBoundingClientRect()
    const b = caja.current.getBoundingClientRect()
    const barra = Math.max(0, ...[...document.querySelectorAll('.adm-barra, .adm-arriba')].map((x) => x.getBoundingClientRect().bottom))
    const arriba = Math.min(Math.max(a.top + 8, barra + 12), a.bottom - 52)
    setMarcado({ el, top: arriba - b.top, right: b.right - a.right + 8, tipo: el.querySelector?.('video, iframe') || /VIDEO|IFRAME/.test(el.tagName) ? 'video' : 'foto' })
  }

  function marcar(e) {
    const el = multimediaDe(e.target, editor.current)
    if (el) ubicar(el)
  }

  const marcadoEl = marcado?.el
  useEffect(() => {
    if (!marcadoEl) return
    const seguir = () => ubicar(marcadoEl)
    window.addEventListener('scroll', seguir, { passive: true })
    return () => window.removeEventListener('scroll', seguir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcadoEl])

  function quitar() {
    const el = marcado?.el
    if (!el?.isConnected) return setMarcado(null)
    const galeria = el.parentElement?.closest('figure.wp-block-gallery')
    // Si era un video o una placa sola dentro de un párrafo, se va el párrafo entero
    const padre = el.parentElement
    el.remove()
    if (galeria && !galeria.querySelector('img')) galeria.remove()
    if (padre && padre !== editor.current && padre.tagName === 'P' && !padre.textContent.trim() && !padre.querySelector('img, video, iframe')) padre.remove()
    setMarcado(null)
    avisar()
  }

  function comando(nombre, valor) {
    editor.current.focus()
    document.execCommand(nombre, false, valor)
    sacarListasDeParrafos(editor.current)
    avisar()
  }

  // Chrome manda el cursor al principio del renglón al crear la lista: se lo deja donde estaba
  function lista() {
    const seleccion = window.getSelection()
    const { anchorOffset, isCollapsed } = seleccion
    const texto = seleccion.anchorNode?.textContent
    comando('insertUnorderedList')
    if (isCollapsed && seleccion.anchorNode?.textContent === texto) seleccion.collapse(seleccion.anchorNode, anchorOffset)
  }

  function subtitulo() {
    comando('formatBlock', document.queryCommandValue('formatBlock').toLowerCase() === 'h3' ? '<p>' : '<h3>')
  }

  async function link() {
    const seleccion = window.getSelection()
    if (seleccion.isCollapsed || !editor.current.contains(seleccion.anchorNode)) {
      setError('Primero seleccioná con el mouse el texto que querés convertir en link.')
      return
    }
    setError('')
    const copia = seleccion.getRangeAt(0).cloneRange()
    const url = await pedir({ titulo: 'Agregar un link', campo: 'Dirección', ayuda: 'https://...', boton: 'Agregar link' })
    if (!url) return
    editor.current.focus()
    seleccion.removeAllRanges()
    seleccion.addRange(copia)
    comando('createLink', direccionCompleta(url))
  }

  // La selección se pierde al abrir el selector de archivos: se guarda para saber dónde poner la foto
  function recordarPosicion() {
    const seleccion = window.getSelection()
    if (seleccion.rangeCount && editor.current.contains(seleccion.anchorNode)) rango.current = seleccion.getRangeAt(0)
  }

  // Las fotos van entre párrafos, después del párrafo donde estaba el cursor
  function insertarFotos(urls) {
    insertarBloque(bloqueFotos(urls))
  }

  function insertarBloque(nuevo) {
    const raiz = editor.current
    let bloque = rango.current?.startContainer
    while (bloque && bloque.parentNode !== raiz) bloque = bloque.parentNode
    if (bloque && bloque !== raiz) bloque.after(nuevo)
    else raiz.append(nuevo)
    if (parrafoVacio(bloque)) bloque.remove()
    // El cursor queda en un renglón nuevo después de la foto, para seguir escribiendo o agregar más fotos en orden
    if (!parrafoVacio(nuevo.nextElementSibling)) nuevo.insertAdjacentHTML('afterend', VACIO)
    raiz.focus()
    window.getSelection().collapse(nuevo.nextElementSibling, 0)
    recordarPosicion()
    avisar()
  }

  async function subirFotos(archivos) {
    const fotos = [...archivos].filter((a) => a.type.startsWith('image/'))
    if (!fotos.length) return
    setSubiendo(true)
    setError('')
    try {
      const urls = []
      for (const foto of fotos) urls.push(await subirFoto(foto))
      insertarFotos(urls)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubiendo(false)
    }
  }

  async function subirVideoAlTexto(archivo) {
    if (!archivo) return
    setSubiendo(true)
    setError('')
    try {
      insertarBloque(bloqueVideo('video', await subirVideo(archivo)))
    } catch (e) {
      setError(e.message)
    } finally {
      setSubiendo(false)
    }
  }

  async function agregarLink() {
    recordarPosicion()
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
    insertarBloque(bloqueVideo(tipo, url))
  }

  // Al pegar de Word, de un mail o de otra web se toma solo el texto, sin los colores y letras de afuera
  function pegar(e) {
    e.preventDefault()
    if (e.clipboardData.files.length) {
      recordarPosicion()
      subirFotos(e.clipboardData.files)
      return
    }
    const texto = e.clipboardData.getData('text/plain').trim()
    if (!texto) return
    const parrafos = texto.split(/\r?\n\s*\r?\n|\r?\n/).filter((p) => p.trim())
    if (parrafos.length === 1) document.execCommand('insertText', false, parrafos[0])
    else document.execCommand('insertHTML', false, parrafos.map((p) => `<p>${escapar(p.trim())}</p>`).join(''))
    avisar()
  }

  function soltar(e) {
    if (!e.dataTransfer.files.length) return
    e.preventDefault()
    recordarPosicion()
    subirFotos(e.dataTransfer.files)
  }

  return (
    <div className="adm-campo">
      <span className="adm-campo__nombre">{etiqueta}</span>
      <div className="adm-editor" ref={caja} onMouseLeave={() => setMarcado(null)}>
        <div className="adm-editor__botones" role="toolbar" aria-label="Formato del texto">
          <Boton titulo="Negrita" onClick={() => comando('bold')}>
            <strong>N</strong>
          </Boton>
          <Boton titulo="Cursiva" onClick={() => comando('italic')}>
            <em>C</em>
          </Boton>
          <Boton titulo="Subtítulo" onClick={subtitulo}>
            Subtítulo
          </Boton>
          <Boton titulo="Lista con puntos" onClick={lista}>
            Lista
          </Boton>
          <Boton titulo="Link" onClick={link}>
            Link
          </Boton>
          <Boton titulo="Agregar fotos" onClick={() => inputFotos.current.click()}>
            {subiendo ? 'Subiendo…' : 'Fotos'}
          </Boton>
          <Boton titulo="Agregar un video desde la compu o el celular (hasta 100 MB)" onClick={() => inputVideo.current.click()}>
            Video
          </Boton>
          <Boton titulo="Agregar un video de YouTube o Instagram" onClick={agregarLink}>
            YouTube / Instagram
          </Boton>
          <input
            ref={inputVideo}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              subirVideoAlTexto(e.target.files[0])
              e.target.value = ''
            }}
          />
          <input
            ref={inputFotos}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              subirFotos(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
        <div
          ref={editor}
          className="adm-editor__texto wp-content post-body"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={etiqueta}
          onInput={avisar}
          onBlur={recordarPosicion}
          onKeyUp={recordarPosicion}
          onMouseUp={recordarPosicion}
          onPaste={pegar}
          onMouseOver={marcar}
          onClick={marcar}
          onScroll={() => setMarcado(null)}
          onDrop={soltar}
        />
        {marcado && (
          <button
            type="button"
            className="adm-editor__quitar"
            style={{ top: marcado.top, right: marcado.right }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={quitar}
          >
            ✕ Quitar {marcado.tipo === 'video' ? 'video' : 'foto'}
          </button>
        )}
      </div>
      <small className="adm-ayuda">Para sacar una foto, un video o un link de YouTube o Instagram, pasá el mouse (o tocalo en el celular) y apretá "✕ Quitar". Después, guardá. Si elegís varias fotos a la vez, se arma una galería.</small>
      <Aviso tipo="error">{error}</Aviso>
    </div>
  )
}
