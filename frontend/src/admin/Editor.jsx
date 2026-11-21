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
  const { pedir } = useDialogos()

  // El contenido se pone una sola vez: después lo maneja el navegador mientras se escribe
  useEffect(() => {
    editor.current.innerHTML = valor || VACIO
    document.execCommand('defaultParagraphSeparator', false, 'p')
    document.execCommand('styleWithCSS', false, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const avisar = () => onChange(serializar(editor.current))

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
      <div className="adm-editor">
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
          onDrop={soltar}
        />
      </div>
      <small className="adm-ayuda">Para borrar una foto o un video, hacé clic en él y apretá la tecla Borrar. Si elegís varias fotos a la vez, se arma una galería.</small>
      <Aviso tipo="error">{error}</Aviso>
    </div>
  )
}
