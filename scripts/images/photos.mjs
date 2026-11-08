import sharp from 'sharp'

export async function optimizePhotos({ source, output }) {
  const photos = [
    ['2.png', 'facility-grill.webp', 600],
    ['3.png', 'facility-pier.webp', 600],
    ['7.png', 'facility-hall.webp', 600],
  ]

  for (const [file, name, width] of photos) {
    await sharp(source(file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(output(name))
  }

  // Recortes pensados para que el motivo no quede tapado o cortado en las tarjetas.
  const crops = [
    [
      '4.png',
      'news-contest.webp',
      { left: 0, top: 0, width: 863, height: 575 },
    ],
    [
      '6.png',
      'news-river.webp',
      { left: 0, top: 340, width: 563, height: 375 },
    ],
    [
      '6.png',
      'facility-river.webp',
      { left: 140, top: 300, width: 400, height: 521 },
    ],
    [
      '9.png',
      'news-catch.webp',
      { left: 0, top: 120, width: 568, height: 379 },
    ],
  ]

  for (const [file, name, region] of crops) {
    await sharp(source(file))
      .extract(region)
      .webp({ quality: 76 })
      .toFile(output(name))
  }
}
