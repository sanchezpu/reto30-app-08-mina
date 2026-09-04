// Comprueba que el informe de ejemplo cumple la regla que la app promete:
// cada verbatim tiene que estar LITERALMENTE en las reseñas de ejemplo.
//
// Un ejemplo que se saltara su propia regla desmentiría la herramienta entera,
// y es justo el tipo de fallo que nadie mira porque «es solo la demo».
//
// Usa la misma función que corre en producción, importada del servidor: una
// copia se desincronizaría y la prueba pasaría a mentir.

import { readFileSync } from 'node:fs'
import { localizar } from '../server/server.js'

const fuente = readFileSync(new URL('../src/demo.ts', import.meta.url), 'utf8')

// demo.ts es TypeScript: en vez de compilarlo, se sacan los literales que
// interesan. Frágil si cambian los nombres, pero la prueba grita si pasa.
function bloque(nombre) {
  const re = new RegExp('export const ' + nombre + ' = `([\\s\\S]*?)`', 'm')
  const m = fuente.match(re)
  if (!m) throw new Error('no encontré ' + nombre + ' en demo.ts')
  return m[1]
}

const corpus = bloque('RESENAS_DEMO') + '\n\n' + bloque('RESENAS_COMPETIDOR_DEMO')

// Los verbatims del informe: { texto: '...', uso: '...' }
const citas = [...fuente.matchAll(/\{\s*texto:\s*\n?\s*'((?:[^'\\]|\\.)*)'/g)].map((m) =>
  m[1].replace(/\\'/g, "'"),
)

if (citas.length === 0) {
  console.error('FALLO: no encontré ningún verbatim en demo.ts. ¿Cambió el formato?')
  process.exit(1)
}

let fallos = 0
for (const cita of citas) {
  const encontrada = localizar(cita, corpus)
  if (!encontrada) {
    console.error(`  INVENTADA  «${cita}»`)
    fallos++
  } else if (encontrada !== cita) {
    // No es un fallo: es exactamente lo que hace el servidor, recuperar el
    // trozo real. Pero en la demo, escrita a mano, conviene que coincidan.
    console.error(`  DESVIADA   «${cita}»\n             fuente: «${encontrada}»`)
    fallos++
  }
}

console.log(`\n${citas.length} verbatims comprobados · ${fallos} problemas`)

// Comprobación de los límites de Ads Manager sobre los anuncios del ejemplo.
const LIMITES = { primary: 125, headline: 40, descripcion: 30 }
let excesos = 0
for (const [campo, limite] of Object.entries(LIMITES)) {
  const re = new RegExp(campo + ":\\s*\\n?\\s*'((?:[^'\\\\]|\\\\.)*)'", 'g')
  for (const m of fuente.matchAll(re)) {
    const valor = m[1].replace(/\\'/g, "'")
    if (valor.length > limite) {
      console.error(`  EXCEDE ${campo} (${valor.length}/${limite}): «${valor}»`)
      excesos++
    }
  }
}
console.log(`Límites de Ads Manager: ${excesos} campos pasados de largo`)

process.exit(fallos + excesos === 0 ? 0 : 1)
