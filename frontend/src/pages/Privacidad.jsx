import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSitio } from '../api/useSitio'
import PageIntro from '../components/PageIntro'
import Reveal from '../components/motion/Reveal'
import './pages.css'

// Política de privacidad. Describe lo que hace la web de verdad: si cambia algo (por ejemplo, se agrega
// Google Analytics o un formulario nuevo), hay que actualizar este texto y la fecha de abajo.
const ACTUALIZADA = 'noviembre de 2026'

export default function Privacidad() {
  const { email } = useSitio()

  useEffect(() => {
    document.title = 'Política de privacidad – Mujeres en Red'
  }, [])

  const escribinos = email ? (
    <a href={`mailto:${email}`}>{email}</a>
  ) : (
    <Link to="/contacto">la página de contacto</Link>
  )

  return (
    <>
      <PageIntro eyebrow="Privacidad" title="Cuidamos tus *datos*" lead="Qué datos guardamos cuando nos escribís o visitás la web, para qué los usamos y cómo podés pedir que los borremos." />
      <section className="section privacidad">
        <div className="container">
          <Reveal className="privacidad__texto">
            <h2>Quién es responsable</h2>
            <p>
              La Fundación Mujeres en Red, de San Miguel de Tucumán, Argentina, es la responsable de los datos que se reciben a través de este
              sitio. Ante cualquier consulta podés escribirnos a {escribinos}.
            </p>

            <h2>Cuando nos escribís desde el formulario de contacto</h2>
            <p>
              Guardamos tu nombre, tu correo, tu WhatsApp (si lo dejás), el asunto y el mensaje. Los usamos solo para responderte. El mensaje
              nos llega por correo y queda guardado en el sistema de la fundación, al que solo acceden las personas del equipo con usuario y
              contraseña.
            </p>
            <p>
              <strong>No vendemos ni compartimos tus datos</strong> con otras personas u organizaciones, y no te vamos a agregar a listas de
              difusión sin tu permiso.
            </p>

            <h2>Cuando visitás la web</h2>
            <p>
              Para saber cuántas personas nos visitan usamos un contador propio, <strong>sin cookies</strong> y sin servicios de publicidad.
              Registra qué página se abrió, desde dónde se llegó (por ejemplo, Instagram o Google) y si fue desde un celular o una computadora.
              No guarda tu dirección IP ni nada que permita saber quién sos: cada visitante se convierte en un código que cambia todos los
              días. Estos registros se borran solos a los dos años.
            </p>

            <h2>Cookies</h2>
            <p>
              Esta web no usa cookies de seguimiento ni de publicidad. La única cookie es la que usa el panel de administración para que las
              personas del equipo de la fundación mantengan su sesión iniciada; a quien visita la web no se le guarda ninguna.
            </p>

            <h2>Otros servicios</h2>
            <p>
              Las tipografías de la web se cargan desde Google Fonts. Los links a Instagram, Facebook, WhatsApp, Mercado Pago u otros sitios
              llevan a servicios que tienen sus propias políticas de privacidad. Si donás, el pago lo procesa Mercado Pago (o el medio que
              elijas): la fundación no recibe ni guarda los datos de tu tarjeta.
            </p>

            <h2>Tus derechos</h2>
            <p>
              Según la Ley 25.326 de Protección de Datos Personales, podés pedirnos en cualquier momento ver, corregir o borrar los datos que
              tengamos tuyos. Escribinos a {escribinos} y lo hacemos sin costo. La Agencia de Acceso a la Información Pública es el organismo
              de control de esta ley.
            </p>

            <p className="privacidad__fecha">Última actualización: {ACTUALIZADA}.</p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
