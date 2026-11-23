import { useId, useState } from 'react'

// Campo de contraseña con el ojito para ver lo que se escribe. Las demás propiedades van al <input>.
export default function CampoClave({ nombre, ayuda, ...propiedades }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const texto = visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'

  return (
    <div className="adm-campo">
      <label className="adm-campo__nombre" htmlFor={id}>
        {nombre}
      </label>
      <div className="adm-clave">
        <input {...propiedades} id={id} type={visible ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        {/* type="button" para que no mande el formulario; onMouseDown para no sacar el cursor del campo */}
        <button type="button" aria-label={texto} title={texto} onMouseDown={(e) => e.preventDefault()} onClick={() => setVisible(!visible)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M4 20 20 4" />}
          </svg>
        </button>
      </div>
      {ayuda && <small className="adm-ayuda">{ayuda}</small>}
    </div>
  )
}
