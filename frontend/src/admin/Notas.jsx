import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '../api/api'
import {
  borrarCategoria,
  borrarNota,
  getCategoriasPanel,
  getNotaPanel,
  getNotasPanel,
  getPortfolioPanel,
  guardarCategoria,
  guardarNota,
} from '../api/admin'
import { CATEGORIAS } from '../api/portfolio'
import Pagination from '../components/Pagination'
import { ErrorMessage, Loader } from '../components/Status'
import {
  ahoraLocal,
  BarraEdicion,
  CampoFoto,
  Cabecera,
  Fila,
  Filtros,
  ListaNombres,
  Total,
  useAvisoRecibido,
  useDatos,
  useFormulario,
  useListado,
} from './comun'
import { useBorrar } from './Dialogos'
import Editor from './Editor'

const fotoDe = (n) => n.foto || n.imagenes[0] || ''

export function Notas() {
  const { data, loading, error: errorCarga, recargar, pagina, setPagina, setFiltros } = useListado(getNotasPanel)
  const borrar = useBorrar({ tipo: 'nota', accion: borrarNota, nombre: (n) => n.titulo, onListo: recargar })

  return (
    <>
      <Cabecera titulo="Notas">
        <Link to="/admin/notas/categorias" className="adm-btn">
          Categorías
        </Link>
        <Link to="/admin/notas/nueva" className="adm-btn is-principal">
          Escribir nota
        </Link>
      </Cabecera>

      <Filtros onCambio={setFiltros} placeholder="Título o texto de la nota" />

      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.total} singular="nota" plural="notas" />}
      {data && data.items.length === 0 && <p className="adm-vacio">No encontramos notas.</p>}
      {data && (
        <ul className="adm-lista">
          {data.items.map((n) => (
            <Fila key={n.id} to={`/admin/notas/${n.id}`} foto={fotoDe(n)} titulo={n.titulo} detalle={formatDate(n.fecha)} estado={n.publicada}>
              <button type="button" className="adm-btn is-peligro" onClick={() => borrar(n)}>
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

export function Categorias() {
  const { data, setData, loading, error, recargar } = useDatos(getCategoriasPanel)
  return (
    <>
      <Cabecera titulo="Categorías de las notas" inicio={false}>
        <Link to="/admin/notas" className="adm-volver">
          Volver a las notas
        </Link>
      </Cabecera>
      <p className="adm-intro">Si borrás una categoría, las notas no se borran: solo dejan de mostrarla mientras esté en la papelera.</p>
      {loading && <Loader />}
      {error && <ErrorMessage error={error} />}
      {data && (
        <ListaNombres
          items={data}
          unidad="Nueva categoría"
          tipo="categoria"
          recargar={recargar}
          cuenta={(n) => (n === 1 ? '1 nota' : `${n} notas`)}
          onGuardar={async (item, nombre) => setData(await guardarCategoria(item?.id, nombre))}
          onBorrar={borrarCategoria}
        />
      )}
    </>
  )
}

const NOTA_NUEVA = { titulo: '', contenido: '', resumen: '', foto: '', autora: '', portfolio_id: null, publicada: false, categorias: [], etiquetas: [] }

export function NotaEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(
    async () => {
      const [nota, categorias, fichas] = await Promise.all([
        id ? getNotaPanel(id) : NOTA_NUEVA,
        getCategoriasPanel(),
        getPortfolioPanel({ por_pagina: 100 }).then((r) => r.items),
      ])
      return { nota, categorias, fichas }
    },
    [id],
  )
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <NotaForm key={id ?? 'nueva'} id={id} nota={data.nota} categoriasIniciales={data.categorias} fichas={data.fichas} />
}

function NotaForm({ id, nota, categoriasIniciales, fichas }) {
  const navigate = useNavigate()
  const { campos, set, sucio, setSucio } = useFormulario({
    ...nota,
    fecha: nota.fecha || ahoraLocal(),
    foto: nota.foto || '',
    portfolio_id: nota.portfolio_id ? String(nota.portfolio_id) : '',
    categorias: nota.categorias.map((c) => c.id ?? c),
    etiquetas: nota.etiquetas.map((e) => e.nombre ?? e).join(', '),
  })
  const [categorias, setCategorias] = useState(categoriasIniciales)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState(useAvisoRecibido())

  function marcarCategoria(cat, marcada) {
    set('categorias', marcada ? [...campos.categorias, cat] : campos.categorias.filter((c) => c !== cat))
  }

  async function agregarCategoria() {
    const nombre = nuevaCategoria.trim()
    if (!nombre) return
    try {
      const lista = await guardarCategoria(null, nombre)
      const creada = lista.filter((c) => !categorias.some((v) => v.id === c.id))[0]
      setCategorias(lista)
      setNuevaCategoria('')
      if (creada) set('categorias', [...campos.categorias, creada.id])
    } catch (e) {
      setError(e.message)
    }
  }

  async function guardar(publicada) {
    setGuardando(true)
    setError('')
    setAviso('')
    try {
      const guardada = await guardarNota(id, {
        ...campos,
        publicada,
        etiquetas: campos.etiquetas.split(',').map((t) => t.trim()).filter(Boolean),
      })
      const mensaje = publicada ? 'Listo, la nota está publicada en la web.' : 'Listo, quedó guardada como borrador.'
      set('publicada', publicada)
      setSucio(false)
      if (id) setAviso(mensaje)
      else navigate(`/admin/notas/${guardada.id}`, { replace: true, state: { aviso: mensaje } })
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <BarraEdicion
        volver="/admin/notas"
        sucio={sucio}
        guardando={guardando}
        publicada={campos.publicada}
        onGuardar={guardar}
        ver={campos.slug && `/${campos.slug}`}
        error={error}
        aviso={aviso}
      />
      <div className="adm-editar">
        <div className="adm-editar__principal">
          <label className="adm-campo">
            <span className="adm-campo__nombre">Título</span>
            <input className="adm-titulo" required value={campos.titulo} onChange={(e) => set('titulo', e.target.value)} />
          </label>
          <Editor etiqueta="Texto de la nota" valor={campos.contenido} onChange={(html) => set('contenido', html)} />
        </div>

        <aside className="adm-editar__lado">
          <label className="adm-campo">
            <span className="adm-campo__nombre">¿De qué programa o evento habla?</span>
            <select value={campos.portfolio_id} onChange={(e) => set('portfolio_id', e.target.value)}>
              <option value="">De ninguno en especial</option>
              {CATEGORIAS.map((c) => {
                const deEsta = fichas.filter((p) => p.categoria === c.id)
                return (
                  deEsta.length > 0 && (
                    <optgroup key={c.id} label={c.plural}>
                      {deEsta.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titulo}
                        </option>
                      ))}
                    </optgroup>
                  )
                )
              })}
            </select>
            <small className="adm-ayuda">Si elegís uno, la nota aparece también en su página de "Qué hacemos", en "Novedades".</small>
          </label>
          <CampoFoto valor={campos.foto} onChange={(url) => set('foto', url)} ayuda="La que se ve en el listado del blog." />
          <label className="adm-campo">
            <span className="adm-campo__nombre">Fecha</span>
            <input
              type="date"
              value={campos.fecha.slice(0, 10)}
              onChange={(e) => e.target.value && set('fecha', e.target.value + campos.fecha.slice(10))}
            />
          </label>

          <fieldset className="adm-campo">
            <legend className="adm-campo__nombre">Categorías</legend>
            {categorias.map((c) => (
              <label key={c.id} className="adm-check">
                <input type="checkbox" checked={campos.categorias.includes(c.id)} onChange={(e) => marcarCategoria(c.id, e.target.checked)} />
                {c.nombre}
              </label>
            ))}
            <div className="adm-en-linea">
              <input
                placeholder="Nueva categoría"
                aria-label="Nueva categoría"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    agregarCategoria()
                  }
                }}
              />
              <button type="button" className="adm-btn" onClick={agregarCategoria}>
                Agregar
              </button>
            </div>
          </fieldset>

          <label className="adm-campo">
            <span className="adm-campo__nombre">Etiquetas</span>
            <input value={campos.etiquetas} onChange={(e) => set('etiquetas', e.target.value)} />
            <small className="adm-ayuda">Separadas por comas. Son opcionales.</small>
          </label>
          <label className="adm-campo">
            <span className="adm-campo__nombre">Autora</span>
            <input value={campos.autora || ''} onChange={(e) => set('autora', e.target.value)} />
            <small className="adm-ayuda">Si la dejás vacía, va tu nombre.</small>
          </label>
          <label className="adm-campo">
            <span className="adm-campo__nombre">Resumen</span>
            <textarea rows="4" value={campos.resumen || ''} onChange={(e) => set('resumen', e.target.value)} />
            <small className="adm-ayuda">Si lo dejás vacío, se usa el comienzo del texto.</small>
          </label>
        </aside>
      </div>
    </form>
  )
}
