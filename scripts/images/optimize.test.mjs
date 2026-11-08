// @vitest-environment node
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { expect, it } from 'vitest'
import { optimizePhotos } from './photos.mjs'
import { optimizeLogo } from './logo.mjs'
import { optimizeHero } from './hero.mjs'

it('generates the expected image variants from the original input format', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'club-images-'))
  if (path.dirname(path.resolve(directory)) !== path.resolve(os.tmpdir())) {
    throw new Error('Unexpected temporary directory')
  }
  const cache = sharp.cache()
  // libvips file caching keeps temporary files locked on Windows.
  sharp.cache(false)
  try {
    const destination = path.join(directory, 'output')
    await mkdir(destination)
    const paths = {
      source: (file) => path.join(directory, file),
      output: (file) => path.join(destination, file),
      favicon: path.join(destination, 'favicon.png'),
    }
    const input = sharp({
      create: { width: 1000, height: 900, channels: 3, background: '#0b2a4f' },
    })
    for (const file of [
      '2.png',
      '3.png',
      '4.png',
      '6.png',
      '7.png',
      '8.png',
      '9.png',
      '10.jpg',
    ]) {
      await input.clone().toFile(paths.source(file))
    }

    await optimizePhotos(paths)
    await optimizeLogo(paths)
    await optimizeHero(paths)

    for (const [name, width, height] of [
      ['facility-grill.webp', 600, 540],
      ['facility-pier.webp', 600, 540],
      ['facility-hall.webp', 600, 540],
      ['news-contest.webp', 863, 575],
      ['news-river.webp', 563, 375],
      ['facility-river.webp', 400, 521],
      ['news-catch.webp', 568, 379],
      ['logo-192.webp', 192, 173],
      ['logo-384.webp', 384, 346],
      ['hero-960.webp', 960, 404],
      ['hero-1920.webp', 1920, 809],
    ]) {
      expect(await sharp(paths.output(name)).metadata()).toMatchObject({
        format: 'webp',
        width,
        height,
      })
    }
    expect(await sharp(paths.favicon).metadata()).toMatchObject({
      format: 'png',
      width: 64,
    })
  } finally {
    // This directory is created by this test and contains no project assets.
    try {
      await rm(directory, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      })
    } finally {
      sharp.cache({
        memory: cache.memory.max,
        files: cache.files.max,
        items: cache.items.max,
      })
    }
  }
})
