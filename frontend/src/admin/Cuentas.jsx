import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarCuenta, getCuenta, getCuentas, guardarCuenta } from '../api/admin'
import { formatDate } from '../api/api'
import Pagination from '../components/Pagination'
import { useBorrar } from './Dialogos'
import { ErrorMessage, Loader } from '../components/Status'
import { Aviso, Cabecera, Fila, Filtros, Total, useAvisoRecibido, useDatos, useFormulario, useListado } from './comun'

// Cuentas de las personas que entran al panel. Solo la ven las administradoras.

// "empleada" es el nombre interno en la base; en pantalla se muestra como Voluntaria
const ROLES = { admin: 'Administradora', empleada: 'Voluntaria' }

export function Cuentas({ usuaria }) {
  const { data, loading, error: errorCarga, recargar, pagina, setPagina, setFiltros } = useListado(getCuentas)
  const borrar = useBorrar({
    tipo: 'cuenta',
    accion: borrarCuenta,
    nombre: (c) => c.nombre,
    onListo: recargar,
    aclaracion: 'Ya no va a poder entrar al panel. La cuenta se puede recuperar desde la Papelera.',
  })
  const aviso = useAvisoRecibido()

  return (
    <>
      <Cabecera titulo="Cuentas">
        <Link to="/admin/cuentas/nueva" className="adm-btn is-principal">
          Crear cuenta
        </Link>
      </Cabecera>
      <p className="adm-intro">Las voluntarias cargan contenido. Las administradoras además ven la actividad, manejan las cuentas y la papelera.</p>
      <Filtros onCambio={setFiltros} placeholder="Nombre o correo" ayudaFechas="Las fechas son las de creación de la cuenta." />
      <Aviso>{aviso}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.total} singular="cuenta" plural="cuentas" />}
      {data && data.items.length === 0 && <p className="adm-vacio">No encontramos cuentas.</p>}
      <ul className="adm-lista">
        {data?.items.map((c) => (
          <Fila key={c.id} to={`/admin/cuentas/${c.id}`} titulo={c.nombre} detalle={`${ROLES[c.rol]} · ${c.email} · desde ${formatDate(c.creada)}`}>
            {c.id !== usuaria.id && (
              <button type="button" className="adm-btn is-peligro" onClick={() => borrar(c)}>
                Borrar
              </button>
            )}
          </Fila>
        ))}
      </ul>
      {data && <Pagination page={pagina} totalPages={data.paginas} onChange={setPagina} />}
    </>
  )
}

export function CuentaEditar() {
  const { id } = useParams()
  const { data, loading, error } = useDatos(() => (id ? getCuenta(id) : Promise.resolve({ nombre: '', email: '', rol: 'empleada' })), [id])
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <CuentaForm key={id ?? 'nueva'} id={id} cuenta={data} />
}

function CuentaForm({ id, cuenta }) {
  const navigate = useNavigate()
  const { campos, set, setSucio } = useFormulario({ ...cuenta, clave: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await guardarCuenta(id, campos)
      setSucio(false)
      navigate('/admin/cuentas', { state: { aviso: `Listo, se guardó la cuenta de ${campos.nombre}.` } })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="adm-ficha" autoComplete="off">
      <Link to="/admin/cuentas" className="adm-volver">
        Volver a las cuentas
      </Link>
      <h1>{id ? cuenta.nombre : 'Cuenta nueva'}</h1>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Nombre</span>
        <input required value={campos.nombre} onChange={(e) => set('nombre', e.target.value)} />
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Correo electrónico</span>
        <input type="email" required value={campos.email} onChange={(e) => set('email', e.target.value)} />
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">Tipo de cuenta</span>
        <select value={campos.rol} onChange={(e) => set('rol', e.target.value)}>
          {Object.entries(ROLES).map(([rol, nombre]) => (
            <option key={rol} value={rol}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="adm-campo">
        <span className="adm-campo__nombre">{id ? 'Contraseña nueva' : 'Contraseña'}</span>
        <input type="password" autoComplete="new-password" required={!id} minLength="8" value={campos.clave} onChange={(e) => set('clave', e.target.value)} />
        <small className="adm-ayuda">
          {id ? 'Dejala vacía para no cambiarla. Sirve si alguien se olvidó la suya.' : 'Al menos 8 caracteres. Después la persona la puede cambiar desde Mi cuenta.'}
        </small>
      </label>
      <Aviso tipo="error">{error}</Aviso>
      <button className="adm-btn is-principal" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}
