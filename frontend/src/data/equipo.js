import { WP_URL } from '../api/wp'
import { BRAND } from './brand'

// Integrantes del equipo (para sumar a alguien, agregar un objeto a la lista).
// bio: cada ítem es una línea de la trayectoria que se ve al dar vuelta la tarjeta.
// social: redes de cada una (linkedin, instagram, facebook, tiktok). Las que no se completan no aparecen.
export const EQUIPO = [
  {
    name: 'Gabriela Llobril',
    role: 'Presidente',
    photo: `${WP_URL}/wp-content/uploads/2024/01/5.jpg`,
    bio: [
      'Lic. en Comunicación Social',
      'Coach Ontológico',
      'Jefa del departamento de Comunicación en Liceo RESM',
      'Docente de escuelas secundarias',
    ],
    social: {
      linkedin: 'https://www.linkedin.com/in/gabrielallobril/',
      instagram: 'https://www.instagram.com/gaby_llobril/',
    },
    color: BRAND.rosa,
  },
  {
    name: 'Priscila Vargas Teruel',
    role: 'Lic. en Recursos Humanos',
    photo: `${WP_URL}/wp-content/uploads/2024/01/2.jpg`,
    bio: [
      'Generalista de RRHH',
      'Analista de Selección de personal',
      'Miembro de Comisión Directiva de ACILTRA Tucumán',
      'Co-coordinadora de Subcomisión de ACILTHRA Tucumán',
    ],
    social: {
      linkedin: 'https://www.linkedin.com/in/lic-priscila-vargas-teruel/',
      instagram: 'https://www.instagram.com/lic.priscilavargasteruel_rrhh/',
    },
    color: BRAND.celeste,
  },
  {
    name: 'Paola Santucho',
    role: 'Lic. en Trabajo Social',
    photo: `${WP_URL}/wp-content/uploads/2024/01/4.jpg`,
    bio: ['Coach Ontológico Profesional', 'Especializada en Programación Neurolingüística (PNL)', 'Risoterapia'],
    // Redes tomadas de su ficha en el Catálogo ("Coach Paola SANTUCHO")
    social: {
      instagram: 'https://www.instagram.com/paolasantucho.coach',
      facebook: 'https://www.facebook.com/share/1GF3u6dNVw/',
      tiktok: 'https://www.tiktok.com/@pao.santucho.coac',
    },
    color: BRAND.verde,
  },
]
