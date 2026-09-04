// Mina — API de investigación de Voz del Cliente.
//
// Cero dependencias a propósito: node 22 trae `http`, `https` y `crypto`, así
// que el contenedor no lleva node_modules, no hay nada que instalar en el
// servidor y el deploy es copiar un archivo.
//
// ⚠️ Lo importante de este archivo NO es la llamada al modelo, son las dos
// barandillas que van DESPUÉS de ella:
//
//   1. VERIFICACIÓN DE VERBATIMS. Un modelo de lenguaje parafrasea sin querer:
//      arregla una tilde, endereza una frase, y lo que devuelve ya no es lo
//      que escribió el cliente. Toda la técnica se apoya en la palabra exacta,
//      así que aquí no se le pide al modelo que sea literal y se confía: se
//      busca cada cita dentro de las reseñas de entrada y se devuelve EL TROZO
//      DE LA FUENTE, no el del modelo. Lo que no aparece, se descarta y se
//      cuenta.
//
//   2. CONTEO DE FRECUENCIAS. El modelo no da números: da los índices de las
//      reseñas donde vio cada cosa. Las menciones las cuenta este archivo
//      sobre índices validados. Así no hay forma de que se invente un «68 %
//      de los clientes».
//
// Sobre los códigos de error: un 5xx aquí no llega al navegador, Traefik lo
// sustituye por su propia página. Y además sería mentira — si falla
// OpenRouter o el texto pegado no da para un análisis, quien ha fallado no es
// esta API. Todo lo que el usuario debe leer sale como 4xx.

import http from 'node:http'
import https from 'node:https'
import { pathToFileURL } from 'node:url'

// Variable propia y no PORT a proposito: en la maquina de desarrollo habia un
// PORT=3100 suelto en el entorno y la API arrancaba ahi en silencio, con el
// proxy de vite apuntando al 3008 y sin ningun error que lo delatara.
const PUERTO = Number(process.env.MINA_PUERTO || 3008)
const CLAVE = process.env.OPENROUTER_API_KEY || ''
const MODELO = process.env.MINA_MODELO || 'anthropic/claude-sonnet-5'
const LIMITE_HORA = Number(process.env.MINA_LIMITE_HORA || 5)

const LIMITE_CUERPO = 400 * 1024 // 400 KB de reseñas pegadas es muchísimo
const MAX_CARACTERES = 60_000 // por textarea
const MIN_CARACTERES = 120 // menos que esto no es un corpus, es una frase
const TIEMPO_MODELO = 150_000
const MIN_VERBATIM = 12 // una cita más corta no prueba nada

// ──────────────────────────────  utilidades  ──────────────────────────────

function json(res, codigo, cuerpo) {
  const texto = JSON.stringify(cuerpo)
  res.writeHead(codigo, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
  })
  res.end(texto)
}

