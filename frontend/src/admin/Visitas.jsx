import { useState } from 'react'
import { getVisitas } from '../api/admin'
import { ErrorMessage, Loader } from '../components/Status'
import { Cabecera, useDatos } from './comun'

// Visitas a la web, con gráficos. Solo administradoras.
// El contador es propio (sin Google ni cookies): ver registrarVisita en backend/api/lib/publico.php

const PERIODOS = [
  [7, 'Últimos 7 días'],
  [30, 'Últimos 30 días'],
  [90, 'Últimos 3 meses'],
  [365, 'Último año'],
]

const ORIGENES = {
  directo: 'Directo (link guardado o escrito)',
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  google: 'Google',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  otro: 'Otras páginas',
}

const DISPOSITIVOS = { celular: 'Celular', computadora: 'Computadora', tablet: 'Tablet' }

const numero = (n) => n.toLocaleString('es-AR')
const fecha = (dia, opciones) => new Date(`${dia}T12:00:00`).toLocaleDateString('es-AR', opciones)

// Con muchos días, las barras se agrupan: 3 meses -> por semana, 1 año -> por mes
function agrupar(porDia, dias) {
  if (dias <= 30) {
    return porDia.map((d) => ({ ...d, etiqueta: fecha(d.dia, { weekday: 'short', day: 'numeric', month: 'short' }), corta: fecha(d.dia, { day: 'numeric', month: 'short' }) }))
  }
  const grupos = []
  porDia.forEach((d, i) => {
    const clave = dias > 90 ? d.dia.slice(0, 7) : Math.floor(i / 7)
    let g = grupos.at(-1)
    if (!g || g.clave !== clave) {
      g = { clave, desde: d.dia, hasta: d.dia, visitas: 0, personas: 0 }
      grupos.push(g)
    }
    g.hasta = d.dia
    g.visitas += d.visitas
    g.personas += d.personas
  })
  return grupos.map((g) =>
    dias > 90
      ? { ...g, etiqueta: fecha(g.desde, { month: 'long', year: 'numeric' }), corta: fecha(g.desde, { month: 'short' }) }
      : {
          ...g,
          etiqueta: `Semana del ${fecha(g.desde, { day: 'numeric', month: 'short' })} al ${fecha(g.hasta, { day: 'numeric', month: 'short' })}`,
          corta: fecha(g.desde, { day: 'numeric', month: 'short' }),
        },
  )
}

