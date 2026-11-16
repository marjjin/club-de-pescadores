import { useId } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  ImageOff,
  LoaderCircle,
  Trash2,
} from 'lucide-react'
import { FacilityCard } from '@/features/facilities'
import { facilityPhotoUrl } from '../../hooks/useFacilitiesEditor'
import type { FacilityErrors } from '../../hooks/useFacilitiesEditor'
import type { FacilityDraft } from '../../schemas/facilities'
import { Field, inputClass, secondaryClass } from '../ui'

const iconButton =
  'grid size-11 place-items-center rounded-lg border border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50 disabled:opacity-40'

export function FacilityCardEditor({
  card,
  index,
  total,
  errors,
  uploading,
  uploadError,
  editable,
  onChange,
  onUpload,
  onMove,
  onRemove,
}: {
  card: FacilityDraft
  index: number
  total: number
  errors: FacilityErrors
  uploading: boolean
  uploadError: string
  editable: boolean
  onChange: (name: 'name' | 'description' | 'image_alt', value: string) => void
  onUpload: (file: File) => void
  onMove: (step: -1 | 1) => void
  onRemove: () => void
}) {
  const id = useId()
  const photo = facilityPhotoUrl(card)
  const field = (name: string) => errors[`cards.${index}.${name}`]
  const label = card.name.trim() || `Tarjeta ${index + 1}`
  const invalid = (name: string) => ({
    'aria-invalid': Boolean(field(name)),
    'data-field': `cards.${index}.${name}`,
  })
  return (
    <li className="grid min-w-0 gap-5 rounded-2xl border border-navy-900/10 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        {photo ? (
          <FacilityCard
            as="div"
            facility={{
              name: card.name.trim() || 'Título',
              description: card.description.trim() || 'Descripción',
              imageUrl: photo,
              imageAlt: card.image_alt,
            }}
          />
        ) : (
          <div className="grid aspect-[4/5] place-items-center rounded-2xl border-2 border-dashed border-navy-900/15 bg-mist-50 p-4 text-center text-sm text-ink-600">
            <span>
              <ImageOff
                size={28}
                aria-hidden="true"
                className="mx-auto mb-2 text-ink-600"
              />
              Todavía no tiene foto
            </span>
          </div>
        )}
        {editable && (
          <>
            <input
              id={`${id}-photo`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="peer sr-only"
              aria-describedby={`${id}-photo-help`}
              {...invalid('image_path')}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onUpload(file)
                event.target.value = ''
              }}
            />
            <label
              htmlFor={`${id}-photo`}
              className={`${secondaryClass} cursor-pointer peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun-400 peer-disabled:cursor-wait peer-disabled:opacity-50`}
            >
              {uploading ? (
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
              ) : (
                <ImagePlus size={16} aria-hidden="true" />
              )}
              {uploading
                ? 'Subiendo foto…'
                : photo
                  ? 'Cambiar foto'
                  : 'Subir foto'}
            </label>
            <p
              id={`${id}-photo-help`}
              className="text-xs leading-5 text-ink-600"
            >
              Vertical queda mejor. Se optimiza a WebP antes de subirse.
            </p>
          </>
        )}
        {(uploadError || field('image_path')) && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {uploadError || field('image_path')}
          </p>
        )}
      </div>
      <div className="grid min-w-0 content-start gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold wrap-anywhere text-navy-900">
            {label}
          </h3>
          {editable && (
            <div className="flex gap-2">
              <button
                type="button"
                className={iconButton}
                disabled={index === 0}
                aria-label={`Mover «${label}» antes`}
                onClick={() => onMove(-1)}
              >
                <ArrowUp size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={index === total - 1}
                aria-label={`Mover «${label}» después`}
                onClick={() => onMove(1)}
              >
                <ArrowDown size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${iconButton} text-red-700`}
                disabled={total <= 1}
                aria-label={`Quitar «${label}»`}
                onClick={onRemove}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <Field label="Título">
          <input
            className={inputClass}
            value={card.name}
            maxLength={40}
            {...invalid('name')}
            onChange={(event) => onChange('name', event.target.value)}
          />
        </Field>
        {field('name') && <FieldError text={field('name')} />}
        <Field label="Descripción">
          <textarea
            className={`${inputClass} min-h-20`}
            value={card.description}
            maxLength={160}
            {...invalid('description')}
            onChange={(event) => onChange('description', event.target.value)}
          />
        </Field>
        {field('description') && <FieldError text={field('description')} />}
        <Field
          label="Descripción de la foto"
          hint="Para quienes usan lectores de pantalla: qué se ve en la imagen."
        >
          <input
            className={inputClass}
            value={card.image_alt}
            maxLength={200}
            {...invalid('image_alt')}
            onChange={(event) => onChange('image_alt', event.target.value)}
          />
        </Field>
        {field('image_alt') && <FieldError text={field('image_alt')} />}
      </div>
    </li>
  )
}

function FieldError({ text }: { text: string | undefined }) {
  return (
    <p role="alert" className="-mt-2 text-sm font-semibold text-red-700">
      {text}
    </p>
  )
}
