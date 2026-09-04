// Prueba de aceptación de Mina: ¿son literales los verbatims que devuelve?
//
// Uso:
//   node herramientas/probar-verbatims.mjs <url-api> <resenas.txt> [competidor.txt] [negocio]
//
// ⚠️ Esta prueba comprueba la literalidad con `corpus.includes(cita)` a secas,
// A PROPÓSITO, en vez de reutilizar localizar() del servidor. Si importara la
// función del servidor, un fallo en esa función haría pasar la prueba y fallar
// la app: el test compartiría el error que busca. La API promete devolver un
// trozo exacto del texto de entrada, así que la comprobación más tonta posible
// es también la única que no puede mentir.

import { readFileSync, writeFileSync } from 'node:fs'

const [url, archivoPropias, archivoCompetidor, negocio] = process.argv.slice(2)
if (!url || !archivoPropias) {
  console.error('Uso: node probar-verbatims.mjs <url-api> <resenas.txt> [competidor.txt] [negocio]')
  process.exit(2)
}

const resenas = readFileSync(archivoPropias, 'utf8')
const competidor = archivoCompetidor ? readFileSync(archivoCompetidor, 'utf8') : ''
const corpus = resenas + '\n\n' + competidor

console.log(`> POST ${url}`)
console.log(`  ${resenas.length} caracteres propios · ${competidor.length} del competidor`)

const arranque = Date.now()
const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ negocio: negocio || '', resenas, competidor }),
})
const segundos = ((Date.now() - arranque) / 1000).toFixed(1)

const cuerpo = await res.text()
if (!res.ok) {
  console.error(`\nFALLO HTTP ${res.status} en ${segundos}s:\n${cuerpo.slice(0, 600)}`)
  process.exit(1)
}

const { informe } = JSON.parse(cuerpo)
writeFileSync('informe-prueba.json', JSON.stringify(informe, null, 2))
console.log(`  respondió en ${segundos}s · informe guardado en informe-prueba.json\n`)

let fallos = 0

// ── 1. Literalidad de cada verbatim ──
console.log(`VERBATIMS (${informe.verbatims.length}, ${informe.descartados} descartados por la API)`)
for (const v of informe.verbatims) {
  if (corpus.includes(v.texto)) {
    console.log(`  ok   «${v.texto.slice(0, 72)}${v.texto.length > 72 ? '…' : ''}»`)
  } else {
    console.log(`  NO   «${v.texto}»  <-- NO ESTA EN EL TEXTO DE ENTRADA`)
    fallos++
  }
}

// ── 2. Coherencia de los conteos ──
const nPropias = informe.resenas
console.log(`\nCONTEOS (sobre ${nPropias} reseñas propias)`)
for (const grupo of [
  { nombre: 'elogios', lista: informe.elogios, campo: 'tema' },
  { nombre: 'objeciones', lista: informe.objeciones, campo: 'objecion' },
]) {
  for (const e of grupo.lista) {
    const etiqueta = String(e[grupo.campo]).slice(0, 44)
    if (e.menciones !== e.indices.length) {
      console.log(`  NO   ${etiqueta}: menciones=${e.menciones} pero indices=${e.indices.length}`)
      fallos++
    } else if (e.indices.some((i) => i < 1 || i > nPropias)) {
      console.log(`  NO   ${etiqueta}: indice fuera de rango ${JSON.stringify(e.indices)}`)
      fallos++
    } else {
      console.log(`  ok   ${etiqueta}: ${e.menciones} = ${JSON.stringify(e.indices)}`)
    }
  }
}

// ── 3. Ningún porcentaje inventado en la prosa ──
const prosa = JSON.stringify(informe)
const porcentajes = prosa.match(/\d+\s?%|\bel \d+ por ciento\b/gi) || []
console.log(`\nPORCENTAJES INVENTADOS: ${porcentajes.length === 0 ? 'ninguno' : porcentajes.join(', ')}`)
if (porcentajes.length > 0) fallos++

// ── 4. Límites de Ads Manager ──
const LIMITES = { primary: 125, headline: 40, descripcion: 30 }
console.log('\nANUNCIOS')
for (const a of informe.anuncios) {
  const partes = Object.entries(LIMITES).map(([c, lim]) => {
    const n = (a[c] || '').length
    if (n > lim) fallos++
    return `${c} ${n}/${lim}${n > lim ? ' EXCEDE' : ''}`
  })
  console.log(`  ${a.angulo}: ${partes.join(' · ')}`)
}

// ── 5. Posicionamiento presente si hubo competidor ──
if (competidor.trim()) {
  const p = informe.posicionamiento
  const ok = p && (p.tuFuerte.length || p.suFuerte.length) && p.hueco.length
  console.log(`\nPOSICIONAMIENTO: ${ok ? 'presente' : 'AUSENTE con competidor pegado'}`)
  if (!ok) fallos++
}

console.log(`\n${'='.repeat(60)}`)
console.log(fallos === 0 ? 'PASA: todo literal y coherente.' : `FALLA: ${fallos} problemas.`)
process.exit(fallos === 0 ? 0 : 1)