export default function Visitas() {
  const [dias, setDias] = useState(30)
  const { data, loading, error } = useDatos(() => getVisitas(dias), [dias])

  return (
    <>
      <Cabecera titulo="Visitas" />
      <p className="adm-intro">Cuántas personas entran a la web y qué miran. Se cuenta sin cookies y sin guardar datos de nadie.</p>

      <div className="adm-periodos" role="group" aria-label="Período">
        {PERIODOS.map(([valor, nombre]) => (
          <button key={valor} type="button" className={`adm-periodo${dias === valor ? ' is-activo' : ''}`} aria-pressed={dias === valor} onClick={() => setDias(valor)}>
            {nombre}
          </button>
        ))}
      </div>

      {loading && !data && <Loader />}
      {error && <ErrorMessage error={error} />}
      {data && (
        // Mientras carga otro período se sigue viendo el anterior, más clarito
        <div className={`adm-visitas${loading ? ' is-cargando' : ''}`}>
          <div className="adm-numeros">
            <Numero valor={data.visitas} titulo="Visitas" detalle="Páginas abiertas" color="violeta" />
            <Numero valor={data.personas} titulo="Personas" detalle="Aproximado" color="rosa" />
            <Numero valor={data.hoy} titulo="Hoy" detalle="Visitas de hoy" color="naranja" />
            <Numero valor={Math.round(data.visitas / data.dias)} titulo="Por día" detalle="En promedio" color="verde" />
          </div>

          {data.visitas === 0 ? (
            <p className="adm-caja adm-visitas__vacio">Todavía no hay visitas en este período. Se cuentan desde que se activó esta sección.</p>
          ) : (
            <>
              <GraficoBarras grupos={agrupar(data.por_dia, data.dias)} dias={data.dias} />
              <div className="adm-visitas__listas">
                <Lista
                  titulo="Las páginas más vistas"
                  color="rosa"
                  filas={data.paginas.map((p) => ({ nombre: p.nombre, valor: p.visitas }))}
                />
                <Lista
                  titulo="Desde dónde llegan"
                  color="naranja"
                  filas={data.origenes.map((o) => ({ nombre: ORIGENES[o.origen] ?? o.origen, valor: o.visitas }))}
                  vacio="Todavía no hay datos."
                />
                <Lista
                  titulo="Celular o computadora"
                  color="celeste"
                  porcentaje
                  filas={data.dispositivos.map((d) => ({ nombre: DISPOSITIVOS[d.dispositivo] ?? d.dispositivo, valor: d.visitas }))}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

function Numero({ valor, titulo, detalle, color }) {
  return (
    <div className="adm-numero" style={{ '--c': `var(--${color})` }}>
      <strong>{numero(valor)}</strong>
      <span>{titulo}</span>
      <small>{detalle}</small>
    </div>
  )
}

// Visitas por día (o por semana / mes): barras verticales, con el detalle al pasar el mouse o con el teclado
function GraficoBarras({ grupos, dias }) {
  const [activo, setActivo] = useState(null)
  const maximo = Math.max(1, ...grupos.map((g) => g.visitas))
  // Tres líneas de referencia redondeadas: 0, la mitad y el máximo
  const tope = Math.max(2, Math.ceil(maximo / 2) * 2)
  const unidad = dias <= 30 ? 'día' : dias <= 90 ? 'semana' : 'mes'
  const marcas = new Set([0, Math.floor((grupos.length - 1) / 2), grupos.length - 1])
  const g = activo !== null ? grupos[activo] : null

  return (
    <section className="adm-caja adm-grafico">
      <h2>Visitas por {unidad}</h2>
      <div className="adm-grafico__zona" onPointerLeave={() => setActivo(null)}>
        <div className="adm-grafico__eje" aria-hidden="true">
          <span>{numero(tope)}</span>
          <span>{numero(tope / 2)}</span>
          <span>0</span>
        </div>
        <div className="adm-grafico__barras" style={{ '--n': grupos.length }}>
          {grupos.map((b, i) => (
            <div
              key={b.dia ?? b.clave}
              className={`adm-grafico__columna${activo === i ? ' is-activa' : ''}`}
              tabIndex={0}
              aria-label={`${b.etiqueta}: ${b.visitas} visitas, ${b.personas} personas`}
              onPointerEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
            >
              <span className="adm-grafico__barra" style={{ height: `${(b.visitas / tope) * 100}%` }} />
              {marcas.has(i) && <span className="adm-grafico__fecha">{b.corta}</span>}
            </div>
          ))}
          {g && (
            <div className="adm-grafico__globo" style={{ left: `${Math.min(85, Math.max(15, ((activo + 0.5) / grupos.length) * 100))}%` }} role="status">
              <strong>{numero(g.visitas)} visitas</strong>
              <span>{numero(g.personas)} personas</span>
              <small>{g.etiqueta}</small>
            </div>
          )}
        </div>
      </div>
      <details className="adm-grafico__tabla">
        <summary>Ver los números en una tabla</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">{unidad[0].toUpperCase() + unidad.slice(1)}</th>
              <th scope="col">Visitas</th>
              <th scope="col">Personas</th>
            </tr>
          </thead>
          <tbody>
            {[...grupos].reverse().map((b) => (
              <tr key={b.dia ?? b.clave}>
                <td>{b.etiqueta}</td>
                <td>{numero(b.visitas)}</td>
                <td>{numero(b.personas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}

// Ranking con barras horizontales; el número siempre está escrito al lado
function Lista({ titulo, filas, color, porcentaje = false, vacio = 'Sin datos.' }) {
  const maximo = Math.max(1, ...filas.map((f) => f.valor))
  const total = filas.reduce((s, f) => s + f.valor, 0)
  return (
    <section className="adm-caja adm-ranking" style={{ '--c': `var(--${color})` }}>
      <h2>{titulo}</h2>
      {filas.length === 0 ? (
        <p className="adm-ayuda">{vacio}</p>
      ) : (
        <ol>
          {filas.map((f) => (
            <li key={f.nombre} title={`${f.nombre}: ${numero(f.valor)} visitas`}>
              <span className="adm-ranking__nombre">{f.nombre}</span>
              <span className="adm-ranking__valor">{porcentaje ? `${Math.round((f.valor / total) * 100)}%` : numero(f.valor)}</span>
              <span className="adm-ranking__pista" aria-hidden="true">
                <span style={{ width: `${(f.valor / maximo) * 100}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
