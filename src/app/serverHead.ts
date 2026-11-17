// The served HTML carries each page's title, description, robots and canonical (marked
// data-seo) for crawlers and link previews. Once the app renders its own version of one
// of them, the server copy goes: never two titles, and never a moment without one.
const kinds = [
  'title',
  'meta[name="description"]',
  'meta[name="robots"]',
  'link[rel="canonical"]',
]

export function replaceServerHeadTags(head: HTMLHeadElement = document.head) {
  const sweep = () => {
    for (const kind of kinds) {
      const own = head.querySelector(`${kind}:not([data-seo])`)
      if (own)
        for (const old of head.querySelectorAll(`${kind}[data-seo]`))
          old.remove()
    }
  }
  const observer = new MutationObserver(sweep)
  observer.observe(head, { childList: true })
  return () => observer.disconnect()
}
