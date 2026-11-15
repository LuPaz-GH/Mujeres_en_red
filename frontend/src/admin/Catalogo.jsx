import { useState } from 'react'
import { useBorrar, useDialogos } from './Dialogos'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarFicha, borrarRubro, getFicha, getFichas, getRubros, guardarFicha, guardarRubro } from '../api/admin'
import Pagination from '../components/Pagination'
import { ErrorMessage, Loader } from '../components/Status'
import { Aviso, CAMBIOS_SIN_GUARDAR, Cabecera, CampoFoto, Fila, Filtros, ListaNombres, Total, useAvisoRecibido, useDatos, useFormulario, useListado } from './comun'

const REDES = [
  ['whatsapp', 'WhatsApp', 'Número (ej. 381 5134073) o link'],
  ['instagram', 'Instagram', 'Usuario (ej. @mitienda) o link'],
  ['facebook', 'Facebook', 'Usuario o link'],
  ['tiktok', 'TikTok', 'Usuario o link'],
  ['linkedin', 'LinkedIn', 'Link'],
  ['web', 'Sitio web', 'ej. www.mitienda.com.ar'],
  ['email', 'Correo', 'ej. hola@mitienda.com'],
]

export function Fichas() {
  const { data, loading, error: errorCarga, recargar, pagina, setPagina, setFiltros } = useListado(getFichas)
  const borrar = useBorrar({ tipo: 'emprendimiento', accion: borrarFicha, nombre: (f) => f.nombre, onListo: recargar })
  const aviso = useAvisoRecibido()

  return (
    <>
      <Cabecera titulo="Catálogo">
        <Link to="/admin/catalogo/rubros" className="adm-btn">
          Rubros
        </Link>
        <Link to="/admin/catalogo/nuevo" className="adm-btn is-principal">
          Agregar emprendimiento
        </Link>
      </Cabecera>
      <Filtros
        onCambio={setFiltros}
        placeholder="Nombre, descripción o rubro"
        ayudaFechas="Las fechas son las de carga. Los emprendimientos que vinieron de WordPress no tienen fecha."
      />
      <Aviso>{aviso}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.total} singular="emprendimiento" plural="emprendimientos" />}
      {data && data.items.length === 0 && <p className="adm-vacio">No encontramos emprendimientos.</p>}
      <ul className="adm-lista">
        {data?.items.map((f) => (
          <Fila
            key={f.id}
            to={`/admin/catalogo/${f.id}`}
            foto={f.foto || ''}
            titulo={f.nombre}
            detalle={f.publicado ? f.rubro : `${f.rubro} · oculto en la web`}
          >
            <button type="button" className="adm-btn is-peligro" onClick={() => borrar(f)}>
              Borrar
            </button>
          </Fila>
        ))}
      </ul>
      {data && <Pagination page={pagina} totalPages={data.paginas} onChange={setPagina} />}
    </>
  )
}

export function Rubros() {
  const { data, setData, loading, error, recargar } = useDatos(getRubros)
  return (
    <>
      <Cabecera titulo="Rubros del catálogo" inicio={false}>
        <Link to="/admin/catalogo" className="adm-volver">
          Volver al catálogo
        </Link>
      </Cabecera>
      <p className="adm-intro">Un rubro solo se puede borrar cuando ya no tiene emprendimientos.</p>
      {loading && <Loader />}
      {error && <ErrorMessage error={error} />}
      {data && (
        <ListaNombres
          items={data}
          unidad="Nuevo rubro"
          tipo="rubro"
          recargar={recargar}
          cuenta={(n) => (n === 1 ? '1 emprendimiento' : `${n} emprendimientos`)}
          onGuardar={async (item, nombre) => setData(await guardarRubro(item?.id, { nombre, orden: item?.orden }))}
          onBorrar={borrarRubro}
        />
      )}
    </>
  )
}

export function FichaEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(async () => {
    const [ficha, rubros] = await Promise.all([id ? getFicha(id) : null, getRubros()])
    return { ficha, rubros }
  }, [id])
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <FichaForm key={id ?? 'nueva'} ficha={data.ficha} rubros={data.rubros} />
}

function FichaForm({ ficha, rubros }) {
  const navigate = useNavigate()
  const { confirmar } = useDialogos()
  const { campos, set, sucio, setSucio } = useFormulario({
    nombre: ficha?.nombre ?? '',
    rubro_id: ficha?.rubro_id ?? '',
    descripcion: ficha?.descripcion ?? '',
    foto: ficha?.foto ?? '',
    publicado: ficha?.publicado ?? true,
    links: ficha?.links?.length ? ficha.links : [{ tipo: 'whatsapp', url: '', texto: '' }],
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cambiarLink = (i, cambios) => set('links', campos.links.map((l, j) => (j === i ? { ...l, ...cambios } : l)))
  const quitarLink = (i) => set('links', campos.links.filter((_, j) => j !== i))
  const agregarLink = () => set('links', [...campos.links, { tipo: 'instagram', url: '', texto: '' }])

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await guardarFicha(ficha?.id, { ...campos, orden: ficha?.orden })
      setSucio(false)
      navigate('/admin/catalogo', { state: { aviso: `Listo, se guardó "${campos.nombre}".` } })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  async function volver(e) {
    e.preventDefault()
    if (!sucio || (await confirmar(CAMBIOS_SIN_GUARDAR))) navigate('/admin/catalogo')
  }

  return (
    <form onSubmit={guardar} className="adm-ficha">
      <Link to="/admin/catalogo" className="adm-volver" onClick={volver}>
        Volver al catálogo
      </Link>
      <h1>{ficha ? ficha.nombre : 'Nuevo emprendimiento'}</h1>

      <label className="adm-campo">
        <span className="adm-campo__nombre">Nombre</span>
        <input required value={campos.nombre} onChange={(e) => set('nombre', e.target.value)} />
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Rubro</span>
        <select required value={campos.rubro_id} onChange={(e) => set('rubro_id', Number(e.target.value))}>
          <option value="">Elegí un rubro</option>
          {rubros.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Descripción</span>
        <textarea rows="4" value={campos.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
      </label>
      <CampoFoto titulo="Logo o foto" valor={campos.foto} onChange={(url) => set('foto', url)} />

      <fieldset className="adm-campo">
        <legend className="adm-campo__nombre">Contacto y redes</legend>
        {campos.links.map((l, i) => {
          const tipo = REDES.find(([t]) => t === l.tipo)
          return (
            <div key={i} className="adm-link-fila">
              <select aria-label="Tipo de link" value={l.tipo} onChange={(e) => cambiarLink(i, { tipo: e.target.value })}>
                {REDES.map(([t, nombre]) => (
                  <option key={t} value={t}>
                    {nombre}
                  </option>
                ))}
              </select>
              <input aria-label="Dirección" placeholder={tipo?.[2]} value={l.url.replace(/^mailto:/, '')} onChange={(e) => cambiarLink(i, { url: e.target.value })} />
              {l.tipo === 'whatsapp' && (
                <input aria-label="Número que se muestra" placeholder="Número que se muestra" value={l.texto} onChange={(e) => cambiarLink(i, { texto: e.target.value })} />
              )}
              <button type="button" className="adm-btn is-suave" onClick={() => quitarLink(i)}>
                Quitar
              </button>
            </div>
          )
        })}
        <button type="button" className="adm-btn" onClick={agregarLink}>
          Agregar otro
        </button>
      </fieldset>

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
