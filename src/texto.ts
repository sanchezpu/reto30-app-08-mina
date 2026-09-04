import type { Informe } from './tipos'

// Serialización a texto plano para los botones de copiar. Va en Markdown ligero
// porque el destino real es un documento de cliente o un mensaje de Slack, no
// una terminal.

const raya = (t: string) => `\n## ${t}\n`

export function elogiosATexto(i: Informe): string {
  return (
    raya('Qué elogian') +
    i.elogios
      .map((e) => `- ${e.tema} — ${e.menciones} ${e.menciones === 1 ? 'mención' : 'menciones'}\n  ${e.que}`)
      .join('\n')
  )
}

export function verbatimsATexto(i: Informe): string {
  const bloque = (uso: 'titular' | 'prueba', etiqueta: string) => {
    const lista = i.verbatims.filter((v) => v.uso === uso)
    if (lista.length === 0) return ''
    return `\n### ${etiqueta}\n` + lista.map((v) => `- «${v.texto}»`).join('\n') + '\n'
  }
  return (
    raya('Verbatims usables') +
    bloque('titular', 'Para titular') +
    bloque('prueba', 'Para prueba social')
  )
}

export function objecionesATexto(i: Informe): string {
  return (
    raya('Mapa de objeciones') +
    i.objeciones
      .map(
        (o) =>
          `- ${o.objecion} (${o.menciones} ${o.menciones === 1 ? 'mención' : 'menciones'})\n  Cómo desactivarla: ${o.desactivar}`,
      )
      .join('\n')
  )
}

export function angulosATexto(i: Informe): string {
  return (
    raya('Ángulos de campaña') +
    i.angulos
      .map(
        (a, n) =>
          `${n + 1}. ${a.nombre}\n   Deseo o dolor: ${a.deseo}\n   Le habla a: ${a.publico}\n   Se apoya en: ${a.apoyo}`,
      )
      .join('\n\n')
  )
}

export function anunciosATexto(i: Informe): string {
  return (
    raya('Anuncios para Meta Ads') +
    i.anuncios
      .map(
        (a) =>
          `### ${a.angulo}\nTexto principal (${a.primary.length}): ${a.primary}\nTitular (${a.headline.length}): ${a.headline}\nDescripción (${a.descripcion.length}): ${a.descripcion}`,
      )
      .join('\n\n')
  )
}

export function posicionamientoATexto(i: Informe): string {
  const p = i.posicionamiento
  if (!p) return ''
  const lista = (t: string, xs: { punto: string; porQue: string }[]) =>
    xs.length === 0 ? '' : `\n### ${t}\n` + xs.map((x) => `- ${x.punto}\n  ${x.porQue}`).join('\n') + '\n'
  return (
    raya('Posicionamiento frente al competidor') +
    lista('Te elogian a ti lo que a él no', p.tuFuerte) +
    lista('Dónde es él más fuerte', p.suFuerte) +
    lista('Hueco que puedes ocupar', p.hueco)
  )
}

export function informeATexto(i: Informe): string {
  const fecha = new Date(i.generado).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const senal = { fuerte: 'señal fuerte', media: 'señal media', debil: 'señal débil' }[i.senal]

  const cabecera =
    `# Voz del Cliente — ${i.negocio}\n\n` +
    `${fecha} · ${i.resenas} reseñas analizadas` +
    (i.resenasCompetidor > 0 ? ` · ${i.resenasCompetidor} del competidor` : '') +
    ` · ${senal}\n\n${i.resumen}\n\n${i.notaSenal}\n`

  return [
    cabecera,
    elogiosATexto(i),
    verbatimsATexto(i),
    objecionesATexto(i),
    angulosATexto(i),
    anunciosATexto(i),
    posicionamientoATexto(i),
  ]
    .filter(Boolean)
    .join('\n')
    .trim()
}
