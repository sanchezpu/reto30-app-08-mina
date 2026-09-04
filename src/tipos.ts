export type Senal = 'fuerte' | 'media' | 'debil'

export type Elogio = {
  tema: string
  que: string
  indices: number[]
  menciones: number
}

export type Verbatim = {
  texto: string
  uso: 'titular' | 'prueba'
  tema: string
}

export type Objecion = {
  objecion: string
  desactivar: string
  indices: number[]
  menciones: number
}

export type Angulo = {
  nombre: string
  deseo: string
  publico: string
  apoyo: string
}

export type Anuncio = {
  angulo: string
  primary: string
  headline: string
  descripcion: string
}

export type Punto = { punto: string; porQue: string }

export type Posicionamiento = {
  tuFuerte: Punto[]
  suFuerte: Punto[]
  hueco: Punto[]
}

export type Informe = {
  negocio: string
  generado: string
  resenas: number
  resenasCompetidor: number
  resumen: string
  senal: Senal
  notaSenal: string
  elogios: Elogio[]
  verbatims: Verbatim[]
  objeciones: Objecion[]
  angulos: Angulo[]
  anuncios: Anuncio[]
  posicionamiento: Posicionamiento | null
  descartados: number
}

// Límites de Ads Manager. No son un capricho de diseño: pasarse de aquí hace
// que Meta recorte el texto con puntos suspensivos en la mitad de los sitios.
export const LIMITES = { primary: 125, headline: 40, descripcion: 30 } as const
