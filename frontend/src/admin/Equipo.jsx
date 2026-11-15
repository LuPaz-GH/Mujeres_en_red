import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarIntegrante, getEquipoPanel, getIntegrante, guardarIntegrante, ordenarEquipo } from '../api/admin'
import { ErrorMessage, Loader } from '../components/Status'
import { useBorrar, useDialogos } from './Dialogos'
import { Aviso, CAMBIOS_SIN_GUARDAR, Cabecera, CampoFoto, Fila, Total, useAvisoRecibido, useDatos, useFormulario } from './comun'

// Integrantes de la página Equipo: agregar, editar, ordenar y borrar

const COLORES = [
  ['rosa', 'Rosa'],
  ['celeste', 'Celeste'],
  ['verde', 'Verde'],
  ['violeta', 'Violeta'],
  ['naranja', 'Naranja'],
]

const REDES = [
  ['linkedin', 'LinkedIn', 'Link del perfil'],
  ['instagram', 'Instagram', 'Usuario (ej. @gaby_llobril) o link'],
  ['facebook', 'Facebook', 'Usuario o link'],
  ['tiktok', 'TikTok', 'Usuario o link'],
]

export function EquipoLista() {
  const { data, setData, loading, error: errorCarga, recargar } = useDatos(getEquipoPanel)
  const [error, setError] = useState('')
  const aviso = useAvisoRecibido()
  const borrar = useBorrar({ tipo: 'integrante', accion: borrarIntegrante, nombre: (m) => m.nombre, onListo: recargar })

  // Sube o baja una posición; se ve al instante y después se guarda
  async function mover(i, paso) {
    const lista = [...data]
    ;[lista[i], lista[i + paso]] = [lista[i + paso], lista[i]]
    setData(lista)
    setError('')
    try {
      setData(await ordenarEquipo(lista.map((m) => m.id)))
    } catch (e) {
      setError(e.message)
      recargar()
    }
  }

  return (
    <>
      <Cabecera titulo="Equipo">
        <Link to="/admin/equipo/nueva" className="adm-btn is-principal">
          Agregar integrante
        </Link>
      </Cabecera>
      <p className="adm-intro">Las personas de la página Equipo, en este mismo orden. Con las flechas las cambiás de lugar. Por ahora la página está oculta en la web: se puede ir cargando y se muestra cuando esté lista.</p>
      <Aviso>{aviso}</Aviso>
      <Aviso tipo="error">{error}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.length} singular="integrante" plural="integrantes" />}
      {data && data.length === 0 && <p className="adm-vacio">Todavía no hay nadie cargado.</p>}
      <ul className="adm-lista">
        {data?.map((m, i) => (
          <Fila
            key={m.id}
            to={`/admin/equipo/${m.id}`}
            foto={m.foto || ''}
            titulo={m.nombre}
            detalle={[m.cargo, !m.publicado && 'oculta en la web'].filter(Boolean).join(' · ')}
          >
            <button type="button" className="adm-btn is-suave" aria-label={`Subir a ${m.nombre}`} title="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>
              ↑
            </button>
            <button
              type="button"
              className="adm-btn is-suave"
              aria-label={`Bajar a ${m.nombre}`}
              title="Bajar"
              disabled={i === data.length - 1}
              onClick={() => mover(i, 1)}
            >
              ↓
            </button>
            <button type="button" className="adm-btn is-peligro" onClick={() => borrar(m)}>
              Borrar
            </button>
          </Fila>
        ))}
      </ul>
    </>
  )
}

export function IntegranteEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(() => (id ? getIntegrante(id) : Promise.resolve(null)), [id])
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <IntegranteForm key={id ?? 'nueva'} integrante={data} />
}

function IntegranteForm({ integrante }) {
  const navigate = useNavigate()
  const { confirmar } = useDialogos()
  const { campos, set, sucio, setSucio } = useFormulario({
    nombre: integrante?.nombre ?? '',
    cargo: integrante?.cargo ?? '',
    foto: integrante?.foto ?? '',
    bio: (integrante?.bio ?? []).join('\n'),
    redes: { linkedin: '', instagram: '', facebook: '', tiktok: '', ...integrante?.redes },
    color: integrante?.color ?? '',
    publicado: integrante?.publicado ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await guardarIntegrante(integrante?.id, { ...campos, bio: campos.bio.split('\n') })
      setSucio(false)
      navigate('/admin/equipo', { state: { aviso: `Listo, se guardó a ${campos.nombre}.` } })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  async function volver(e) {
    e.preventDefault()
    if (!sucio || (await confirmar(CAMBIOS_SIN_GUARDAR))) navigate('/admin/equipo')
  }

  return (
    <form onSubmit={guardar} className="adm-ficha">
      <Link to="/admin/equipo" className="adm-volver" onClick={volver}>
        Volver al equipo
      </Link>
      <h1>{integrante ? integrante.nombre : 'Nueva integrante'}</h1>

      <label className="adm-campo">
        <span className="adm-campo__nombre">Nombre y apellido</span>
        <input required value={campos.nombre} onChange={(e) => set('nombre', e.target.value)} />
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Cargo o profesión</span>
        <input placeholder="Ej. Presidente, o Lic. en Trabajo Social" value={campos.cargo} onChange={(e) => set('cargo', e.target.value)} />
      </label>
      <CampoFoto valor={campos.foto} onChange={(url) => set('foto', url)} titulo="Foto" ayuda="Mejor una foto vertical, de la cara y los hombros." />
      <label className="adm-campo">
        <span className="adm-campo__nombre">Trayectoria</span>
        <textarea
          rows="5"
          placeholder={'Coach Ontológico\nDocente de escuelas secundarias'}
          value={campos.bio}
          onChange={(e) => set('bio', e.target.value)}
        />
        <small className="adm-ayuda">Una cosa por renglón. Se ve al dar vuelta la tarjeta.</small>
      </label>

      <fieldset className="adm-campo">
        <legend className="adm-campo__nombre">Color de la tarjeta</legend>
        <div className="adm-colores">
          {COLORES.map(([color, nombre]) => (
            <label key={color} className="adm-color" style={{ '--color': `var(--${color})` }} title={nombre}>
              <input type="radio" name="color" value={color} checked={campos.color === color} onChange={() => set('color', color)} />
              <span>{nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="adm-campo">
        <legend className="adm-campo__nombre">Redes (opcional)</legend>
        {REDES.map(([red, nombre, ayuda]) => (
          <label key={red} className="adm-red">
            <span>{nombre}</span>
            <input placeholder={ayuda} value={campos.redes[red]} onChange={(e) => set('redes', { ...campos.redes, [red]: e.target.value })} />
          </label>
        ))}
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
