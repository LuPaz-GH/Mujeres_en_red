import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarEvento, getEvento, getEventosPanel, guardarEvento } from '../api/admin'
import Pagination from '../components/Pagination'
import { ErrorMessage, Loader } from '../components/Status'
import { useBorrar, useDialogos } from './Dialogos'
import { Aviso, CAMBIOS_SIN_GUARDAR, Cabecera, CampoFoto, Fila, Filtros, Total, useAvisoRecibido, useDatos, useFormulario, useListado } from './comun'

// Eventos de la web (página /eventos y "Próximos eventos" del inicio)

const hoy = () => new Date().toLocaleDateString('sv') // "AAAA-MM-DD" en hora de la compu
const fechaLarga = (dia) => new Date(`${dia}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

export function EventosLista() {
  const { data, loading, error: errorCarga, recargar, pagina, setPagina, setFiltros } = useListado(getEventosPanel)
  const borrar = useBorrar({ tipo: 'evento', accion: borrarEvento, nombre: (e) => e.titulo, onListo: recargar })
  const aviso = useAvisoRecibido()

  return (
    <>
      <Cabecera titulo="Eventos">
        <Link to="/admin/eventos/nuevo" className="adm-btn is-principal">
          Agregar evento
        </Link>
      </Cabecera>
      <p className="adm-intro">Aparecen en la página Eventos y, los próximos, en el inicio de la web. Cuando la fecha pasa, se mueven solos a "Eventos anteriores".</p>
      <Filtros onCambio={setFiltros} placeholder="Nombre, lugar o descripción" ayudaFechas="Las fechas son las del evento." />
      <Aviso>{aviso}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.total} singular="evento" plural="eventos" />}
      {data && data.items.length === 0 && <p className="adm-vacio">No encontramos eventos.</p>}
      <ul className="adm-lista">
        {data?.items.map((e) => (
          <Fila
            key={e.id}
            to={`/admin/eventos/${e.id}`}
            foto={e.foto || ''}
            titulo={e.titulo}
            detalle={[fechaLarga(e.fecha), e.lugar, e.fecha < hoy() && 'ya pasó', !e.publicado && 'oculto en la web'].filter(Boolean).join(' · ')}
          >
            <button type="button" className="adm-btn is-peligro" onClick={() => borrar(e)}>
              Borrar
            </button>
          </Fila>
        ))}
      </ul>
      {data && <Pagination page={pagina} totalPages={data.paginas} onChange={setPagina} />}
    </>
  )
}

export function EventoEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(() => (id ? getEvento(id) : Promise.resolve(null)), [id])
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <EventoForm key={id ?? 'nuevo'} evento={data} />
}

function EventoForm({ evento }) {
  const navigate = useNavigate()
  const { confirmar } = useDialogos()
  const { campos, set, sucio, setSucio } = useFormulario({
    titulo: evento?.titulo ?? '',
    fecha: evento?.fecha ?? '',
    hora: evento?.hora ?? '',
    lugar: evento?.lugar ?? '',
    descripcion: evento?.descripcion ?? '',
    foto: evento?.foto ?? '',
    link: evento?.link ?? '',
    publicado: evento?.publicado ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await guardarEvento(evento?.id, campos)
      setSucio(false)
      navigate('/admin/eventos', { state: { aviso: `Listo, se guardó "${campos.titulo}".` } })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  async function volver(e) {
    e.preventDefault()
    if (!sucio || (await confirmar(CAMBIOS_SIN_GUARDAR))) navigate('/admin/eventos')
  }

  return (
    <form onSubmit={guardar} className="adm-ficha">
      <Link to="/admin/eventos" className="adm-volver" onClick={volver}>
        Volver a los eventos
      </Link>
      <h1>{evento ? evento.titulo : 'Nuevo evento'}</h1>

      <label className="adm-campo">
        <span className="adm-campo__nombre">Nombre del evento</span>
        <input required placeholder="Ej. Coaching Fest 2026" value={campos.titulo} onChange={(e) => set('titulo', e.target.value)} />
      </label>
      <div className="adm-en-linea">
        <label className="adm-campo">
          <span className="adm-campo__nombre">Fecha</span>
          <input type="date" required value={campos.fecha} onChange={(e) => set('fecha', e.target.value)} />
        </label>
        <label className="adm-campo">
          <span className="adm-campo__nombre">Hora (opcional)</span>
          <input placeholder="Ej. 18 hs, o de 9 a 13 hs" value={campos.hora} onChange={(e) => set('hora', e.target.value)} />
        </label>
      </div>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Lugar (opcional)</span>
        <input placeholder="Ej. Casa Histórica, San Miguel de Tucumán · o Por Zoom" value={campos.lugar} onChange={(e) => set('lugar', e.target.value)} />
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Descripción (opcional)</span>
        <textarea rows="4" placeholder="De qué se trata, a quién está dirigido, si es gratis..." value={campos.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
      </label>
      <CampoFoto titulo="Foto o flyer (opcional)" valor={campos.foto} onChange={(url) => set('foto', url)} />
      <label className="adm-campo">
        <span className="adm-campo__nombre">Link de inscripción (opcional)</span>
        <input placeholder="Ej. un formulario de Google o un link de WhatsApp" value={campos.link} onChange={(e) => set('link', e.target.value)} />
        <small className="adm-ayuda">Si lo completás, aparece el botón "Quiero participar".</small>
      </label>

      <label className="adm-check">
        <input type="checkbox" checked={campos.publicado} onChange={(e) => set('publicado', e.target.checked)} />
        Mostrar en la web
      </label>

      <Aviso tipo="error">{error}</Aviso>
      <button className="adm-btn is-principal" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}
