// Usage: npm run images:optimize -- <originals-directory>
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { optimizePhotos } from './images/photos.mjs'
import { optimizeLogo } from './images/logo.mjs'
import { optimizeHero } from './images/hero.mjs'

const sourceDir = process.argv[2]
if (!sourceDir) {
  console.error('Falta la carpeta con los originales.')
  process.exit(1)
}

const outputDir = path.resolve('src/shared/assets/images')
await mkdir(outputDir, { recursive: true })
const paths = {
  source: (file) => path.join(sourceDir, file),
  output: (file) => path.join(outputDir, file),
  favicon: path.resolve('public/favicon.png'),
}

await optimizePhotos(paths)
await optimizeLogo(paths)
await optimizeHero(paths)