function ipCliente(req) {
  const reenviada = req.headers['x-forwarded-for']
  if (typeof reenviada === 'string' && reenviada.length > 0) {
    return reenviada.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'desconocida'
}

// ─────────────────────────────  límite por IP  ─────────────────────────────

const usos = new Map()

function dentroDelLimite(ip) {
  const ahora = Date.now()
  const hora = 60 * 60 * 1000
  const previos = (usos.get(ip) || []).filter((t) => ahora - t < hora)
  if (previos.length >= LIMITE_HORA) {
    const espera = Math.ceil((hora - (ahora - previos[0])) / 60000)
    return { ok: false, espera }
  }
  previos.push(ahora)
  usos.set(ip, previos)
  // Limpieza perezosa: sin esto el Map crece para siempre.
  if (usos.size > 5000) {
    for (const [k, v] of usos) {
      if (v.every((t) => ahora - t >= hora)) usos.delete(k)
    }
  }
  return { ok: true, restantes: LIMITE_HORA - previos.length }
}

// ────────────────────────  troceado de las reseñas  ────────────────────────

// Se pegan en crudo, tal como salen de Google Maps o Amazon: sin separador
// fijo, a veces con línea en blanco entre una y otra y a veces no. Se prueba
// primero por bloques y solo se cae a línea a línea si eso da un solo trozo.
function trocear(bruto) {
  const limpio = bruto.replace(/\r\n/g, '\n').trim()
  if (!limpio) return []

  let trozos = limpio
    .split(/\n\s*\n+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  if (trozos.length < 2) {
    trozos = limpio
      .split(/\n+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
  }

  // Une los restos muy cortos (una fecha suelta, «Hace 2 meses», «★★★★★»)
  // con la reseña siguiente en vez de contarlos como reseñas.
  const unidos = []
  let pendiente = ''
  for (const t of trozos) {
    if (t.length < 40) {
      pendiente = pendiente ? pendiente + '\n' + t : t
      continue
    }
    unidos.push(pendiente ? pendiente + '\n' + t : t)
    pendiente = ''
  }
  if (pendiente) {
    if (unidos.length > 0) unidos[unidos.length - 1] += '\n' + pendiente
    else unidos.push(pendiente)
  }
  return unidos
}

// ─────────────────  verificación literal de los verbatims  ─────────────────

// Devuelve el texto normalizado y un mapa posición→posición original, para
// poder recuperar el trozo EXACTO de la fuente una vez encontrado.
function normalizar(texto, quitarPuntuacion) {
  let salida = ''
  const mapa = []
  let espacioPendiente = false

  for (let i = 0; i < texto.length; i++) {
    let c = texto[i]

    // Comillas y guiones tipográficos: el modelo los cambia constantemente.
    if (c === '‘' || c === '’' || c === 'ʼ') c = "'"
    else if (c === '“' || c === '”') c = '"'
    else if (c === '–' || c === '—' || c === '−') c = '-'
    else if (c === ' ') c = ' '

    if (/\s/.test(c)) {
      espacioPendiente = salida.length > 0
      continue
    }
    if (quitarPuntuacion && /[.,;:!¡?¿"'()\[\]{}\-–—…*_/\\]/.test(c)) continue

    if (espacioPendiente) {
      salida += ' '
      mapa.push(i)
      espacioPendiente = false
    }
    salida += c.toLowerCase()
    mapa.push(i)
  }
  return { texto: salida, mapa }
}

// Busca la cita dentro del corpus y devuelve el trozo original. Dos pasadas:
// la estricta respeta la puntuación; la laxa la ignora, que es como se
// recuperan las citas a las que el modelo le quitó una coma. En las dos se
// devuelve lo que hay en la FUENTE, nunca lo que escribió el modelo.
function localizar(cita, fuente) {
  if (typeof cita !== 'string') return null
  const bruta = cita.trim().replace(/^["“”'']+|["“”'']+$/g, '')
  if (bruta.length < MIN_VERBATIM) return null

  for (const laxa of [false, true]) {
    const f = normalizar(fuente, laxa)
    const c = normalizar(bruta, laxa)
    if (c.texto.length < 8) continue
    const donde = f.texto.indexOf(c.texto)
    if (donde === -1) continue
    const desde = f.mapa[donde]
    const hasta = f.mapa[donde + c.texto.length - 1]
    if (desde === undefined || hasta === undefined) continue
    return fuente.slice(desde, hasta + 1).trim()
  }
  return null
}

// ─────────────────────────────  el prompt  ─────────────────────────────

const SISTEMA = `Eres analista de Voz del Cliente para campañas de Meta Ads y Google Ads.

Tu trabajo es "review mining": leer reseñas reales y extraer las PALABRAS EXACTAS
que usa el cliente, para devolvérselas en el anuncio. El mensaje no sale del
negocio: sale del cliente.

REGLAS QUE NO PUEDES ROMPER

1. LITERALIDAD. Cada cita del campo "texto" de un verbatim tiene que ser una
   copia carácter por carácter de un fragmento de las reseñas que te doy.
   Cópiala, no la reescribas. Mantén las faltas de ortografía, las mayúsculas
   raras, la puntuación y los emojis tal como están. Si dudas de si una frase
   está literalmente en el texto, NO la incluyas. Una cita inventada destruye
   el valor de todo el informe.

2. NADA DE NÚMEROS. No escribas porcentajes, ni "la mayoría", ni "el 70 %".
   Para cada tema y cada objeción das el array "indices" con los números de las
   reseñas donde aparece. Las cuentas las hace el sistema, tú no.

3. EVIDENCIA HONESTA. Si un hallazgo se apoya en una o dos reseñas, dilo en el
   campo correspondiente y no lo presentes como patrón. Prefiero "solo 2
   menciones, señal débil" a una afirmación sin base. Si el corpus entero es
   demasiado pequeño o demasiado pobre para sostener conclusiones, ponlo en
   "senal" y "notaSenal".

4. ANUNCIOS QUE SE PUEDEN PEGAR. Respeta los límites de Ads Manager:
   primary text 125 caracteres, headline 40, descripcion 30. Cuéntalos. Van en
   español, sin emojis decorativos, sin signos de exclamación de más y sin
   promesas que las reseñas no sostengan.

FORMATO DE SALIDA

Devuelves SOLO un objeto JSON válido, sin texto antes ni después, sin bloque de
código. Esta es la forma exacta:

{
  "resumen": "2 o 3 frases sobre qué vende de verdad este negocio, en lenguaje de cliente",
  "senal": "fuerte" | "media" | "debil",
  "notaSenal": "una frase justificando la señal segun cuantas reseñas hay y como de coincidentes son",
  "elogios": [
    { "tema": "nombre corto del tema", "que": "qué dicen exactamente, en una frase", "indices": [1, 4, 9] }
  ],
  "verbatims": [
    { "texto": "cita literal copiada de la reseña", "indice": 4, "uso": "titular" | "prueba", "tema": "tema al que pertenece" }
  ],
  "objeciones": [
    { "objecion": "la duda del prospecto, redactada como la pensaria el", "indices": [2, 7], "desactivar": "cómo desarmarla en el anuncio, concreto" }
  ],
  "angulos": [
    { "nombre": "nombre del ángulo", "deseo": "deseo o dolor que ataca", "publico": "a qué tipo de cliente le habla", "apoyo": "en qué elogio o verbatim se apoya" }
  ],
  "anuncios": [
    { "angulo": "nombre del ángulo correspondiente", "primary": "texto principal, max 125", "headline": "titular, max 40", "descripcion": "descripción, max 30" }
  ]
}

Entre 4 y 8 temas en "elogios", ordenados como quieras (el sistema los reordena
por frecuencia). En "elogios" va SOLO lo que el cliente celebra. Una queja no es
un elogio por mucho que se repita: el ruido, la espera o el precio alto van en
"objeciones", nunca en "elogios". Ese bloque se le enseña al cliente con el
título «Qué elogian». Entre 8 y 14 verbatims, con una mezcla de "titular" (frases con
gancho) y "prueba" (frases que sirven de prueba social). Entre 2 y 6 objeciones.
Entre 3 y 4 ángulos, DISTINTOS ENTRE SÍ: si dos atacan el mismo deseo, sobra uno.
Un anuncio por ángulo.`

const SISTEMA_COMPARATIVO = `

MODO COMPARATIVO

Te doy además las reseñas de un competidor, numeradas aparte con la letra C.
Añade al JSON una clave más:

  "posicionamiento": {
    "tuFuerte": [ { "punto": "qué te elogian a ti que a él no", "porQue": "una frase" } ],
    "suFuerte": [ { "punto": "dónde es él más fuerte", "porQue": "una frase" } ],
    "hueco":    [ { "punto": "hueco que puedes ocupar en tu mensaje", "porQue": "cómo aprovecharlo" } ]
  }

Si solo hay reseñas del competidor y ninguna propia, dilo en "tuFuerte" con un
único elemento explicando que no hay corpus propio, y concéntrate en "suFuerte"
y en "hueco": qué promete él, dónde falla, y qué puede prometer alguien que
entre a competir.`

function construirMensaje(negocio, propias, competidor) {
  const partes = []
  if (negocio) partes.push(`NEGOCIO O PRODUCTO ANALIZADO: ${negocio}`)
  else partes.push('NEGOCIO O PRODUCTO ANALIZADO: no especificado, dedúcelo de las reseñas.')

  if (propias.length > 0) {
    partes.push('\nRESEÑAS PROPIAS:\n')
    partes.push(propias.map((t, i) => `[${i + 1}] ${t}`).join('\n\n'))
  } else {
    partes.push('\nRESEÑAS PROPIAS: ninguna. El negocio todavía no tiene reseñas.')
  }

  if (competidor.length > 0) {
    partes.push('\nRESEÑAS DEL COMPETIDOR:\n')
    partes.push(competidor.map((t, i) => `[C${i + 1}] ${t}`).join('\n\n'))
  }
  return partes.join('\n')
}

// ───────────────────────────  llamada al modelo  ───────────────────────────

function pedirAlModelo(mensajes) {
  return new Promise((resolve, reject) => {
    const cuerpo = JSON.stringify({
      model: MODELO,
      // ⚠️ max_tokens incluye los tokens de razonamiento, y eso costó un rato
      // de diagnóstico: con 8000 y el razonamiento puesto, el modelo se gastó
      // los 8000 pensando y devolvió CERO caracteres de contenido. La respuesta
      // llegaba vacía o el JSON cortado a la mitad, y el error que salía era
      // «formato ilegible», que apuntaba al sitio equivocado.
      //
      // Aquí el razonamiento no aporta: la fidelidad no la garantiza el modelo,
      // la garantiza la verificación de arriba. Apagarlo dejó la respuesta en
      // 3.752 tokens, la mitad de coste y sin truncar.
      max_tokens: 16000,
      reasoning: { enabled: false },
      temperature: 0.4,
      messages: mensajes,
    })

    const req = https.request(
      {
        method: 'POST',
        host: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        headers: {
          authorization: `Bearer ${CLAVE}`,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(cuerpo),
          'http-referer': 'https://app08.reto.icebergmarketingdigital.com',
          'x-title': 'Mina',
        },
        timeout: TIEMPO_MODELO,
      },
      (res) => {
        const trozos = []
        let total = 0
        res.on('data', (d) => {
          total += d.length
          if (total > 4 * 1024 * 1024) {
            req.destroy()
            return reject(new Error('respuesta desmesurada'))
          }
          trozos.push(d)
        })
        res.on('end', () => {
          const texto = Buffer.concat(trozos).toString('utf8')
          if (res.statusCode !== 200) {
            return reject(new Error(`openrouter ${res.statusCode}: ${texto.slice(0, 400)}`))
          }
          try {
            const datos = JSON.parse(texto)
            const eleccion = datos?.choices?.[0]
            const salida = eleccion?.message?.content
            // Distinguir «se quedó sin espacio» de «devolvió basura» importa:
            // el primero se arregla subiendo el límite y el segundo no, y el
            // error genérico mandaba a mirar el sitio equivocado.
            if (eleccion?.finish_reason === 'length') {
              return reject(
                new Error(
                  `respuesta truncada por limite de tokens (razonamiento=${
                    datos?.usage?.completion_tokens_details?.reasoning_tokens ?? '?'
                  }, contenido=${(salida || '').length} caracteres)`,
                ),
              )
            }
            if (typeof salida !== 'string' || !salida.trim()) {
              return reject(new Error('el modelo no devolvió contenido'))
            }
            resolve(salida)
          } catch (e) {
            reject(new Error('respuesta ilegible de openrouter: ' + e.message))
          }
        })
      },
    )

    req.on('timeout', () => {
      req.destroy(new Error('el modelo tardó demasiado'))
    })
    req.on('error', reject)
    req.end(cuerpo)
  })
}

// El modelo a veces envuelve el JSON en ```json pese a lo que se le pide.
function extraerJson(bruto) {
  const sinCerca = bruto.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '')
  const desde = sinCerca.indexOf('{')
  const hasta = sinCerca.lastIndexOf('}')
  if (desde === -1 || hasta <= desde) throw new Error('no hay JSON en la respuesta')
  return JSON.parse(sinCerca.slice(desde, hasta + 1))
}

// ──────────────────────  saneado del informe devuelto  ──────────────────────

const texto = (v, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function indicesValidos(lista, cuantas) {
  if (!Array.isArray(lista)) return []
  const vistos = new Set()
  for (const n of lista) {
    const i = Number(n)
    if (Number.isInteger(i) && i >= 1 && i <= cuantas) vistos.add(i)
  }
  return [...vistos].sort((a, b) => a - b)
}

function sanear(crudo, propias, competidor, negocio) {
  const corpus = [...propias, ...competidor].join('\n\n')
  let descartados = 0

  const elogios = (Array.isArray(crudo.elogios) ? crudo.elogios : [])
    .map((e) => {
      const indices = indicesValidos(e?.indices, propias.length)
      return { tema: texto(e?.tema, 80), que: texto(e?.que, 300), indices, menciones: indices.length }
    })
    .filter((e) => e.tema)
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 10)

  const verbatims = []
  for (const v of Array.isArray(crudo.verbatims) ? crudo.verbatims : []) {
    const literal = localizar(v?.texto, corpus)
    if (!literal) {
      descartados++
      continue
    }
    if (verbatims.some((y) => y.texto === literal)) continue
    verbatims.push({
      texto: literal,
      uso: v?.uso === 'titular' ? 'titular' : 'prueba',
      tema: texto(v?.tema, 80),
    })
    if (verbatims.length >= 16) break
  }

  const objeciones = (Array.isArray(crudo.objeciones) ? crudo.objeciones : [])
    .map((o) => {
      const indices = indicesValidos(o?.indices, propias.length)
      return {
        objecion: texto(o?.objecion, 300),
        desactivar: texto(o?.desactivar, 500),
        indices,
        menciones: indices.length,
      }
    })
    .filter((o) => o.objecion)
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 8)

  const angulos = (Array.isArray(crudo.angulos) ? crudo.angulos : [])
    .map((a) => ({
      nombre: texto(a?.nombre, 80),
      deseo: texto(a?.deseo, 300),
      publico: texto(a?.publico, 200),
      apoyo: texto(a?.apoyo, 300),
    }))
    .filter((a) => a.nombre)
    .slice(0, 5)

  const anuncios = (Array.isArray(crudo.anuncios) ? crudo.anuncios : [])
    .map((a) => ({
      angulo: texto(a?.angulo, 80),
      primary: texto(a?.primary, 400),
      headline: texto(a?.headline, 120),
      descripcion: texto(a?.descripcion, 120),
    }))
    .filter((a) => a.primary || a.headline)
    .slice(0, 5)

  let posicionamiento = null
  if (competidor.length > 0 && crudo.posicionamiento && typeof crudo.posicionamiento === 'object') {
    const lista = (x) =>
      (Array.isArray(x) ? x : [])
        .map((p) => ({ punto: texto(p?.punto, 200), porQue: texto(p?.porQue, 300) }))
        .filter((p) => p.punto)
        .slice(0, 6)
    posicionamiento = {
      tuFuerte: lista(crudo.posicionamiento.tuFuerte),
      suFuerte: lista(crudo.posicionamiento.suFuerte),
      hueco: lista(crudo.posicionamiento.hueco),
    }
  }

  const senal = ['fuerte', 'media', 'debil'].includes(crudo.senal) ? crudo.senal : 'media'

  return {
    negocio: texto(negocio, 120) || 'Negocio sin nombre',
    generado: new Date().toISOString(),
    resenas: propias.length,
    resenasCompetidor: competidor.length,
    resumen: texto(crudo.resumen, 800),
    senal,
    notaSenal: texto(crudo.notaSenal, 300),
    elogios,
    verbatims,
    objeciones,
    angulos,
    anuncios,
    posicionamiento,
    descartados,
  }
}

// ───────────────────────────────  rutas  ───────────────────────────────

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    const trozos = []
    let total = 0
    req.on('data', (d) => {
      total += d.length
      if (total > LIMITE_CUERPO) {
        req.destroy()
        return reject(new Error('cuerpo demasiado grande'))
      }
      trozos.push(d)
    })
    req.on('end', () => resolve(Buffer.concat(trozos).toString('utf8')))
    req.on('error', reject)
  })
}

