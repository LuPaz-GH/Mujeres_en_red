import { useState } from 'react'
import { borrarMensaje, getMensajes, marcarMensaje } from '../api/admin'
import { whatsappUrl } from '../api/whatsapp'
import { ErrorMessage, Loader } from '../components/Status'
import Pagination from '../components/Pagination'
import { useBorrar } from './Dialogos'
import { Aviso, Cabecera, fechaYHora, Filtros, Total, useListado } from './comun'

const primerNombre = (nombre) => nombre.trim().split(/\s+/)[0]

// Abre el correo con la respuesta ya empezada: saludo con su nombre y el mensaje original abajo
function respuestaMail(m) {
  const original = (m.mensaje || '').split('\n').map((l) => `> ${l}`).join('\n')
  const cuerpo = `Hola ${primerNombre(m.nombre)}:\n\nGracias por escribirnos.\n\n\n\nUn abrazo,\nFundación Mujeres en Red\n\n${original ? `---\nTu mensaje:\n${original}` : ''}`
  return `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.asunto}`)}&body=${encodeURIComponent(cuerpo)}`
}

// Abre WhatsApp con el chat de esa persona y un saludo ya escrito
const respuestaWhatsapp = (m) =>
  whatsappUrl(m.telefono, `¡Hola ${primerNombre(m.nombre)}! Te escribimos de Mujeres en Red por tu mensaje "${m.asunto}". `)

export default function Mensajes({ onCambio }) {
  const { data, setData, loading, error: errorCarga, recargar, pagina, setPagina, setFiltros } = useListado(getMensajes)
  const [abierto, setAbierto] = useState(null)
  const [error, setError] = useState('')

  async function marcar(mensaje, leido) {
    try {
      await marcarMensaje(mensaje.id, leido)
      setData({ ...data, items: data.items.map((m) => (m.id === mensaje.id ? { ...m, leido } : m)) })
      onCambio()
    } catch (e) {
      setError(e.message)
    }
  }

  const borrar = useBorrar({
    tipo: 'mensaje',
    accion: borrarMensaje,
    nombre: (m) => m.asunto,
    aclaracion: 'Se puede recuperar desde la Papelera.',
    onListo: () => {
      recargar()
      onCambio()
    },
  })

  function abrir(mensaje) {
    setAbierto(abierto === mensaje.id ? null : mensaje.id)
    if (!mensaje.leido) marcar(mensaje, true)
  }

  return (
    <>
      <Cabecera titulo="Mensajes" />
      <p className="adm-intro">Lo que la gente manda desde el formulario de contacto. También llega por mail a la fundación.</p>
      <Filtros onCambio={setFiltros} placeholder="Nombre, correo, asunto o texto" />
      <Aviso tipo="error">{error}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.total} singular="mensaje" plural="mensajes" />}
      {data && data.items.length === 0 && <p className="adm-vacio">No encontramos mensajes.</p>}
      <ul className="adm-lista">
        {data?.items.map((m) => (
          <li key={m.id} className={`adm-mensaje ${m.leido ? '' : 'is-nuevo'}`}>
            <button type="button" className="adm-mensaje__cabeza" aria-expanded={abierto === m.id} onClick={() => abrir(m)}>
              <strong>{m.asunto}</strong>
              <small>
                {m.nombre} · {fechaYHora(m.fecha)}
              </small>
            </button>
            {abierto === m.id && (
              <div className="adm-mensaje__cuerpo">
                <p className="adm-mensaje__datos">
                  {m.email}
                  {m.telefono && ` · WhatsApp ${m.telefono}`}
                </p>
                <p>{m.mensaje || 'Sin texto.'}</p>
                <div className="adm-mensaje__acciones">
                  <a className="adm-btn is-principal adm-responder is-mail" href={respuestaMail(m)}>
                    ✉️ Responder por mail
                  </a>
                  {m.telefono && (
                    <a className="adm-btn adm-responder is-whatsapp" href={respuestaWhatsapp(m)} target="_blank" rel="noreferrer">
                      💬 Responder por WhatsApp
                    </a>
                  )}
                  <button type="button" className="adm-btn" onClick={() => marcar(m, false)}>
                    Marcar como no leído
                  </button>
                  <button type="button" className="adm-btn is-peligro" onClick={() => borrar(m)}>
                    Borrar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {data && <Pagination page={pagina} totalPages={data.paginas} onChange={setPagina} />}
    </>
  )
}
