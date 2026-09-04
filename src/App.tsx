import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ChevronDown, FileText, Pickaxe, Swords } from 'lucide-react'
import { analizar, ErrorMina } from './api'
import { enlaceAInforme, informeAEnlace } from './compartir'
import {
  COMPETIDOR_DEMO,
  INFORME_DEMO,
  NEGOCIO_DEMO,
  RESENAS_COMPETIDOR_DEMO,
  RESENAS_DEMO,
} from './demo'
import Informe from './Informe'
import type { Informe as TInforme } from './tipos'

// Espejo de trocear() del servidor. Solo alimenta el contador que se ve
// mientras escribes; la cuenta que manda es la que devuelve la API.
function contarResenas(bruto: string): number {
  const limpio = bruto.replace(/\r\n/g, '\n').trim()
  if (!limpio) return 0
  let trozos = limpio.split(/\n\s*\n+/).map((t) => t.trim()).filter(Boolean)
  if (trozos.length < 2) trozos = limpio.split(/\n+/).map((t) => t.trim()).filter(Boolean)
  return trozos.filter((t) => t.length >= 40).length || (limpio.length > 0 ? 1 : 0)
}

const PASOS = [
  'Leyendo las reseñas una por una',
  'Agrupando los elogios por tema',
  'Buscando las frases textuales',
  'Convirtiendo las críticas en objeciones',
  'Escribiendo los ángulos y los anuncios',
]