async function analizar(req, res) {
  // El servicio sin clave no es culpa de quien lo usa, pero un 5xx no llegaría
  // al navegador: Traefik lo cambia por su página. Sale como 4xx para que el
  // mensaje se lea (§13.13 del protocolo).
  if (!CLAVE) {
    return json(res, 422, {
      error: 'El servicio de análisis no está configurado. Falta la clave del proveedor.',
      codigo: 'sin_clave',
    })
  }

  const ip = ipCliente(req)
  const limite = dentroDelLimite(ip)
  if (!limite.ok) {
    return json(res, 429, {
      error: `Has llegado al límite de ${LIMITE_HORA} análisis por hora. Vuelve a intentarlo en ${limite.espera} min.`,
      codigo: 'limite',
    })
  }

  let datos
  try {
    datos = JSON.parse(await leerCuerpo(req))
  } catch {
    return json(res, 400, { error: 'No pude leer la petición.', codigo: 'peticion_ilegible' })
  }

  const negocio = typeof datos?.negocio === 'string' ? datos.negocio.trim().slice(0, 120) : ''
  const brutoPropias = typeof datos?.resenas === 'string' ? datos.resenas.slice(0, MAX_CARACTERES) : ''
  const brutoCompetidor =
    typeof datos?.competidor === 'string' ? datos.competidor.slice(0, MAX_CARACTERES) : ''

  const propias = trocear(brutoPropias)
  const competidor = trocear(brutoCompetidor)

  const totalTexto = brutoPropias.trim().length + brutoCompetidor.trim().length
  if (totalTexto < MIN_CARACTERES) {
    return json(res, 400, {
      error: 'Pega unas cuantas reseñas más. Con este texto no hay material que analizar.',
      codigo: 'poco_texto',
    })
  }
  if (propias.length === 0 && competidor.length === 0) {
    return json(res, 400, { error: 'No encontré ninguna reseña en el texto.', codigo: 'sin_resenas' })
  }

  const sistema = SISTEMA + (competidor.length > 0 ? SISTEMA_COMPARATIVO : '')
  const usuario = construirMensaje(negocio, propias, competidor)

  let bruto
  try {
    bruto = await pedirAlModelo([
      { role: 'system', content: sistema },
      { role: 'user', content: usuario },
    ])
  } catch (e) {
    console.error('[mina] fallo del proveedor:', e.message)
    return json(res, 422, {
      error: 'El servicio de análisis no respondió a tiempo. Inténtalo de nuevo en un minuto.',
      codigo: 'proveedor',
    })
  }

  let crudo
  try {
    crudo = extraerJson(bruto)
  } catch (e) {
    console.error('[mina] JSON ilegible:', e.message, bruto.slice(0, 300))
    return json(res, 422, {
      error: 'El análisis volvió en un formato que no pude leer. Vuelve a intentarlo.',
      codigo: 'formato',
    })
  }

  const informe = sanear(crudo, propias, competidor, negocio)

  if (informe.elogios.length === 0 && informe.verbatims.length === 0) {
    return json(res, 422, {
      error: 'No pude sacar nada sólido de estas reseñas. Prueba con más texto o con reseñas más largas.',
      codigo: 'sin_hallazgos',
    })
  }

  console.log(
    `[mina] ${ip} · ${propias.length}+${competidor.length} reseñas · ` +
      `${informe.verbatims.length} verbatims · ${informe.descartados} descartados`,
  )
  return json(res, 200, { informe, restantes: limite.restantes })
}

