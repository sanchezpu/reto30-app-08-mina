import type { Informe } from './tipos'

export type Peticion = {
  negocio: string
  resenas: string
  competidor: string
}

export class ErrorMina extends Error {
  codigo: string
  constructor(mensaje: string, codigo: string) {
    super(mensaje)
    this.codigo = codigo
  }
}

export async function analizar(peticion: Peticion): Promise<{ informe: Informe; restantes: number }> {
  let respuesta: Response
  try {
    respuesta = await fetch('/api/analizar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(peticion),
    })
  } catch {
    throw new ErrorMina('No hay conexión con el servicio de análisis.', 'red')
  }

  let datos: any = null
  try {
    datos = await respuesta.json()
  } catch {
    // Sin cuerpo legible no hay nada que contar: casi siempre es la página de
    // error del proxy colándose por delante de la API.
    throw new ErrorMina('El servicio de análisis no está respondiendo.', 'sin_cuerpo')
  }

  if (!respuesta.ok) {
    throw new ErrorMina(
      typeof datos?.error === 'string' ? datos.error : 'No pude completar el análisis.',
      typeof datos?.codigo === 'string' ? datos.codigo : 'desconocido',
    )
  }

  return { informe: datos.informe as Informe, restantes: Number(datos.restantes ?? 0) }
}
