import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarTestimonio, getTestimonio, getTestimoniosPanel, guardarTestimonio, ordenarTestimonios } from '../api/admin'
import { ErrorMessage, Loader } from '../components/Status'
import { useBorrar, useDialogos } from './Dialogos'
import { Aviso, CAMBIOS_SIN_GUARDAR, Cabecera, CampoFoto, Fila, Total, useAvisoRecibido, useDatos, useFormulario } from './comun'

// Testimonios del inicio de la web: agregar, editar, ordenar y borrar

export function TestimoniosLista() {
  const { data, setData, loading, error: errorCarga, recargar } = useDatos(getTestimoniosPanel)
  const [error, setError] = useState('')
  const aviso = useAvisoRecibido()
  const borrar = useBorrar({ tipo: 'testimonio', accion: borrarTestimonio, nombre: (t) => t.nombre, onListo: recargar })

  async function mover(i, paso) {
    const lista = [...data]
    ;[lista[i], lista[i + paso]] = [lista[i + paso], lista[i]]
    setData(lista)
    setError('')
    try {
      setData(await ordenarTestimonios(lista.map((x) => x.id)))
    } catch (e) {
      setError(e.message)
      recargar()
    }
  }

  return (
    <>
      <Cabecera titulo="Testimonios">
        <Link to="/admin/testimonios/nuevo" className="adm-btn is-principal">
          Agregar testimonio
        </Link>
      </Cabecera>
      <p className="adm-intro">
        Frases de mujeres que participaron, para el inicio de la web. Si no hay ninguno, el bloque no aparece. Antes de publicar uno, pedile
        permiso a la persona para usar su nombre, sus palabras y su foto.
      </p>
      <Aviso>{aviso}</Aviso>
      <Aviso tipo="error">{error}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.length} singular="testimonio" plural="testimonios" />}
      {data && data.length === 0 && <p className="adm-vacio">Todavía no hay testimonios cargados.</p>}
      <ul className="adm-lista">
        {data?.map((t, i) => (
          <Fila
            key={t.id}
            to={`/admin/testimonios/${t.id}`}
            foto={t.foto || ''}
            titulo={t.nombre}
            detalle={[`“${t.texto.slice(0, 70)}${t.texto.length > 70 ? '…' : ''}”`, !t.publicado && 'oculto en la web'].filter(Boolean).join(' · ')}
          >
            <button type="button" className="adm-btn is-suave" aria-label={`Subir a ${t.nombre}`} title="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>
              ↑
            </button>
            <button
              type="button"
              className="adm-btn is-suave"
              aria-label={`Bajar a ${t.nombre}`}
              title="Bajar"
              disabled={i === data.length - 1}
              onClick={() => mover(i, 1)}
            >
              ↓
            </button>
            <button type="button" className="adm-btn is-peligro" onClick={() => borrar(t)}>
              Borrar
            </button>
          </Fila>
        ))}
      </ul>
    </>
  )
}

export function TestimonioEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(() => (id ? getTestimonio(id) : Promise.resolve(null)), [id])
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <TestimonioForm key={id ?? 'nuevo'} testimonio={data} />
}

function TestimonioForm({ testimonio }) {
  const navigate = useNavigate()
  const { confirmar } = useDialogos()
  const { campos, set, sucio, setSucio } = useFormulario({
    nombre: testimonio?.nombre ?? '',
    detalle: testimonio?.detalle ?? '',
    texto: testimonio?.texto ?? '',
    foto: testimonio?.foto ?? '',
    publicado: testimonio?.publicado ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await guardarTestimonio(testimonio?.id, campos)
      setSucio(false)
      navigate('/admin/testimonios', { state: { aviso: `Listo, se guardó el testimonio de ${campos.nombre}.` } })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  async function volver(e) {
    e.preventDefault()
    if (!sucio || (await confirmar(CAMBIOS_SIN_GUARDAR))) navigate('/admin/testimonios')
  }

  return (
    <form onSubmit={guardar} className="adm-ficha">
      <Link to="/admin/testimonios" className="adm-volver" onClick={volver}>
        Volver a los testimonios
      </Link>
      <h1>{testimonio ? `Testimonio de ${testimonio.nombre}` : 'Nuevo testimonio'}</h1>

      <label className="adm-campo">
        <span className="adm-campo__nombre">Lo que dijo</span>
        <textarea
          required
          rows="4"
          maxLength={600}
          placeholder="Ej. Gracias al programa me animé a abrir mi propio emprendimiento."
          value={campos.texto}
          onChange={(e) => set('texto', e.target.value)}
        />
        <small className="adm-ayuda">Mejor corto: dos o tres oraciones. Sin comillas, se agregan solas.</small>
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Nombre</span>
        <input required placeholder="Ej. María G." value={campos.nombre} onChange={(e) => set('nombre', e.target.value)} />
        <small className="adm-ayuda">Puede ser solo el nombre y la inicial del apellido, si la persona lo prefiere.</small>
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">En qué participó (opcional)</span>
        <input placeholder="Ej. Programa Mujer Emprendedora" value={campos.detalle} onChange={(e) => set('detalle', e.target.value)} />
      </label>
      <CampoFoto titulo="Foto (opcional)" valor={campos.foto} onChange={(url) => set('foto', url)} ayuda="Si no hay foto, se muestra la inicial del nombre." />

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
