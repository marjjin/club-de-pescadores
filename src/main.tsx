import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource/anton/latin-400.css'
import '@fontsource/allura/latin-400.css'
import '@fontsource-variable/nunito-sans/index.css'
import './app/styles/index.css'
import { App } from './app/App'
import { installPreloadRecovery } from './app/preloadRecovery'
import { replaceServerHeadTags } from './app/serverHead'

installPreloadRecovery()
replaceServerHeadTags()

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
// Fixed public pages come pre-rendered by the build; the rest start empty.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
