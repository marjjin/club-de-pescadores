import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, Download, Printer, X } from 'lucide-react'
import logo from '@/shared/assets/images/logo-192.webp'
import type { AdminTournament } from '../../schemas/tournaments'
import { qrSvgFile, tournamentPublicUrl } from '../../tournament-qr'
import { primaryClass, secondaryClass } from '../ui'
import { QrCode } from './QrCode'
import { tournamentDates } from './tournament-dates'

const fileName = (name: string) =>
  `qr-${
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'torneo'
  }.svg`

export function TournamentQrPoster({
  tournament,
  onClose,
}: {
  tournament: AdminTournament
  onClose: () => void
}) {
  const url = tournamentPublicUrl(tournament.id)
  const [copied, setCopied] = useState(false)
  const visible =
    tournament.status === 'published' || tournament.status === 'finished'
  function download() {
    const blob = new Blob([qrSvgFile(url)], { type: 'image/svg+xml' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = fileName(tournament.name)
    link.click()
    URL.revokeObjectURL(href)
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Some browsers block the clipboard; the address stays visible to copy by hand.
    }
  }
  return (
    <section
      aria-labelledby="qr-title"
      className="mb-6 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <h2 id="qr-title" className="text-base font-extrabold">
            QR de la tabla de posiciones
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Imprimilo y pegalo en el muelle: quien lo escanee abre la tabla de
            este torneo en el celular.
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar QR"
          onClick={onClose}
          className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-mist-50 hover:text-navy-900"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {!visible && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 print:hidden"
        >
          El torneo todavía no está publicado: hasta que lo publiques, el QR
          abre una página que dice que no está disponible.
        </p>
      )}
      <div className="mx-auto mt-5 max-w-md rounded-2xl border border-navy-900/10 p-6 sm:p-8 print:hidden">
        <PosterSheet tournament={tournament} url={url} />
      </div>
      {/* The printed copy sits directly in <body>, so it starts on page one; see index.css. */}
      {createPortal(
        <div
          data-print-sheet
          aria-hidden="true"
          className="hidden print:grid print:min-h-[265mm] print:content-center"
        >
          <PosterSheet tournament={tournament} url={url} print />
        </div>,
        document.body,
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-2 print:hidden">
        <button
          type="button"
          className={primaryClass}
          onClick={() => window.print()}
        >
          <Printer size={16} aria-hidden="true" />
          Imprimir
        </button>
        <button type="button" className={secondaryClass} onClick={download}>
          <Download size={16} aria-hidden="true" />
          Descargar imagen
        </button>
        <button
          type="button"
          className={secondaryClass}
          onClick={() => {
            void copy()
          }}
        >
          {copied ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
    </section>
  )
}

function PosterSheet({
  tournament,
  url,
  print = false,
}: {
  tournament: AdminTournament
  url: string
  print?: boolean
}) {
  return (
    <div
      className={`grid justify-items-center text-center text-navy-950 ${print ? 'gap-6' : 'gap-4'}`}
    >
      <img
        src={logo}
        alt=""
        width="72"
        height="72"
        className={print ? 'size-28' : 'size-16'}
      />
      <p
        className={`font-extrabold tracking-[0.2em] text-ink-600 uppercase ${print ? 'text-base' : 'text-xs'}`}
      >
        Club de Pescadores San Nicolás
      </p>
      <h3
        className={`leading-tight font-extrabold wrap-anywhere ${print ? 'text-5xl' : 'text-2xl'}`}
      >
        {tournament.name}
      </h3>
      <p className={`text-ink-600 ${print ? 'text-xl' : 'text-sm'}`}>
        {tournamentDates(tournament)}
        {tournament.place ? ` · ${tournament.place}` : ''}
      </p>
      <QrCode
        value={url}
        label={`Código QR de la tabla de posiciones de ${tournament.name}`}
        className={print ? 'w-[11cm]' : 'w-64 max-w-full'}
      />
      <p className={`font-extrabold ${print ? 'text-3xl' : 'text-lg'}`}>
        Escaneá y mirá la tabla de posiciones
      </p>
      <p
        className={`break-all text-ink-600 ${print ? 'text-base' : 'text-xs'}`}
      >
        {url}
      </p>
    </div>
  )
}
