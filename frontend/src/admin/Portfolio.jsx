import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '../api/api'
import { CATEGORIAS, nombreCategoria } from '../api/portfolio'
import { borrarProyecto, getPortfolioPanel, getProyectoPanel, guardarProyecto } from '../api/admin'
import { ErrorMessage, Loader } from '../components/Status'
import Pagination from '../components/Pagination'
import { ahoraLocal, BarraEdicion, Cabecera, CampoFoto, Fila, Filtros, Total, useAvisoRecibido, useDatos, useFormulario, useListado } from './comun'
import { useBorrar } from './Dialogos'
import Editor from './Editor'
import CampoGaleria from './CampoGaleria'

export function Proyectos() {
  const { data, loading, error: errorCarga, recargar, pagina, setPagina, setFiltros } = useListado(getPortfolioPanel)
  const borrar = useBorrar({ tipo: 'proyecto', accion: borrarProyecto, nombre: (p) => p.titulo, onListo: recargar })

  return (
    <>
      <Cabecera titulo="Qué hacemos">
        <Link to="/admin/portfolio/nuevo" className="adm-btn is-principal">
          Agregar ficha
        </Link>
      </Cabecera>
      <Filtros onCambio={setFiltros} placeholder="Título o texto de la ficha" />
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.total} singular="ficha" plural="fichas" />}
      {data && data.items.length === 0 && <p className="adm-vacio">No encontramos fichas.</p>}
      {data && (
        <ul className="adm-lista">
          {data.items.map((p) => (
            <Fila key={p.id} to={`/admin/portfolio/${p.id}`} foto={p.foto || ''} titulo={p.titulo} detalle={`${nombreCategoria(p.categoria)} · ${formatDate(p.fecha)}`} estado={p.publicada}>
              <button type="button" className="adm-btn is-peligro" onClick={() => borrar(p)}>
                Borrar
              </button>
            </Fila>
          ))}
        </ul>
      )}
      {data && <Pagination page={pagina} totalPages={data.paginas} onChange={setPagina} />}
    </>
  )
}


const PROYECTO_NUEVO = { titulo: '', categoria: '', contenido: '', foto: '', galeria: [], publicada: false }

export function ProyectoEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(() => (id ? getProyectoPanel(id) : Promise.resolve(PROYECTO_NUEVO)), [id])
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <ProyectoForm key={id ?? 'nuevo'} id={id} proyecto={data} />
}

function ProyectoForm({ id, proyecto }) {
  const navigate = useNavigate()
  const { campos, set, sucio, setSucio } = useFormulario({
    ...proyecto,
    fecha: proyecto.fecha || ahoraLocal(),
    foto: proyecto.foto || '',
    galeria: proyecto.galeria ?? [],
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState(useAvisoRecibido())

  async function guardar(publicada) {
    setGuardando(true)
    setError('')
    setAviso('')
    try {
      const guardado = await guardarProyecto(id, { ...campos, publicada })
      const mensaje = publicada ? 'Listo, la ficha está publicada en la web.' : 'Listo, quedó guardada como borrador.'
      set('publicada', publicada)
      setSucio(false)
      if (id) setAviso(mensaje)
      else navigate(`/admin/portfolio/${guardado.id}`, { replace: true, state: { aviso: mensaje } })
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <BarraEdicion
        volver="/admin/portfolio"
        sucio={sucio}
        guardando={guardando}
        publicada={campos.publicada}
        onGuardar={guardar}
        ver={campos.slug && `/portfolio/${campos.slug}`}
        error={error}
        aviso={aviso}
      />
      <div className="adm-editar">
        <div className="adm-editar__principal">
          <label className="adm-campo">
            <span className="adm-campo__nombre">Título</span>
            <input className="adm-titulo" required value={campos.titulo} onChange={(e) => set('titulo', e.target.value)} />
            <small className="adm-ayuda">Solo el nombre, por ejemplo "Mujer Emprendedora". Si es programa, networking, voluntariado o DeporVida se elige al costado.</small>
          </label>
          <Editor etiqueta="Descripción" valor={campos.contenido} onChange={(html) => set('contenido', html)} />
          <CampoGaleria valor={campos.galeria} onChange={(g) => set('galeria', g)} onPrincipal={(url) => set('foto', url)} />
          <p className="adm-ayuda adm-ayuda--caja">
            ¿Querés contar algo de esta ficha (un encuentro, una novedad)? Escribí una nota en <strong>Blog</strong> y elegí esta ficha en
            "¿De qué programa o evento habla?": la nota aparece en el blog y también acá, en "Novedades".
          </p>
        </div>
        <aside className="adm-editar__lado">
          <label className="adm-campo">
            <span className="adm-campo__nombre">¿Qué es?</span>
            <select required value={campos.categoria} onChange={(e) => set('categoria', e.target.value)}>
              <option value="">Elegí una opción</option>
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.singular}
                </option>
              ))}
            </select>
            <small className="adm-ayuda">
              Programa: se hace todo el año. Networking: encuentros para conectarse. Voluntariado: para las voluntarias. DeporVida: el programa de radio de los sábados en LV12.
            </small>
          </label>
          <CampoFoto valor={campos.foto} onChange={(url) => set('foto', url)} />
          <label className="adm-campo">
            <span className="adm-campo__nombre">Fecha</span>
            <input
              type="date"
              value={campos.fecha.slice(0, 10)}
              onChange={(e) => e.target.value && set('fecha', e.target.value + campos.fecha.slice(10))}
            />
            <small className="adm-ayuda">Las fichas se ordenan por fecha, del más nuevo al más viejo.</small>
          </label>
        </aside>
      </div>
    </form>
  )
}
