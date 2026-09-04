// Prueba de las dos barandillas del servidor, SIN llamar al modelo.
//
// Le damos a sanear() una respuesta falsa con exactamente los fallos que un
// modelo comete de verdad —una cita retocada, una inventada, un índice fuera de
// rango, un conteo mentido— y comprobamos qué sale al otro lado.
//
// Vale la pena que esto no gaste API: es la promesa central del producto y
// tiene que poder comprobarse las veces que haga falta.

import { sanear, trocear } from '../server/server.js'

const RESENAS = `El desayuno estaba delicioso y el personal, atentísimo desde que llegamos. Repetiríamos sin dudarlo.

La habitación era pequeñísima, casi no cabía la maleta abierta en el suelo. Por lo demás, limpia.

El wifi iba fatal en la habitación 302, tuve que bajar al lobby para una videollamada.

Ubicación inmejorable: a dos cuadras de todo. El personal nos guardó las maletas sin cobrarnos nada.

Volvería solo por el desayuno. La fruta fresca cada mañana marca la diferencia.`

const propias = trocear(RESENAS)

// Lo que devolvería un modelo con sus vicios habituales.
const RESPUESTA_FALSA = {
  resumen: 'Resumen cualquiera.',
  senal: 'media',
  notaSenal: 'Cinco reseñas.',
  elogios: [
    { tema: 'Desayuno', que: 'Lo repiten.', indices: [1, 5] },
    // Índice 99 no existe: tiene que caer, y menciones bajar a 2.
    { tema: 'Personal atento', que: 'Van más allá.', indices: [1, 4, 99] },
    // Índices duplicados: no pueden inflar el conteo.
    { tema: 'Ubicación', que: 'Céntrico.', indices: [4, 4, 4] },
  ],
  verbatims: [
    // 1. Literal exacta -> se queda tal cual.
    { texto: 'La fruta fresca cada mañana marca la diferencia', indice: 5, uso: 'titular' },
    // 2. Retocada: el modelo le quitó la coma de «personal, atentísimo».
    //    Tiene que recuperarse CON la coma, que es como está en la fuente.
    { texto: 'el personal atentísimo desde que llegamos', indice: 1, uso: 'prueba' },
    // 3. Inventada de cero: no está en ninguna reseña. Debe descartarse.
    { texto: 'la mejor experiencia hotelera de mi vida', indice: 2, uso: 'titular' },
    // 4. Real pero con mayúsculas cambiadas -> se recupera la grafía original.
    { texto: 'UBICACIÓN INMEJORABLE', indice: 4, uso: 'titular' },
    // 5. Demasiado corta para probar nada.
    { texto: 'limpia', indice: 2, uso: 'prueba' },
  ],
  objeciones: [
    { objecion: '¿Serán muy pequeñas las habitaciones?', indices: [2], desactivar: 'Enséñalas.' },
  ],
  angulos: [{ nombre: 'Desayuno', deseo: 'Comer bien', publico: 'Turista', apoyo: 'Reseñas 1 y 5' }],
  anuncios: [{ angulo: 'Desayuno', primary: 'Texto.', headline: 'Titular', descripcion: 'Desc' }],
}

const informe = sanear(RESPUESTA_FALSA, propias, [], 'Hotel de prueba')

let fallos = 0
const comprobar = (nombre, condicion, detalle) => {
  console.log(`  ${condicion ? 'ok  ' : 'FALLA'} ${nombre}${condicion ? '' : ` -> ${detalle}`}`)
  if (!condicion) fallos++
}

console.log(`\nTroceado: ${propias.length} reseñas detectadas`)
comprobar('detecta las 5 reseñas', propias.length === 5, propias.length)

console.log('\nBARANDILLA 1 — literalidad de los verbatims')
const textos = informe.verbatims.map((v) => v.texto)
comprobar(
  'mantiene la cita exacta',
  textos.includes('La fruta fresca cada mañana marca la diferencia'),
  textos,
)
comprobar(
  'recupera la coma que el modelo quitó',
  textos.includes('el personal, atentísimo desde que llegamos'),
  textos,
)
comprobar(
  'descarta la cita inventada',
  !textos.some((t) => t.toLowerCase().includes('mejor experiencia hotelera')),
  textos,
)
comprobar(
  'devuelve la grafía original, no la del modelo',
  textos.includes('Ubicación inmejorable'),
  textos,
)
comprobar('ignora la cita demasiado corta', !textos.includes('limpia'), textos)
comprobar('cuenta 2 descartadas', informe.descartados === 2, informe.descartados)
comprobar(
  'TODA cita devuelta está literalmente en las reseñas',
  textos.every((t) => RESENAS.includes(t)),
  textos.filter((t) => !RESENAS.includes(t)),
)

console.log('\nBARANDILLA 2 — conteo de frecuencias')
const porTema = Object.fromEntries(informe.elogios.map((e) => [e.tema, e.menciones]))
comprobar('descarta el índice 99', porTema['Personal atento'] === 2, porTema['Personal atento'])
comprobar('los índices repetidos no inflan', porTema['Ubicación'] === 1, porTema['Ubicación'])
comprobar('menciones == indices.length', informe.elogios.every((e) => e.menciones === e.indices.length))
comprobar(
  'ordena por menciones descendente',
  informe.elogios.every((e, n, a) => n === 0 || a[n - 1].menciones >= e.menciones),
  informe.elogios.map((e) => `${e.tema}:${e.menciones}`),
)

console.log('\nOTROS')
comprobar('sin posicionamiento si no hay competidor', informe.posicionamiento === null)

console.log(`\n${'='.repeat(56)}`)
console.log(fallos === 0 ? 'PASA: las barandillas aguantan.' : `FALLA: ${fallos} comprobaciones.`)
process.exit(fallos === 0 ? 0 : 1)