function Cargando({ negocio }: { negocio: string }) {
  const [segundos, setSegundos] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const paso = Math.min(PASOS.length - 1, Math.floor(segundos / 9))

  return (
    // Altura mínima en la vista corta, no en el elemento raíz: tocar #root
    // llega a todas las pantallas, incluidas las que ya estaban bien (§13.15).
    <div className="mx-auto flex min-h-[calc(100vh-13rem)] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <Pickaxe size={34} className="animate-pulse text-vetaClara" aria-hidden="true" />
      <h2 className="mt-5 font-titulo text-2xl font-semibold text-hueso">
        Excavando {negocio ? `en ${negocio}` : 'las reseñas'}
      </h2>
      <p className="mt-2 text-humo" aria-live="polite">
        {PASOS[paso]}…
      </p>
      <ol className="mt-8 w-full space-y-2 text-left">
        {PASOS.map((p, n) => (
          <li
            key={p}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
              n < paso
                ? 'border-bordeOscuro bg-roca2 text-humo'
                : n === paso
                  ? 'border-vetaClara bg-roca2 text-hueso'
                  : 'border-transparent text-[#6C727C]'
            }`}
          >
            <span className="font-mono text-xs">{String(n + 1).padStart(2, '0')}</span>
            {p}
          </li>
        ))}
      </ol>
      <p className="mt-6 font-mono text-xs text-[#6C727C]">
        {segundos}s · un análisis completo suele tardar entre 30 y 90 segundos
      </p>
    </div>
  )
}

export default function App() {
  const [negocio, setNegocio] = useState('')
  const [resenas, setResenas] = useState('')
  const [competidorNombre, setCompetidorNombre] = useState('')
  const [competidor, setCompetidor] = useState('')
  const [comparar, setComparar] = useState(false)

  const [cargando, setCargando] = useState(false)
  const [informe, setInforme] = useState<TInforme | null>(null)
  const [esEjemplo, setEsEjemplo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [restantes, setRestantes] = useState<number | null>(null)

  const zonaError = useRef<HTMLDivElement>(null)

  // Un informe compartido llega entero dentro del enlace: no hay nada que
  // consultar, se abre directamente.
  useEffect(() => {
    const compartido = enlaceAInforme(location.hash)
    if (compartido) {
      setInforme(compartido)
      setEsEjemplo(false)
    }
  }, [])

  const nResenas = contarResenas(resenas)
  const nCompetidor = contarResenas(competidor)
  const puedeAnalizar = !cargando && (resenas.trim().length > 100 || competidor.trim().length > 100)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeAnalizar) return
    setError(null)
    setCargando(true)
    try {
      const { informe: nuevo, restantes: quedan } = await analizar({
        negocio: negocio.trim() || (comparar && !resenas.trim() ? `Frente a ${competidorNombre}` : ''),
        resenas,
        competidor: comparar ? competidor : '',
      })
      setInforme(nuevo)
      setEsEjemplo(false)
      setRestantes(quedan)
      history.replaceState(null, '', location.pathname)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    } catch (e) {
      const mensaje =
        e instanceof ErrorMina ? e.message : 'No pude completar el análisis. Inténtalo de nuevo.'
      setError(mensaje)
      setTimeout(() => zonaError.current?.scrollIntoView({ block: 'center' }), 0)
    } finally {
      setCargando(false)
    }
  }

  function compartir() {
    if (!informe) return
    const url = informeAEnlace(informe)
    if (!url) {
      setAviso('Este informe es demasiado largo para caber en un enlace. Usa «Copiar informe».')
      setTimeout(() => setAviso(null), 6000)
      return
    }
    history.replaceState(null, '', url)
    navigator.clipboard?.writeText(url).then(
      () => {
        setAviso('Enlace copiado. Quien lo abra ve este mismo informe.')
        setTimeout(() => setAviso(null), 5000)
      },
      () => {
        setAviso('El enlace está en la barra de direcciones, cópialo desde ahí.')
        setTimeout(() => setAviso(null), 6000)
      },
    )
  }

  function volver() {
    setInforme(null)
    setEsEjemplo(false)
    history.replaceState(null, '', location.pathname)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  function cargarEjemplo() {
    setNegocio(NEGOCIO_DEMO)
    setResenas(RESENAS_DEMO)
    setCompetidorNombre(COMPETIDOR_DEMO)
    setCompetidor(RESENAS_COMPETIDOR_DEMO)
    setComparar(true)
    setInforme(null)
    setEsEjemplo(false)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  return (
    <div className="min-h-screen veta-fondo">
      <header className="no-imprimir mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <a href="/" className="flex items-center gap-2.5 font-semibold text-hueso">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#1E2127" />
            <path
              d="M8 23V9l8 8 8-8v14"
              stroke="#E9B44C"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Mina
        </a>
        <span className="rounded-full border border-bordeOscuro px-3 py-1 text-xs font-medium text-humo">
          Sin cuentas, sin instalar
        </span>
      </header>

      {aviso && (
        <p
          role="status"
          className="no-imprimir mx-auto mb-2 max-w-4xl rounded-lg border border-vetaClara/40 bg-roca2 px-4 py-2 text-center text-sm text-vetaClara sm:px-6"
        >
          {aviso}
        </p>
      )}

      {informe ? (
        <Informe informe={informe} onVolver={volver} onCompartir={compartir} ejemplo={esEjemplo} />
      ) : cargando ? (
        <Cargando negocio={negocio.trim()} />
      ) : (
        <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h1 className="mt-8 font-titulo text-4xl font-semibold leading-[1.08] text-hueso sm:text-5xl">
            Las palabras que ya usan tus clientes
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-humo">
            Pega las reseñas en crudo. Mina extrae los verbatims literales, el mapa de objeciones y los
            ángulos, y te devuelve los anuncios listos para pegar en Ads Manager.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setInforme(INFORME_DEMO)
                setEsEjemplo(true)
                window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-vetaClara/50 bg-roca2 px-3.5 py-2 text-sm font-medium text-vetaClara transition-colors hover:bg-roca3"
            >
              <FileText size={16} aria-hidden="true" /> Ver un informe de ejemplo
            </button>
            <button
              type="button"
              onClick={cargarEjemplo}
              className="inline-flex items-center gap-2 rounded-lg border border-bordeOscuro px-3.5 py-2 text-sm font-medium text-humo transition-colors hover:border-humo hover:text-hueso"
            >
              Rellenar con reseñas de ejemplo
            </button>
          </div>

          <form onSubmit={enviar} className="mt-10">
            <label className="block">
              <span className="text-sm font-medium text-hueso">Negocio o producto</span>
              <span className="ml-2 text-xs text-[#6C727C]">opcional</span>
              <input
                type="text"
                value={negocio}
                onChange={(e) => setNegocio(e.target.value)}
                placeholder="Bruma · café de origen"
                maxLength={120}
                className="mt-1.5 w-full rounded-xl border border-bordeOscuro bg-roca2 px-4 py-3 text-hueso placeholder:text-[#5B616B] focus:border-vetaClara focus:outline-none"
              />
            </label>

            <label className="mt-6 block">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-hueso">Reseñas de tus clientes</span>
                <span className="font-mono text-xs text-humo">
                  {nResenas > 0
                    ? `${nResenas} ${nResenas === 1 ? 'reseña detectada' : 'reseñas detectadas'}`
                    : 'pega el texto tal cual'}
                </span>
              </span>
              <textarea
                value={resenas}
                onChange={(e) => setResenas(e.target.value)}
                rows={12}
                maxLength={60000}
                placeholder={
                  'Pega aquí las reseñas tal como las copias de Google Maps, TripAdvisor o Amazon.\n\nNo hace falta darles formato ni quitar las fechas: una reseña por bloque es suficiente.'
                }
                className="mt-1.5 w-full resize-y rounded-xl border border-bordeOscuro bg-roca2 px-4 py-3 font-texto text-[15px] leading-relaxed text-hueso placeholder:text-[#5B616B] focus:border-vetaClara focus:outline-none"
              />
            </label>

            {/* Modo comparativo: la pieza que distingue esto de un resumen */}
            <div className="mt-6 overflow-hidden rounded-xl border border-bordeOscuro">
              <button
                type="button"
                onClick={() => setComparar((c) => !c)}
                aria-expanded={comparar}
                className="flex w-full items-center justify-between gap-3 bg-roca2 px-4 py-3 text-left transition-colors hover:bg-roca3"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Swords size={17} className="shrink-0 text-vetaClara" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-hueso">
                      Comparar con un competidor
                    </span>
                    <span className="block text-xs text-humo">
                      Añade el análisis de posicionamiento. Funciona aunque tú no tengas reseñas todavía.
                    </span>
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-humo transition-transform ${comparar ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {comparar && (
                <div className="border-t border-bordeOscuro bg-roca2/50 px-4 py-4">
                  <label className="block">
                    <span className="text-sm font-medium text-hueso">Nombre del competidor</span>
                    <span className="ml-2 text-xs text-[#6C727C]">opcional</span>
                    <input
                      type="text"
                      value={competidorNombre}
                      onChange={(e) => setCompetidorNombre(e.target.value)}
                      placeholder="Andén Tostadores"
                      maxLength={120}
                      className="mt-1.5 w-full rounded-lg border border-bordeOscuro bg-roca px-4 py-2.5 text-hueso placeholder:text-[#5B616B] focus:border-vetaClara focus:outline-none"
                    />
                  </label>
                  <label className="mt-4 block">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-hueso">Reseñas del competidor</span>
                      <span className="font-mono text-xs text-humo">
                        {nCompetidor > 0
                          ? `${nCompetidor} ${nCompetidor === 1 ? 'reseña' : 'reseñas'}`
                          : ''}
                      </span>
                    </span>
                    <textarea
                      value={competidor}
                      onChange={(e) => setCompetidor(e.target.value)}
                      rows={7}
                      maxLength={60000}
                      placeholder="Pega aquí las reseñas del competidor."
                      className="mt-1.5 w-full resize-y rounded-lg border border-bordeOscuro bg-roca px-4 py-3 text-[15px] leading-relaxed text-hueso placeholder:text-[#5B616B] focus:border-vetaClara focus:outline-none"
                    />
                  </label>
                </div>
              )}
            </div>

            <div ref={zonaError}>
              {error && (
                <p
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-xl border border-falloClaro/40 bg-[#2A1A17] px-4 py-3 text-sm text-falloClaro"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={!puedeAnalizar}
                className="inline-flex items-center gap-2 rounded-xl bg-vetaClara px-6 py-3.5 font-semibold text-roca transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Pickaxe size={18} aria-hidden="true" /> Analizar reseñas
              </button>
              <span className="text-xs text-humo">
                {puedeAnalizar
                  ? restantes !== null
                    ? `Te quedan ${restantes} análisis esta hora`
                    : 'Tarda entre 30 y 90 segundos'
                  : 'Pega unas cuantas reseñas para empezar'}
              </span>
            </div>
          </form>

          <section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                t: 'Citas textuales, no paráfrasis',
                d: 'Cada verbatim se busca dentro de tus reseñas antes de mostrarlo. El que no aparece literalmente, se descarta.',
              },
              {
                t: 'Frecuencias contadas, no estimadas',
                d: 'Las menciones salen de contar reseñas reales. Aquí no vas a ver un porcentaje inventado.',
              },
              {
                t: 'Dice cuándo no sabe',
                d: 'Si el corpus es corto para sostener una conclusión, lo avisa en vez de fabricar un hallazgo.',
              },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-bordeOscuro bg-roca2/60 p-4">
                <h2 className="text-sm font-semibold text-hueso">{c.t}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-humo">{c.d}</p>
              </div>
            ))}
          </section>
        </main>
      )}

      <footer className="no-imprimir mx-auto max-w-3xl px-4 pb-10 pt-4 text-sm text-humo sm:px-6">
        <p>
          <span className="font-semibold text-hueso">Mina</span> — investigación de Voz del Cliente
          para quien escribe las campañas.
        </p>
      </footer>
    </div>
  )
}
