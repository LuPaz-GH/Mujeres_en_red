import { useEffect, useState } from 'react'
import { AJUSTES_INICIALES } from '../data/site'
import { getAjustes } from './api'
import { whatsappUrl } from './whatsapp'

// Datos de la web que se cambian desde el panel (Datos de la web): WhatsApp, correo, redes y formas de donar.
// Mientras cargan se usan los de data/site.js, así nada aparece vacío. Lo que se deja vacío en el panel no se muestra.

let ultimos = null

function leerImpacto(json) {
  try {
    return (JSON.parse(json || '[]') || []).filter((i) => i.numero && i.texto)
  } catch {
    return []
  }
}

function armar(a) {
  return {
    email: a.email,
    whatsapp: a.whatsapp,
    whatsappUrl: whatsappUrl(a.whatsapp),
    social: { instagram: a.instagram, facebook: a.facebook, twitter: a.twitter, linkedin: a.linkedin },
    // Números de impacto del inicio: solo los que tienen número y texto
    impacto: leerImpacto(a.impacto),
    transparencia: { razonSocial: a.razon_social, cuit: a.cuit, personeria: a.personeria, memoria: a.memoria },
    donaciones: {
      mercadoPago: a.mercadopago,
      paypal: a.paypal,
      qr: a.qr,
      transferencia: {
        titular: a.transferencia_titular,
        alias: a.transferencia_alias,
        cbu: a.transferencia_cbu,
        cuit: a.transferencia_cuit,
        banco: a.transferencia_banco,
      },
    },
  }
}

export function useSitio() {
  const [ajustes, setAjustes] = useState(ultimos ?? AJUSTES_INICIALES)

  useEffect(() => {
    let activo = true
    getAjustes()
      .then((a) => {
        ultimos = { ...AJUSTES_INICIALES, ...a }
        if (activo) setAjustes(ultimos)
      })
      .catch(() => {}) // si falla, quedan los datos de data/site.js
    return () => {
      activo = false
    }
  }, [])

  return armar(ajustes)
}

// "https://www.instagram.com/mujeresenred/" -> "mujeresenred" (para mostrar la cuenta en Contacto)
export function usuarioDe(url) {
  return (url || '').replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop()
}
