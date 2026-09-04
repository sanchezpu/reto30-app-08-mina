import { AlertTriangle, ArrowLeft, Printer, Quote, Share2, Target } from 'lucide-react'
import type { Informe as TInforme } from './tipos'
import { LIMITES } from './tipos'
import { Bloque, BotonCopiar, Etiqueta } from './ui'
import {
  angulosATexto,
  anunciosATexto,
  elogiosATexto,
  informeATexto,
  objecionesATexto,
  posicionamientoATexto,
  verbatimsATexto,
} from './texto'

const SENALES = {
  fuerte: { texto: 'Señal fuerte', tono: 'ok' as const },
  media: { texto: 'Señal media', tono: 'aviso' as const },
  debil: { texto: 'Señal débil', tono: 'fallo' as const },
}

function Menciones({ n }: { n: number }) {
  return (
    <span className="whitespace-nowrap font-mono text-xs text-tinta2">
      {n} {n === 1 ? 'mención' : 'menciones'}
    </span>
  )
}

function Contador({ valor, limite }: { valor: number; limite: number }) {
  const pasado = valor > limite
  return (
    <span
      className={`font-mono text-[11px] ${pasado ? 'font-semibold text-fallo' : 'text-tinta2'}`}
      title={pasado ? 'Ads Manager va a recortar este texto' : 'Dentro del límite de Ads Manager'}
    >
      {valor}/{limite}
    </span>
  )
}

