import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, expect, it, vi } from 'vitest'
import { useConfirm } from '../hooks/useConfirm'
import type { ConfirmOptions } from '../hooks/useConfirm'
import { ConfirmProvider } from './ConfirmProvider'

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false
    },
  })
})
function Harness({
  options,
  onResult,
}: {
  options: ConfirmOptions
  onResult: (value: boolean) => void
}) {
  const confirm = useConfirm()
  return (
    <button type="button" onClick={() => void confirm(options).then(onResult)}>
      Acción
    </button>
  )
}
function mount(options: ConfirmOptions) {
  const onResult = vi.fn()
  render(
    <ConfirmProvider>
      <Harness options={options} onResult={onResult} />
    </ConfirmProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Acción' }))
  return onResult
}

it('asks with a club dialog instead of the browser one', async () => {
  const native = vi.spyOn(window, 'confirm')
  const onResult = mount({
    title: '¿Publicar el parte?',
    message: 'Se verá en el sitio.',
    confirmLabel: 'Publicar parte',
  })
  const dialog = await screen.findByRole('dialog', {
    name: '¿Publicar el parte?',
  })
  expect(dialog.textContent).toContain('Se verá en el sitio.')
  fireEvent.click(screen.getByRole('button', { name: 'Publicar parte' }))
  await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  expect(native).not.toHaveBeenCalled()
})

it('treats Esc as cancel and focuses Cancel first on destructive actions', async () => {
  const onResult = mount({
    title: '¿Eliminar definitivamente?',
    confirmLabel: 'Eliminar',
    tone: 'danger',
  })
  const dialog = await screen.findByRole('dialog')
  expect(document.activeElement?.textContent).toBe('Cancelar')
  fireEvent(dialog, new Event('cancel', { cancelable: true }))
  await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
})
