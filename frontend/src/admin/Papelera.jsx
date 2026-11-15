import { useState } from 'react'
import { eliminarDefinitivo, getPapelera, restaurar } from '../api/admin'
import Pagination from '../components/Pagination'
import { ErrorMessage, Loader } from '../components/Status'
import { useDialogos } from './Dialogos'
import { Aviso, Cabecera, fechaYHora, Filtros, TIPOS, Total, useListado } from './comun'

// Lo que se borró en el panel. Cada voluntaria ve y recupera lo suyo; las administradoras ven todo y pueden eliminar del todo.

export default function Papelera({ esAdmin }) {
  const [tipo, setTipo] = useState('')
  const { data, loading, error: errorCarga, recargar, pagina, setPagina, setFiltros } = useListado((filtros) => getPapelera({ ...filtros, tipo }), [tipo])
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const { confirmar } = useDialogos()

  function elegirTipo(valor) {
    setPagina(1)
    setTipo(valor)
  }

  async function hacer(accion, mensaje) {
    setError('')
    setAviso('')
    try {
      await accion()
      setAviso(mensaje)
      recargar()
    } catch (e) {
      setError(e.message)
    }
  }

  async function eliminar(f) {
    const seguro = await confirmar({
      titulo: `¿Eliminar "${f.titulo}" para siempre?`,
      texto: 'Esto no se puede deshacer.',
      boton: 'Eliminar definitivamente',
      peligro: true,
    })
    if (!seguro) return
    hacer(() => eliminarDefinitivo(f.tipo, f.id), `Se eliminó "${f.titulo}" para siempre.`)
  }

  return (
    <>
      <Cabecera titulo="Papelera" />
      <p className="adm-intro">
        {esAdmin
          ? 'Lo que se borró en el panel. Podés devolverlo a su lugar o eliminarlo para siempre.'
          : '¿Borraste algo por error? Acá está todo lo que borraste vos: tocá Restaurar y vuelve a su lugar.'}
      </p>
      <Filtros onCambio={setFiltros} placeholder="Nombre" ayudaFechas="Las fechas son las del borrado.">
        <label>
          <span>Qué es</span>
          <select value={tipo} onChange={(e) => elegirTipo(e.target.value)}>
            <option value="">Todo</option>
            {Object.entries(TIPOS).map(([valor, nombre]) => (
              <option key={valor} value={valor}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
      </Filtros>
      <Aviso>{aviso}</Aviso>
      <Aviso tipo="error">{error}</Aviso>
      {loading && !data && <Loader />}
      {errorCarga && <ErrorMessage error={errorCarga} />}
      {data && <Total total={data.total} singular="elemento" plural="elementos" />}
      {data && data.items.length === 0 && <p className="adm-vacio">La papelera está vacía.</p>}
      <ul className="adm-lista">
        {data?.items.map((f) => (
          <li key={`${f.tipo}-${f.id}`} className="adm-fila">
            <span className="adm-fila__principal">
              <span className="adm-fila__texto">
                <strong>{f.titulo}</strong>
                <small>
                  {TIPOS[f.tipo]} · lo borró {f.borrada_por} · {fechaYHora(f.borrada)}
                </small>
              </span>
            </span>
            <div className="adm-fila__acciones">
              <button type="button" className="adm-btn" onClick={() => hacer(() => restaurar(f.tipo, f.id), `Se restauró "${f.titulo}".`)}>
                Restaurar
              </button>
              {esAdmin && (
                <button type="button" className="adm-btn is-peligro" onClick={() => eliminar(f)}>
                  Eliminar definitivamente
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {data && <Pagination page={pagina} totalPages={data.paginas} onChange={setPagina} />}
    </>
  )
}