export default function Informe({
  informe,
  onVolver,
  onCompartir,
  ejemplo = false,
}: {
  informe: TInforme
  onVolver: () => void
  onCompartir: () => void
  ejemplo?: boolean
}) {
  const fecha = new Date(informe.generado).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const senal = SENALES[informe.senal] ?? SENALES.media
  const maxMenciones = Math.max(1, ...informe.elogios.map((e) => e.menciones))
  const titulares = informe.verbatims.filter((v) => v.uso === 'titular')
  const pruebas = informe.verbatims.filter((v) => v.uso === 'prueba')

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6">
      {/* Barra de herramientas: no forma parte del entregable, desaparece al imprimir */}
      <div className="no-imprimir mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-2 rounded-lg border border-bordeOscuro bg-roca2 px-3 py-2 text-sm font-medium text-hueso transition-colors hover:border-vetaClara hover:text-vetaClara"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Analizar otras reseñas
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <BotonCopiar texto={informeATexto(informe)} etiqueta="Copiar informe" tono="oscuro" />
          <button
            type="button"
            onClick={onCompartir}
            aria-label="Compartir enlace del informe"
            className="inline-flex items-center gap-1.5 rounded-lg border border-bordeOscuro bg-roca2 px-2.5 py-1.5 text-xs font-medium text-humo transition-colors hover:border-vetaClara hover:text-vetaClara"
          >
            <Share2 size={14} aria-hidden="true" /> Compartir enlace
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Imprimir informe"
            className="inline-flex items-center gap-1.5 rounded-lg border border-bordeOscuro bg-roca2 px-2.5 py-1.5 text-xs font-medium text-humo transition-colors hover:border-vetaClara hover:text-vetaClara"
          >
            <Printer size={14} aria-hidden="true" /> Imprimir
          </button>
        </div>
      </div>

      {ejemplo && (
        <p className="no-imprimir mb-4 rounded-xl border border-[#3A3520] bg-[#221E12] px-4 py-3 text-sm text-vetaClara">
          Informe de ejemplo sobre un negocio ficticio, para que veas la forma de la salida. Pega tus
          reseñas para generar el tuyo.
        </p>
      )}

      {/* La hoja: fondo claro porque esto se imprime y se entrega */}
      <article className="hoja rounded-2xl border border-borde bg-panel px-5 py-8 shadow-2xl sm:px-10 sm:py-12">
        <header className="border-b-2 border-tinta pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-veta">
            Investigación de Voz del Cliente
          </p>
          <h1 className="mt-2 font-titulo text-3xl font-semibold leading-tight text-tinta sm:text-4xl">
            {informe.negocio}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-tinta2">
            <span>{fecha}</span>
            <span aria-hidden="true">·</span>
            <span>
              {informe.resenas} {informe.resenas === 1 ? 'reseña analizada' : 'reseñas analizadas'}
            </span>
            {informe.resenasCompetidor > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{informe.resenasCompetidor} del competidor</span>
              </>
            )}
            <Etiqueta tono={senal.tono}>{senal.texto}</Etiqueta>
          </div>
        </header>

        {informe.resumen && (
          <p className="mt-6 font-titulo text-lg leading-relaxed text-tinta sm:text-xl">
            {informe.resumen}
          </p>
        )}

        {informe.notaSenal && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-hueso px-4 py-3 text-sm text-tinta2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-aviso" aria-hidden="true" />
            <span>{informe.notaSenal}</span>
          </p>
        )}

        {/* ─────────── 1. Qué elogian ─────────── */}
        <Bloque
          numero={1}
          titulo="Qué elogian"
          descripcion="Agrupado por tema y ordenado por menciones reales, no por lo que parezca importante."
          copiar={elogiosATexto(informe)}
        >
          <ul className="space-y-4">
            {informe.elogios.map((e) => (
              <li key={e.tema}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-tinta">{e.tema}</h3>
                  <Menciones n={e.menciones} />
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hueso">
                  <div
                    className="h-full rounded-full bg-veta"
                    style={{ width: `${Math.round((e.menciones / maxMenciones) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-tinta2">{e.que}</p>
              </li>
            ))}
          </ul>
        </Bloque>

        {/* ─────────── 2. Verbatims ─────────── */}
        <Bloque
          numero={2}
          titulo="Verbatims usables"
          descripcion="Frases textuales, tal como las escribió el cliente. Verificadas contra el texto original."
          copiar={verbatimsATexto(informe)}
        >
          {informe.descartados > 0 && (
            <p className="mb-4 rounded-lg border border-[#EDDCAE] bg-[#FBF2DE] px-3 py-2 text-xs text-aviso">
              Se descartaron {informe.descartados}{' '}
              {informe.descartados === 1 ? 'cita que no aparecía' : 'citas que no aparecían'} literalmente
              en las reseñas.
            </p>
          )}

          {[
            { lista: titulares, titulo: 'Para titular', pista: 'Frases con gancho, van al headline.' },
            {
              lista: pruebas,
              titulo: 'Para prueba social',
              pista: 'Frases que sostienen la promesa, van en el cuerpo o en creatividades.',
            },
          ].map(
            (grupo) =>
              grupo.lista.length > 0 && (
                <div key={grupo.titulo} className="mb-6 last:mb-0">
                  <div className="mb-3 flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-tinta">
                      {grupo.titulo}
                    </h3>
                    <span className="text-xs text-tinta2">{grupo.pista}</span>
                  </div>
                  <ul className="grid grid-cols-1 gap-3">
                    {grupo.lista.map((v, n) => (
                      <li
                        key={`${grupo.titulo}-${n}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-borde bg-hueso px-4 py-3"
                      >
                        <div className="min-w-0">
                          <Quote size={14} className="mb-1 text-veta" aria-hidden="true" />
                          <p className="font-titulo text-[15px] leading-relaxed text-tinta">
                            «{v.texto}»
                          </p>
                          {v.tema && <p className="mt-1 text-xs text-tinta2">{v.tema}</p>}
                        </div>
                        <BotonCopiar texto={v.texto} etiqueta="Copiar" />
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </Bloque>

        {/* ─────────── 3. Objeciones ─────────── */}
        <Bloque
          numero={3}
          titulo="Mapa de objeciones"
          descripcion="Las críticas convertidas en dudas que hay que desactivar antes de que el prospecto las piense."
          copiar={objecionesATexto(informe)}
        >
          <ul className="grid grid-cols-1 gap-4">
            {informe.objeciones.map((o, n) => (
              <li key={n} className="rounded-xl border border-borde bg-panel p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-titulo text-[15px] font-semibold leading-snug text-tinta">
                    {o.objecion}
                  </h3>
                  <Menciones n={o.menciones} />
                </div>
                <div className="mt-3 border-l-2 border-veta pl-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-veta">
                    Cómo desactivarla
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-tinta2">{o.desactivar}</p>
                </div>
              </li>
            ))}
          </ul>
        </Bloque>

        {/* ─────────── 4. Ángulos ─────────── */}
        <Bloque
          numero={4}
          titulo="Ángulos de campaña"
          descripcion="Distintos entre sí: cada uno ataca un deseo diferente y le habla a otra persona."
          copiar={angulosATexto(informe)}
          saltoAntes
        >
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {informe.angulos.map((a, n) => (
              <li key={n} className="rounded-xl border border-borde bg-hueso p-4">
                <div className="flex items-center gap-2">
                  <Target size={15} className="shrink-0 text-veta" aria-hidden="true" />
                  <h3 className="font-titulo font-semibold text-tinta">{a.nombre}</h3>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-tinta2">
                      Deseo o dolor
                    </dt>
                    <dd className="text-tinta">{a.deseo}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-tinta2">
                      Le habla a
                    </dt>
                    <dd className="text-tinta">{a.publico}</dd>
                  </div>
                  {a.apoyo && (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-tinta2">
                        Se apoya en
                      </dt>
                      <dd className="text-tinta2">{a.apoyo}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </Bloque>

        {/* ─────────── 5. Anuncios ─────────── */}
        <Bloque
          numero={5}
          titulo="Anuncios para Meta Ads"
          descripcion="Listos para pegar en Ads Manager. El contador avisa si un campo se pasa del límite."
          copiar={anunciosATexto(informe)}
        >
          <ul className="grid grid-cols-1 gap-4">
            {informe.anuncios.map((a, n) => (
              <li key={n} className="overflow-hidden rounded-xl border border-borde">
                <div className="flex items-center justify-between gap-3 border-b border-borde bg-hueso px-4 py-2">
                  <h3 className="truncate text-sm font-semibold text-tinta">{a.angulo}</h3>
                  <BotonCopiar
                    texto={`${a.primary}\n\n${a.headline}\n${a.descripcion}`}
                    etiqueta="Copiar anuncio"
                  />
                </div>
                <dl className="divide-y divide-borde">
                  {[
                    { et: 'Texto principal', v: a.primary, lim: LIMITES.primary },
                    { et: 'Titular', v: a.headline, lim: LIMITES.headline },
                    { et: 'Descripción', v: a.descripcion, lim: LIMITES.descripcion },
                  ].map((campo) => (
                    <div key={campo.et} className="px-4 py-3">
                      <dt className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-tinta2">
                          {campo.et}
                        </span>
                        <Contador valor={campo.v.length} limite={campo.lim} />
                      </dt>
                      <dd className="text-sm leading-relaxed text-tinta">{campo.v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </Bloque>

        {/* ─────────── 6. Posicionamiento (solo en modo comparativo) ─────────── */}
        {informe.posicionamiento && (
          <Bloque
            numero={6}
            titulo="Posicionamiento frente al competidor"
            descripcion="Dónde ganas, dónde no vas a ganar, y qué hueco queda libre para tu mensaje."
            copiar={posicionamientoATexto(informe)}
            saltoAntes
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  titulo: 'Te elogian a ti lo que a él no',
                  lista: informe.posicionamiento.tuFuerte,
                  color: 'border-ok',
                },
                {
                  titulo: 'Dónde es él más fuerte',
                  lista: informe.posicionamiento.suFuerte,
                  color: 'border-fallo',
                },
                {
                  titulo: 'Hueco que puedes ocupar',
                  lista: informe.posicionamiento.hueco,
                  color: 'border-veta',
                },
              ].map((col) => (
                <div key={col.titulo} className={`rounded-xl border-t-4 bg-hueso p-4 ${col.color}`}>
                  <h3 className="mb-3 text-sm font-semibold text-tinta">{col.titulo}</h3>
                  <ul className="space-y-3">
                    {col.lista.map((p, n) => (
                      <li key={n}>
                        <p className="text-sm font-medium text-tinta">{p.punto}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-tinta2">{p.porQue}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Bloque>
        )}

        <footer className="mt-12 border-t border-borde pt-4 text-xs text-tinta2">
          <p>
            Mina · investigación de Voz del Cliente. Las frases entrecomilladas son textuales de las
            reseñas analizadas; las frecuencias son conteos reales sobre el texto entregado.
          </p>
        </footer>
      </article>
    </div>
  )
}
