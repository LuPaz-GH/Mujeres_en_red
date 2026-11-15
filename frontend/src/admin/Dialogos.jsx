import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { restaurar } from '../api/admin'

// Ventanas del panel: confirmar una acción, pedir un dato y el aviso de abajo con "Deshacer".
// Reemplazan a las del navegador, que no se pueden diseñar y muestran "localhost dice".

const Contexto = createContext(null)
export const useDialogos = () => useContext(Contexto)

function Ventana({ dialogo, onCerrar }) {
  const ref = useRef(null)
  const [valor, setValor] = useState(dialogo.valor ?? '')

  // showModal bloquea lo de atrás, deja el foco adentro y cierra con Esc
  useEffect(() => {
    const ventana = ref.current
    ventana.showModal()
    return () => ventana.close()
  }, [])

  function enviar(e) {
    e.preventDefault()
    onCerrar(dialogo.campo ? valor.trim() : true)
  }

  return (
    <dialog
      ref={ref}
      className="adm-dialogo"
      aria-labelledby="adm-dialogo-titulo"
      onCancel={(e) => {
        e.preventDefault()
        onCerrar(dialogo.campo ? null : false)
      }}
    >
      <form onSubmit={enviar}>
        <h2 id="adm-dialogo-titulo">{dialogo.titulo}</h2>
        {dialogo.texto && <p>{dialogo.texto}</p>}
        {dialogo.campo && (
          <label className="adm-campo">
            <span className="adm-campo__nombre">{dialogo.campo}</span>
            <input autoFocus value={valor} placeholder={dialogo.ayuda} onChange={(e) => setValor(e.target.value)} />
          </label>
        )}
        <div className="adm-dialogo__botones">
          {/* En lo peligroso el foco arranca en Cancelar: un Enter sin querer no borra nada */}
          <button type="button" className="adm-btn" autoFocus={dialogo.peligro} onClick={() => onCerrar(dialogo.campo ? null : false)}>
            Cancelar
          </button>
          <button className={`adm-btn is-confirmar ${dialogo.peligro ? 'is-rojo' : 'is-principal'}`}>{dialogo.boton}</button>
        </div>
      </form>
    </dialog>
  )
}

export function DialogosProvider({ children }) {
  const [dialogo, setDialogo] = useState(null)
  const [aviso, setAviso] = useState(null)
  const temporizador = useRef(null)

  // confirmar({titulo, texto, boton, peligro}) -> true/false
  // pedir({titulo, texto, campo, valor, boton}) -> texto, o null si canceló
  const abrir = useCallback((opciones) => new Promise((resolver) => setDialogo({ ...opciones, resolver })), [])

  function cerrar(respuesta) {
    // Primero se cierra: mientras la ventana está abierta, lo de atrás no se puede tocar
    flushSync(() => setDialogo(null))
    dialogo.resolver(respuesta)
  }

  // Aviso de abajo: desaparece solo. {texto, error?, deshacer?}
  const avisar = useCallback((nuevo) => {
    clearTimeout(temporizador.current)
    setAviso(nuevo)
    temporizador.current = setTimeout(() => setAviso(null), nuevo.deshacer ? 10000 : 6000)
  }, [])

  async function deshacer() {
    const { deshacer: accion } = aviso
    setAviso(null)
    try {
      await accion()
      avisar({ texto: 'Listo, volvió a su lugar.' })
    } catch (e) {
      avisar({ texto: e.message, error: true })
    }
  }

  return (
    <Contexto.Provider value={{ confirmar: abrir, pedir: abrir, avisar }}>
      {children}
      {dialogo && <Ventana key={dialogo.titulo} dialogo={dialogo} onCerrar={cerrar} />}
      {aviso && (
        <div className={`adm-brindis ${aviso.error ? 'is-error' : ''}`} role="status">
          <span>{aviso.texto}</span>
          {aviso.deshacer && (
            <button type="button" onClick={deshacer}>
              Deshacer
            </button>
          )}
        </div>
      )}
    </Contexto.Provider>
  )
}

// Borrar cualquier cosa: pregunta, manda a la papelera y ofrece deshacer.
// tipo es el de la papelera, accion(id) la que borra, nombre(item) cómo se llama y onListo recarga la lista.
export function useBorrar({ tipo, accion, nombre, onListo, aclaracion = 'Deja de verse en la web, pero se puede recuperar desde la Papelera.' }) {
  const { confirmar, avisar } = useDialogos()

  return async function borrar(item) {
    const titulo = nombre(item)
    const seguro = await confirmar({ titulo: `¿Mandar "${titulo}" a la papelera?`, texto: aclaracion, boton: 'Mandar a la papelera', peligro: true })
    if (!seguro) return
    try {
      await accion(item.id)
      onListo()
      avisar({
        texto: `"${titulo}" está en la papelera.`,
        deshacer: async () => {
          await restaurar(tipo, item.id)
          onListo()
        },
      })
    } catch (e) {
      avisar({ texto: e.message, error: true })
    }
  }
}
