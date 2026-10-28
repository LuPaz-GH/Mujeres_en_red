import { DONATE_URL } from './site'

// Formas de donar que se muestran en la página /donar.
// Las que quedan vacías ('') no aparecen en la página: completarlas cuando estén los datos.
export const DONACIONES = {
  // Link de pago de Mercado Pago: tarjeta de crédito/débito, dinero en cuenta y efectivo en Rapipago
  mercadoPago: DONATE_URL,

  // QR de cobro (se genera desde la app de Mercado Pago). Los QR son interoperables:
  // se pueden pagar desde otras billeteras. Guardar la imagen en public/img/ y poner la ruta,
  // ej. '/img/qr-donaciones.png'
  qr: '',

  // Transferencia bancaria (desde cualquier banco o billetera virtual)
  transferencia: {
    titular: '', // ej. 'Fundación Mujeres Facilitadoras en Acción'
    alias: '',
    cbu: '', // CBU o CVU
    cuit: '',
    banco: '',
  },

  // Para donaciones desde el exterior (ej. 'https://paypal.me/mujeresenred')
  paypal: '',
}

// Billeteras que se nombran en las tarjetas de QR y transferencia
export const BILLETERAS = ['Naranja X', 'Ualá', 'Brubank', 'MODO', 'Cuenta DNI', 'BNA+', 'Mercado Pago']
