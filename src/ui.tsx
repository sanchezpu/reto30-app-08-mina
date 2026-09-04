import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

async function alPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // navigator.clipboard no existe fuera de contextos seguros ni en algunos
    // navegadores embebidos. El truco del textarea sigue funcionando ahí.
    try {
      const t = document.createElement('textarea')
      t.value = texto
      t.setAttribute('readonly', '')
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(t)
      return ok
    } catch {
      return false
    }
  }
}

export function BotonCopiar({
  texto,
  etiqueta = 'Copiar',
  tono = 'claro',
}: {
  texto: string
  etiqueta?: string
  tono?: 'claro' | 'oscuro'
}) {
  const [estado, setEstado] = useState<'listo' | 'hecho' | 'fallo'>('listo')

  const claro =
    'border-borde bg-white text-tinta2 hover:border-veta hover:text-veta disabled:opacity-60'
  const oscuro =
    'border-bordeOscuro bg-roca2 text-humo hover:border-vetaClara hover:text-vetaClara'

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await alPortapapeles(texto)
        setEstado(ok ? 'hecho' : 'fallo')
        setTimeout(() => setEstado('listo'), 2200)
      }}
      // El nombre accesible tiene que contener el texto visible, o el control
      // por voz no encuentra el botón (§13.5).
      aria-label={`${etiqueta} al portapapeles`}
      className={`no-imprimir inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        tono === 'claro' ? claro : oscuro
      }`}
    >
      {estado === 'hecho' ? (
        <>
          <Check size={14} aria-hidden="true" /> Copiado
        </>
      ) : estado === 'fallo' ? (
        <>Cópialo a mano</>
      ) : (
        <>
          <Copy size={14} aria-hidden="true" /> {etiqueta}
        </>
      )}
    </button>
  )
}

export function Etiqueta({
  children,
  tono = 'neutro',
}: {
  children: React.ReactNode
  tono?: 'neutro' | 'veta' | 'ok' | 'aviso' | 'fallo'
}) {
  const tonos = {
    neutro: 'bg-hueso text-tinta2 border-borde',
    veta: 'bg-[#FDF4E3] text-veta border-[#EBD7A8]',
    ok: 'bg-[#E8F5EF] text-ok border-[#BEE3D4]',
    aviso: 'bg-[#FBF2DE] text-aviso border-[#EDDCAE]',
    fallo: 'bg-[#FBEBE8] text-fallo border-[#F0CFC8]',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tonos[tono]}`}
    >
      {children}
    </span>
  )
}

// Cabecera de bloque del informe: número, título y botón de copiar ese bloque.
export function Bloque({
  numero,
  titulo,
  descripcion,
  copiar,
  children,
  saltoAntes = false,
}: {
  numero: number
  titulo: string
  descripcion: string
  copiar: string
  children: React.ReactNode
  saltoAntes?: boolean
}) {
  return (
    <section className={`bloque mt-12 ${saltoAntes ? 'salto-antes' : ''}`}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-borde pb-3">
        <div>
          <h2 className="font-titulo text-xl font-semibold text-tinta sm:text-2xl">
            <span className="mr-2 font-mono text-sm font-normal text-veta">
              {String(numero).padStart(2, '0')}
            </span>
            {titulo}
          </h2>
          <p className="mt-1 text-sm text-tinta2">{descripcion}</p>
        </div>
        <BotonCopiar texto={copiar} etiqueta="Copiar bloque" />
      </div>
      {children}
    </section>
  )
}
