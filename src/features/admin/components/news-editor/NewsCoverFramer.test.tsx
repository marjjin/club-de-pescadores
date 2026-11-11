import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { NewsCoverFramer } from './NewsCoverFramer'

function mount(focus = { x: 50, y: 50 }) {
  const onChange = vi.fn()
  render(
    <NewsCoverFramer focus={focus} disabled={false} onChange={onChange}>
      <img src="https://example.test/a.webp" alt="Portada" />
    </NewsCoverFramer>,
  )
  return onChange
}
it('moves the framing with the keyboard within 0-100 and announces the value', () => {
  const onChange = mount({ x: 98, y: 50 })
  const surface = screen.getByRole('group', { name: 'Encuadre de la portada' })
  fireEvent.keyDown(surface, { key: 'ArrowRight' })
  expect(onChange).toHaveBeenLastCalledWith({ x: 100, y: 50 })
  fireEvent.keyDown(surface, { key: 'ArrowUp', shiftKey: true })
  expect(onChange).toHaveBeenLastCalledWith({ x: 98, y: 40 })
  expect(screen.getByText('Horizontal 98 %, vertical 50 %')).toBeTruthy()
})
it('recentres only when the framing was moved', () => {
  const onChange = mount({ x: 20, y: 80 })
  fireEvent.click(screen.getByRole('button', { name: 'Centrar' }))
  expect(onChange).toHaveBeenCalledWith({ x: 50, y: 50 })
})
