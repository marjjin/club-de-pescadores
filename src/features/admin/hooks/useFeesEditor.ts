import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MAX_FEES_PER_KIND, feesKey } from '@/features/fees'
import type { FeeKind } from '@/features/fees'
import { randomUuid } from '@/shared/lib/random-id'
import { getAdminFees, saveFees } from '../api/fees'
import {
  kindLabels,
  moveFee,
  toFeesDraft,
  validateFeesDraft,
} from '../fee-editor'
import type { FeeErrors } from '../fee-editor'
import type { AdminFees, FeeDraft, FeesInput } from '../schemas/fees'
import { useConfirm } from './useConfirm'

const adminKey = (userId: string) => ['admin', userId, 'fees'] as const

export function useAdminFees(userId: string) {
  return useQuery({
    queryKey: adminKey(userId),
    queryFn: ({ signal }) => getAdminFees(signal),
    staleTime: 30_000,
  })
}

type RowField = 'name' | 'detail' | 'icon' | 'price'

export function useFeesEditor(
  data: AdminFees,
  userId: string,
  onSaved: () => void,
) {
  const confirm = useConfirm()
  const client = useQueryClient()
  const [initial] = useState(() => JSON.stringify(toFeesDraft(data)))
  const [draft, setDraft] = useState(() => toFeesDraft(data))
  const [errors, setErrors] = useState<FeeErrors>({})
  // One message per reorder for screen readers, instead of a live list.
  const [announcement, setAnnouncement] = useState('')
  const save = useMutation({
    mutationFn: (input: FeesInput) => saveFees(input, data.updated_at),
    onSuccess: async (saved) => {
      client.setQueryData(adminKey(userId), saved)
      await client.invalidateQueries({ queryKey: feesKey })
      onSaved()
    },
  })
  const dirty = JSON.stringify(draft) !== initial
  const busy = save.isPending
  const count = (kind: FeeKind) =>
    draft.fees.filter((fee) => fee.kind === kind).length

  function clearError(key: string) {
    setErrors((previous) => {
      if (!(key in previous)) return previous
      const next = { ...previous }
      delete next[key]
      return next
    })
    save.reset()
  }
  function setSchedule(name: 'month' | 'note', value: string) {
    setDraft((previous) => ({ ...previous, [name]: value }))
    clearError(name)
  }
  function changeRow(key: string, name: RowField, value: string) {
    setDraft((previous) => ({
      ...previous,
      fees: previous.fees.map((fee) =>
        fee.key === key ? { ...fee, [name]: value } : fee,
      ),
    }))
    clearError(`${key}.${name}`)
  }
  function addRow(kind: FeeKind) {
    if (count(kind) >= MAX_FEES_PER_KIND) return
    const row: FeeDraft = {
      key: randomUuid(),
      id: null,
      kind,
      name: '',
      detail: '',
      icon: kind === 'membership' ? 'person' : 'ticket',
      price: '',
    }
    setDraft((previous) => {
      // New rows go at the end of their own list.
      const fees =
        kind === 'membership'
          ? [
              ...previous.fees.filter((fee) => fee.kind === kind),
              row,
              ...previous.fees.filter((fee) => fee.kind !== kind),
            ]
          : [...previous.fees, row]
      return { ...previous, fees }
    })
    clearError(`kind:${kind}`)
    // Focus the new name field once React has rendered it.
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(`[data-field="${row.key}.name"]`)
        ?.focus(),
    )
  }
  function moveRow(key: string, step: -1 | 1) {
    const row = draft.fees.find((fee) => fee.key === key)
    if (!row) return
    const next = moveFee(draft.fees, key, step)
    if (next === draft.fees) return
    setDraft((previous) => ({ ...previous, fees: next }))
    const position =
      next.filter((fee) => fee.kind === row.kind).indexOf(row) + 1
    setAnnouncement(
      `${row.name.trim() || 'Fila sin nombre'} quedó en el lugar ${position} de ${kindLabels[row.kind].title.toLowerCase()}.`,
    )
    // Moving a node can drop focus; keep it on the button that was pressed.
    // At either end that button turns disabled, so the opposite one takes focus.
    requestAnimationFrame(() => {
      const button = (direction: number) =>
        document.querySelector<HTMLElement>(
          `[data-move="${key}:${direction}"]:not(:disabled)`,
        )
      ;(button(step) ?? button(-step))?.focus()
    })
  }
  async function removeRow(key: string) {
    const row = draft.fees.find((fee) => fee.key === key)
    if (!row) return
    if (
      (row.name.trim() || row.price.trim()) &&
      !(await confirm({
        title: `¿Quitar «${row.name.trim() || 'sin nombre'}»?`,
        message:
          'Deja de mostrarse en el sitio cuando publiques los cambios. Hasta entonces podés descartarlos.',
        confirmLabel: 'Quitar',
        cancelLabel: 'Conservar',
        tone: 'danger',
      }))
    )
      return
    setDraft((previous) => ({
      ...previous,
      fees: previous.fees.filter((fee) => fee.key !== key),
    }))
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([name]) => !name.startsWith(key)),
      ),
    )
    save.reset()
  }
  async function requestSubmit(form: HTMLFormElement) {
    if (busy || !dirty) return
    const result = validateFeesDraft(draft)
    if (!result.success) {
      setErrors(result.errors)
      // First invalid field in reading order, not in object order.
      form
        .querySelector<HTMLElement>(
          Object.keys(result.errors)
            .map((name) => `[data-field="${name}"]`)
            .join(','),
        )
        ?.focus()
      return
    }
    setErrors({})
    if (
      !(await confirm({
        title: '¿Publicar los nuevos valores?',
        message: `El sitio muestra de inmediato ${result.data.fees.length} valores.`,
        confirmLabel: 'Publicar valores',
      }))
    )
      return
    save.mutate(result.data)
  }
  async function requestDiscard() {
    if (
      !dirty ||
      busy ||
      !(await confirm({
        title: '¿Descartar los cambios?',
        message: 'Se vuelve a los valores publicados.',
        confirmLabel: 'Descartar cambios',
        cancelLabel: 'Seguir editando',
        tone: 'danger',
      }))
    )
      return
    setDraft(toFeesDraft(data))
    setErrors({})
    save.reset()
  }
  return {
    draft,
    errors,
    announcement,
    save,
    dirty,
    busy,
    count,
    setSchedule,
    changeRow,
    addRow,
    moveRow,
    removeRow: (key: string) => void removeRow(key),
    discard: () => void requestDiscard(),
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void requestSubmit(event.currentTarget)
    },
  }
}
