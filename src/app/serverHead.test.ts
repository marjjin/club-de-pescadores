import { expect, it } from 'vitest'
import { replaceServerHeadTags } from './serverHead'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

it('keeps the server tags until the app renders its own, then drops them', async () => {
  document.head.innerHTML = `
    <title data-seo>Servidor</title>
    <meta data-seo name="description" content="del servidor">
    <meta data-seo name="robots" content="index, follow">
    <meta property="og:title" content="Para WhatsApp">`
  const stop = replaceServerHeadTags()
  await tick()
  // Nothing replaces them yet: the page is never left without a title or description.
  expect(document.title).toBe('Servidor')
  const title = document.createElement('title')
  title.textContent = 'Desde la app'
  document.head.append(title)
  await tick()
  expect(document.head.querySelectorAll('title')).toHaveLength(1)
  expect(document.title).toBe('Desde la app')
  // The description stays until the app adds one; link previews keep their tags.
  expect(document.head.querySelector('meta[name="description"]')).toBeTruthy()
  expect(document.head.querySelector('meta[property="og:title"]')).toBeTruthy()
  stop()
})
