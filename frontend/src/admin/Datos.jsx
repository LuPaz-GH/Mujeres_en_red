import { useState } from 'react'
import { getAjustesPanel, guardarAjustes } from '../api/admin'
import { ErrorMessage, Loader } from '../components/Status'
import { Aviso, Cabecera, CampoFoto, useDatos, useFormulario } from './comun'

// Datos de la web (solo administradoras): WhatsApp, correo, redes y formas de donar.
// Lo que se deja vacío deja de aparecer en la web.

const GRUPOS = [
  {
    titulo: 'Contacto',
    ayuda: 'Aparecen en Contacto, en el pie de la página y en Doná.',
    campos: [
      ['whatsapp', 'WhatsApp de la fundación', 'Ej. 381 641-0228'],
      ['email', 'Correo', 'Ej. info@mujeresenred.com.ar'],
    ],
  },
  {
    titulo: 'Redes sociales',
    ayuda: 'Los íconos de arriba y del pie de la página.',
    campos: [
      ['instagram', 'Instagram', 'Usuario (ej. @mujeresenred) o link'],
      ['facebook', 'Facebook', 'Usuario o link'],
      ['twitter', 'Twitter / X', 'Link'],
      ['linkedin', 'LinkedIn', 'Link'],
    ],
  },
  {
    titulo: 'Doná',
    ayuda: 'Las formas de donar de la página Doná. Cada una aparece solo si está completa.',
    campos: [
      ['mercadopago', 'Link de pago de Mercado Pago', 'Ej. link.mercadopago.com.ar/...'],
      ['paypal', 'PayPal (para donar desde el exterior)', 'Ej. paypal.me/mujeresenred'],
    ],
  },
  {
    titulo: 'Transferencia bancaria',
    ayuda: 'Aparece en Doná cuando hay alias o CBU.',
    campos: [
      ['transferencia_titular', 'Titular de la cuenta', 'Ej. Fundación Mujeres Facilitadoras en Acción'],
      ['transferencia_alias', 'Alias', ''],
      ['transferencia_cbu', 'CBU o CVU', ''],
      ['transferencia_cuit', 'CUIT', ''],
      ['transferencia_banco', 'Banco o billetera', ''],
    ],
  },
  {
    titulo: 'Transparencia',
    ayuda: 'Los datos legales de la fundación. Aparecen en Doná y en el pie de la página, y dan confianza a quien dona.',
    campos: [
      ['razon_social', 'Nombre legal de la fundación', 'Como figura en la personería jurídica'],
      ['cuit', 'CUIT', 'Ej. 30-12345678-9'],
      ['personeria', 'Personería jurídica', 'Ej. Resolución N° 123/2012 – Dirección de Personas Jurídicas'],
      ['memoria', 'Memoria y balance (link)', 'Ej. un link de Google Drive al PDF'],
    ],
  },
]

// Los 4 números de impacto del inicio (se guardan juntos, como lista)
const leerImpacto = (json) => {
  let lista = []
  try {
    lista = JSON.parse(json || '[]') || []
  } catch {
    // si estaba mal guardado, se empieza de cero
  }
  return Array.from({ length: 4 }, (_, i) => ({ numero: lista[i]?.numero ?? '', texto: lista[i]?.texto ?? '' }))
}

function CamposImpacto({ valor, onChange }) {
  const filas = leerImpacto(valor)
  const cambiar = (i, cambios) => onChange(JSON.stringify(filas.map((f, j) => (j === i ? { ...f, ...cambios } : f))))
  return (
    <fieldset className="adm-campo adm-grupo">
      <legend className="adm-campo__nombre">Números de impacto</legend>
      <small className="adm-ayuda">
        Aparecen grandes en el inicio, contando desde cero. Se muestran solo los que tienen número. Ejemplos de número: 14, +2.000, 95%.
      </small>
      {filas.map((f, i) => (
        <div key={i} className="adm-impacto-fila">
          <input aria-label={`Número ${i + 1}`} placeholder="Número" value={f.numero} onChange={(e) => cambiar(i, { numero: e.target.value })} />
          <input
            aria-label={`Qué cuenta el número ${i + 1}`}
            placeholder="Qué cuenta, ej. mujeres capacitadas"
            value={f.texto}
            onChange={(e) => cambiar(i, { texto: e.target.value })}
          />
        </div>
      ))}
    </fieldset>
  )
}

export default function Datos() {
  const { data, loading, error } = useDatos(getAjustesPanel)
  if (loading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return <DatosForm inicial={data} />
}

function DatosForm({ inicial }) {
  const { campos, set, sucio, setSucio } = useFormulario({ ...inicial, email: inicial.email.replace(/^mailto:/, '') })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setAviso('')
    try {
      const guardados = await guardarAjustes(campos)
      Object.entries(guardados).forEach(([clave, valor]) => set(clave, valor)) // los links quedan completos
      setSucio(false)
      setAviso('Listo, los datos ya se ven así en la web.')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="adm-ficha">
      <Cabecera titulo="Datos de la web" />
      <p className="adm-intro">Si algo queda vacío, deja de aparecer en la web.</p>

      <CamposImpacto valor={campos.impacto} onChange={(json) => set('impacto', json)} />

      {GRUPOS.map((g) => (
        <fieldset key={g.titulo} className="adm-campo adm-grupo">
          <legend className="adm-campo__nombre">{g.titulo}</legend>
          <small className="adm-ayuda">{g.ayuda}</small>
          {g.campos.map(([clave, nombre, ejemplo]) => (
            <label key={clave} className="adm-red">
              <span>{nombre}</span>
              <input placeholder={ejemplo} value={campos[clave]} onChange={(e) => set(clave, e.target.value)} />
            </label>
          ))}
          {g.titulo === 'Doná' && (
            <CampoFoto
              titulo="Código QR para donar"
              valor={campos.qr}
              onChange={(url) => set('qr', url)}
              ayuda="La imagen del QR que se genera en la app de Mercado Pago."
            />
          )}
        </fieldset>
      ))}

      <div className="adm-guardar-fijo">
        <Aviso tipo="error">{error}</Aviso>
        <Aviso>{aviso}</Aviso>
        <button className="adm-btn is-principal" disabled={guardando || !sucio}>
          {guardando ? 'Guardando…' : sucio ? 'Guardar cambios' : 'Sin cambios'}
        </button>
      </div>
    </form>
  )
}
