import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'

describe('mobile navigation', () => {
  it('opens, focuses a link and restores focus and scrolling on Escape', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    vi.stubGlobal('matchMedia', () => ({
      addEventListener() {},
      removeEventListener() {},
    }))
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    const toggle = screen.getByRole('button', { name: 'Abrir menú' })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement?.textContent).toBe('Instalaciones')
    const menu = screen.getByRole('navigation', { name: 'Principal móvil' })
    const last = menu
      .querySelectorAll('a')
      .item(menu.querySelectorAll('a').length - 1)
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(toggle)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle)
    expect(document.body.style.overflow).toBe('')
  })

  it('marks the Torneos link as current on its pages', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    render(
      <MemoryRouter initialEntries={['/torneos/abc']}>
        <Header />
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const current = nav.querySelectorAll('[aria-current="page"]')
    expect([...current].map((link) => link.textContent)).toEqual(['Torneos'])
    expect(
      within(nav).getByRole('link', { name: 'Torneos' }).getAttribute('href'),
    ).toBe('/torneos')
  })
})
