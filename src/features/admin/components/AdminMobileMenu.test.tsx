import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { useAdminMobileMenu } from '../hooks/useAdminMobileMenu'
import { AdminMobileMenu } from './AdminMobileMenu'

beforeAll(() => {
  // jsdom has no native modal focus/inert behavior; browser coverage remains separate.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false
      this.dispatchEvent(new Event('close'))
    },
  })
})
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    addEventListener(type: string, listener: EventListener) {
      window.addEventListener(`media-${type}`, listener)
    },
    removeEventListener(type: string, listener: EventListener) {
      window.removeEventListener(`media-${type}`, listener)
    },
  }))
})
function Harness() {
  const { open, triggerRef, dialogRef, show, close, onClosed } =
    useAdminMobileMenu()
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-controls="test-menu"
        onClick={show}
      >
        Abrir menú
      </button>
      <AdminMobileMenu
        id="test-menu"
        dialogRef={dialogRef}
        onDismiss={() => close()}
        onNavigate={() => close('content')}
        onClosed={onClosed}
      />
      <main id="admin-content" tabIndex={-1}>
        <p data-testid="path">{location.pathname}</p>
        <button
          onClick={() => {
            void navigate('/admin/cuenta')
          }}
        >
          Cambiar ruta
        </button>
        <button
          onClick={() => {
            void navigate(-1)
          }}
        >
          Volver
        </button>
      </main>
    </>
  )
}
function mount() {
  return render(
    <MemoryRouter initialEntries={['/admin/muelle']}>
      <Harness />
    </MemoryRouter>,
  )
}
function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
  return screen.getByRole('dialog', { name: 'Menú de administración' })
}

it('starts closed and opens a labelled drawer with the active section and a focused close control', () => {
  mount()
  const trigger = screen.getByRole('button', { name: 'Abrir menú' })
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByRole('dialog')).toBeNull()
  const menu = openMenu()
  expect(trigger.getAttribute('aria-controls')).toBe(menu.id)
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(menu.getAttribute('aria-modal')).toBe('true')
  expect(document.body.style.overflow).toBe('hidden')
  expect(document.activeElement).toBe(
    within(menu).getByRole('button', { name: 'Cerrar menú de administración' }),
  )
  expect(
    within(menu)
      .getByRole('link', { name: 'Parte del muelle' })
      .getAttribute('aria-current'),
  ).toBe('page')
})

it('closes with the cross and restores focus and the previous scroll style', () => {
  const previous = document.body.style.overflow
  document.body.style.overflow = 'auto'
  mount()
  const menu = openMenu()
  fireEvent.click(
    within(menu).getByRole('button', { name: 'Cerrar menú de administración' }),
  )
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Abrir menú' }),
  )
  expect(document.body.style.overflow).toBe('auto')
  document.body.style.overflow = previous
})

it('handles the native Escape cancellation and outside clicks', () => {
  mount()
  const menu = openMenu()
  fireEvent(menu, new Event('cancel', { bubbles: false, cancelable: true }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.body.style.overflow).toBe('')
  fireEvent.click(openMenu())
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('keeps the drawer open when its content is clicked and closes on section navigation', () => {
  mount()
  const menu = openMenu()
  fireEvent.click(
    within(menu).getByRole('navigation', { name: 'Administración móvil' }),
  )
  expect(screen.getByRole('dialog')).toBe(menu)
  fireEvent.click(within(menu).getByRole('link', { name: 'Mi cuenta' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByTestId('path').textContent).toBe('/admin/cuenta')
  expect(document.activeElement).toBe(screen.getByRole('main'))
  expect(document.body.style.overflow).toBe('')
})

it('closes even when the selected section is already active', () => {
  mount()
  fireEvent.click(
    within(openMenu()).getByRole('link', { name: 'Parte del muelle' }),
  )
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByTestId('path').textContent).toBe('/admin/muelle')
})

it('closes on route changes and does not reopen when navigating back', () => {
  mount()
  openMenu()
  fireEvent.click(screen.getByRole('button', { name: 'Cambiar ruta' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
  expect(screen.getByTestId('path').textContent).toBe('/admin/muelle')
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('unlocks scrolling when the screen changes to desktop or the workspace unmounts', () => {
  const view = mount()
  openMenu()
  const resize = new Event('media-change')
  Object.defineProperty(resize, 'matches', { value: true })
  fireEvent(window, resize)
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.body.style.overflow).toBe('')
  openMenu()
  view.unmount()
  expect(document.body.style.overflow).toBe('')
})
