import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Play,
  X,
} from 'lucide-react'
import type { MediaDraft } from '../../hooks/useMediaUploads'

const iconButton =
  'grid size-9 place-items-center rounded-full bg-navy-950/70 text-white backdrop-blur-sm hover:bg-navy-950/90 disabled:opacity-40'

export function MediaTile({
  draft,
  disabled,
  first,
  last,
  onRemove,
  onMove,
}: {
  draft: MediaDraft
  disabled: boolean
  first: boolean
  last: boolean
  onRemove: () => void
  onMove: (step: -1 | 1) => void
}) {
  const media = draft.media
  const preview = draft.preview
  const label = draft.kind === 'video' ? 'video' : 'foto'
  return (
    <li className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-navy-900/10 bg-mist-50">
      {preview ? (
        <img
          src={preview}
          alt=""
          width={media?.width}
          height={media?.height}
          className="size-full object-cover"
        />
      ) : (
        <div
          className={`flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-xs ${draft.status === 'error' ? 'text-red-700' : 'text-ink-600'}`}
        >
          {draft.status === 'error' ? (
            <AlertCircle size={22} aria-hidden="true" />
          ) : (
            <LoaderCircle
              size={22}
              aria-hidden="true"
              className="text-river-600 motion-safe:animate-spin"
            />
          )}
          <span className="line-clamp-3 wrap-anywhere">
            {draft.status === 'error' ? draft.error : `Subiendo ${draft.name}…`}
          </span>
        </div>
      )}
      {draft.kind === 'video' && media && (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-11 place-items-center rounded-full bg-navy-950/70 text-white">
            <Play size={20} aria-hidden="true" className="translate-x-px" />
          </span>
          <span className="sr-only">Video</span>
        </span>
      )}
      <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
        {first && media && (
          <span className="rounded-full bg-sun-400 px-2 py-0.5 text-[11px] font-bold text-navy-950">
            Principal
          </span>
        )}
        {draft.summary && (
          <span className="rounded-full bg-navy-950/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {draft.summary}
          </span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Quitar ${label} ${draft.name}`}
        className={`${iconButton} absolute top-2 right-2`}
      >
        <X size={16} aria-hidden="true" />
      </button>
      {media && (
        <div className="absolute right-2 bottom-2 flex gap-1.5">
          <button
            type="button"
            disabled={disabled || first}
            onClick={() => onMove(-1)}
            aria-label={`Mover ${label} ${draft.name} antes`}
            className={iconButton}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={disabled || last}
            onClick={() => onMove(1)}
            aria-label={`Mover ${label} ${draft.name} después`}
            className={iconButton}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  )
}
