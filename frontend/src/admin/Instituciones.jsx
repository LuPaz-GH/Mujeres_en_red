import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarInstitucion, getInstitucion, getInstitucionesPanel, guardarInstitucion, ordenarInstituciones } from '../api/admin'
import { ErrorMessage, Loader } from '../components/Status'
import { useBorrar, useDialogos } from './Dialogos'
import { Aviso, CAMBIOS_SIN_GUARDAR, Cabecera, CampoFoto, Fila, Total, useAvisoRecibido, useDatos, useFormulario } from './comun'

// "Instituciones que nos acompañan" del inicio de la web: agregar, editar, ordenar y borrar

export function InstitucionesLista() {
  const { data, setData, loading, error: errorCarga, recargar } = useDatos(getInstitucionesPanel)
  const [error, setError] = useState('')
  const aviso = useAvisoRecibido()
  const borrar = useBorrar({ tipo: 'institucion', accion: borrarInstitucion, nombre: (i) => i.nombre, onListo: recargar })

  // Sube o baja una posición; se ve al instante y después se guarda
  async function mover(i, paso) {
    const lista = [...data]
    ;[lista[i], lista[i + paso]] = [lista[i + paso], lista[i]]
    setData(lista)
    setError('')
    try {
      setData(await ordenarInstituciones(lista.map((x) => x.id)))
    } catch (e) {
      setError(e.message)
      recargar()
    }
  }

  return (
    <>
      <Cabecera titulo="Instituciones">
        <Link to="/admin/instituciones/nueva" className="adm-btn is-principal">
          Agregar institución
        </Link>
      </Cabecera>
      <p className="adm-intro">
        Las que aparecen en "Instituciones que nos acompañan", en el inicio de la web, en este mismo orden. Si no tienen logo, se muestran
        sus iniciales.
      </p>
      <Aviso>{aviso}</Aviso>
      <Aviso tipo="error">{error}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.length} singular="institución" plural="instituciones" />}
      {data && data.length === 0 && <p className="adm-vacio">Todavía no hay ninguna cargada.</p>}
      <ul className="adm-lista">
        {data?.map((inst, i) => (
          <Fila
            key={inst.id}
            to={`/admin/instituciones/${inst.id}`}
            foto={inst.logo || ''}
            titulo={inst.nombre}
            detalle={[inst.detalle, !inst.logo && 'sin logo', !inst.publicado && 'oculta en la web'].filter(Boolean).join(' · ')}
          >
            <button type="button" className="adm-btn is-suave" aria-label={`Subir ${inst.nombre}`} title="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>
              ↑
            </button>
            <button
              type="button"
              className="adm-btn is-suave"
              aria-label={`Bajar ${inst.nombre}`}
              title="Bajar"
              disabled={i === data.length - 1}
              onClick={() => mover(i, 1)}
            >
              ↓
            </button>
            <button type="button" className="adm-btn is-peligro" onClick={() => borrar(inst)}>
              Borrar
            </button>
          </Fila>
        ))}
      </ul>
    </>
  )
}

export function InstitucionEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(() => (id ? getInstitucion(id) : Promise.resolve(null)), [id])
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <InstitucionForm key={id ?? 'nueva'} institucion={data} />
}

function InstitucionForm({ institucion }) {
  const navigate = useNavigate()
  const { confirmar } = useDialogos()
  const { campos, set, sucio, setSucio } = useFormulario({
    nombre: institucion?.nombre ?? '',
    detalle: institucion?.detalle ?? '',
    logo: institucion?.logo ?? '',
    link: institucion?.link ?? '',
    publicado: institucion?.publicado ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await guardarInstitucion(institucion?.id, campos)
      setSucio(false)
      navigate('/admin/instituciones', { state: { aviso: `Listo, se guardó "${campos.nombre}".` } })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  async function volver(e) {
    e.preventDefault()
    if (!sucio || (await confirmar(CAMBIOS_SIN_GUARDAR))) navigate('/admin/instituciones')
  }

  return (
    <form onSubmit={guardar} className="adm-ficha">
      <Link to="/admin/instituciones" className="adm-volver" onClick={volver}>
        Volver a las instituciones
      </Link>
      <h1>{institucion ? institucion.nombre : 'Nueva institución'}</h1>

      <label className="adm-campo">
        <span className="adm-campo__nombre">Nombre</span>
        <input required placeholder="Ej. Municipalidad de San Miguel de Tucumán" value={campos.nombre} onChange={(e) => set('nombre', e.target.value)} />
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Aclaración (opcional)</span>
        <input placeholder="Ej. Programa Los que Ayudan" value={campos.detalle} onChange={(e) => set('detalle', e.target.value)} />
        <small className="adm-ayuda">Una línea corta que aparece debajo del nombre.</small>
      </label>
      <CampoFoto
        titulo="Logo (opcional)"
        valor={campos.logo}
        onChange={(url) => set('logo', url)}
        ayuda="Mejor en PNG con fondo transparente. Si no hay logo, se muestran las iniciales."
      />
      <label className="adm-campo">
        <span className="adm-campo__nombre">Página web (opcional)</span>
        <input placeholder="Ej. www.smt.gob.ar" value={campos.link} onChange={(e) => set('link', e.target.value)} />
        <small className="adm-ayuda">Si la completás, al tocar el logo se abre esa página.</small>
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