// ───────────────────────────────  servidor  ───────────────────────────────

const servidor = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    })
    return res.end()
  }

  const ruta = (req.url || '').split('?')[0]

  if (req.method === 'GET' && ruta === '/api/salud') {
    return json(res, 200, { ok: true, modelo: MODELO, clave: CLAVE ? 'puesta' : 'ausente' })
  }

  if (req.method === 'POST' && ruta === '/api/analizar') {
    try {
      return await analizar(req, res)
    } catch (e) {
      console.error('[mina] error inesperado:', e)
      return json(res, 422, {
        error: 'Algo se torció durante el análisis. Vuelve a intentarlo.',
        codigo: 'inesperado',
      })
    }
  }

  return json(res, 404, { error: 'Ruta desconocida.' })
})

// Solo escucha cuando se ejecuta directo. Importado desde una prueba no
// levanta nada, que si no cada test dejaria un puerto ocupado.
const esPrincipal =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (esPrincipal) {
  servidor.listen(PUERTO, () => {
    console.log(
      `[mina] API escuchando en :${PUERTO} · modelo ${MODELO} · clave ${CLAVE ? 'ok' : 'AUSENTE'}`,
    )
  })
}

// Se exportan para que las pruebas de herramientas/ usen EXACTAMENTE la misma
// funcion que corre en produccion, y no una copia que se desincroniza.
export { localizar, trocear, normalizar, sanear, construirMensaje, SISTEMA, SISTEMA_COMPARATIVO }
