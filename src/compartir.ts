import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { Informe } from './tipos'

// El informe viaja entero dentro del enlace. Sin base de datos no hay nada que
// consultar después: el enlace ES el informe. A cambio hay un techo real de
// longitud de URL, así que se comprueba antes de prometer un enlace que luego
// se rompería al pegarlo.
const MAX_URL = 30_000

export function informeAEnlace(informe: Informe): string | null {
  const comprimido = compressToEncodedURIComponent(JSON.stringify(informe))
  const url = `${location.origin}${location.pathname}#i=${comprimido}`
  return url.length > MAX_URL ? null : url
}

export function enlaceAInforme(hash: string): Informe | null {
  const limpio = hash.replace(/^#/, '')
  if (!limpio.startsWith('i=')) return null
  try {
    const json = decompressFromEncodedURIComponent(limpio.slice(2))
    if (!json) return null
    const datos = JSON.parse(json)
    // Comprobación mínima: un hash manipulado no debe reventar la app entera.
    if (!datos || typeof datos !== 'object' || !Array.isArray(datos.verbatims)) return null
    return datos as Informe
  } catch {
    return null
  }
}
