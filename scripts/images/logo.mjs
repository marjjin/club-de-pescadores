import sharp from 'sharp'

export async function optimizeLogo({ source, output, favicon }) {
  // Quita solo el blanco conectado con el borde, para conservar el de la cinta y el pez.
  const removeLogoBackground = async () => {
    const { data, info } = await sharp(source('10.jpg'))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const { width, height } = info
    const isLight = (index) =>
      Math.min(data[index * 4], data[index * 4 + 1], data[index * 4 + 2]) > 205
    const seen = new Uint8Array(width * height)
    const pending = []
    for (let x = 0; x < width; x += 1) {
      pending.push(x, x + (height - 1) * width)
    }
    for (let y = 0; y < height; y += 1) {
      pending.push(y * width, y * width + width - 1)
    }
    while (pending.length > 0) {
      const index = pending.pop()
      if (seen[index] || !isLight(index)) continue
      seen[index] = 1
      data[index * 4 + 3] = 0
      const x = index % width
      if (x > 0) pending.push(index - 1)
      if (x < width - 1) pending.push(index + 1)
      if (index >= width) pending.push(index - width)
      if (index < width * (height - 1)) pending.push(index + width)
    }
    return sharp(data, { raw: info }).png().toBuffer()
  }

  const logo = await removeLogoBackground()
  for (const size of [192, 384]) {
    await sharp(logo)
      .resize(size)
      .webp({ quality: 90 })
      .toFile(output(`logo-${size}.webp`))
  }
  await sharp(source('10.jpg')).resize(64).png().toFile(favicon)
}
