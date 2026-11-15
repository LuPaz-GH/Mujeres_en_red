import { useState } from 'react'
import { getActividad, getCuentas } from '../api/admin'
import Pagination from '../components/Pagination'
import { ErrorMessage, Loader } from '../components/Status'
import { Cabecera, fechaYHora, Filtros, TIPOS, Total, useDatos, useListado } from './comun'

// Todo lo que hizo cada persona en el panel. Solo la ven las administradoras.

export default function Actividad() {
  const [cuenta, setCuenta] = useState('')
  const { data, loading, error, pagina, setPagina, setFiltros } = useListado((filtros) => getActividad({ ...filtros, usuaria: cuenta }), [cuenta])
  const { data: cuentas } = useDatos(() => getCuentas({ por_pagina: 100 }))

  function elegirCuenta(valor) {
    setPagina(1)
    setCuenta(valor)
  }

  return (
    <>
      <Cabecera titulo="Actividad" />
      <p className="adm-intro">Todo lo que hace cada persona en el panel. Este registro no se puede editar ni borrar.</p>
      <Filtros onCambio={setFiltros} placeholder="Persona, acción o nombre del elemento">
        <label>
          <span>Persona</span>
          <select value={cuenta} onChange={(e) => elegirCuenta(e.target.value)}>
            <option value="">Todas</option>
            {cuentas?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </Filtros>
      {loading && !data && <Loader />}
      {error && <ErrorMessage error={error} />}
      {data && <Total total={data.total} singular="movimiento" plural="movimientos" />}
      {data && data.items.length === 0 && <p className="adm-vacio">No encontramos movimientos.</p>}
      <ul className="adm-lista">
        {data?.items.map((a) => (
          <li key={a.id} className="adm-movimiento">
            <span>
              <strong>{a.usuaria}</strong> {a.accion}
              {TIPOS[a.tipo] && ` ${TIPOS[a.tipo].toLowerCase()}`}
              {a.titulo && <em> {a.titulo}</em>}
            </span>
            <small>{fechaYHora(a.fecha)}</small>
          </li>
        ))}
      </ul>
      {data && <Pagination page={pagina} totalPages={data.paginas} onChange={setPagina} />}
    </>
  )
}
