import sharp from 'sharp'
import { fillAlongPerspective, addWaterTexture } from './hero-repair.mjs'

// This reconstruction only applies to the original design image.
export async function optimizeHero({ source, output }) {
  const design = source('8.png')
  const heroBox = { left: 0, top: 118, width: 864, height: 364 }
  const offset = heroBox.top

  const skyBlock = [626, 120 - offset, 846, 242 - offset] // cartel
  const buttonsBlock = [38, 428 - offset, 366, 364] // botones
  const printedText = [30, 225 - offset, 404, 425 - offset]

  const removePrintedContent = async () => {
    const { data, info } = await sharp(design)
      .extract(heroBox)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const { width, height } = info
    const hole = new Uint8Array(width * height)
    const pixel = (x, y) => (x + y * width) * 3

    for (const [x0, y0, x1, y1] of [
      [skyBlock[0], 0, skyBlock[2], skyBlock[3]],
      buttonsBlock,
    ]) {
      for (let y = y0; y < y1; y += 1) {
        hole.fill(1, x0 + y * width, x1 + y * width)
      }
    }

    const [textX0, textY0, textX1, textY1] = printedText
    const letters = []
    for (let y = textY0; y < textY1; y += 1) {
      for (let x = textX0; x < textX1; x += 1) {
        const at = pixel(x, y)
        const [r, g, b] = [data[at], data[at + 1], data[at + 2]]
        const isWhite = Math.min(r, g, b) > 135
        const isBlueStroke =
          y > 350 - offset && y < 390 - offset && b > 120 && b > r + 50
        if (isWhite || isBlueStroke) letters.push([x, y])
      }
    }
    for (const [x, y] of letters) {
      for (let dy = -4; dy <= 4; dy += 1) {
        const row = y + dy
        if (row < 0 || row >= height) continue
        hole.fill(1, x - 4 + row * width, x + 5 + row * width)
      }
    }

    const filled = hole.slice()

    // El cielo se interpola por fila entre los dos lados del cartel.
    for (let y = 0; y < skyBlock[3]; y += 1) {
      const left = pixel(skyBlock[0] - 1, y)
      const right = pixel(skyBlock[2], y)
      for (let x = skyBlock[0]; x < skyBlock[2]; x += 1) {
        const weight = (x - skyBlock[0]) / (skyBlock[2] - skyBlock[0])
        const at = pixel(x, y)
        for (let channel = 0; channel < 3; channel += 1) {
          data[at + channel] =
            data[left + channel] * (1 - weight) + data[right + channel] * weight
        }
        filled[x + y * width] = 0
      }
    }

    const damaged = filled.slice()
    fillAlongPerspective(data, width, height, filled)
    await addWaterTexture(data, info, damaged, buttonsBlock)

    // Solo el cielo se difumina: el resto del relleno conserva la nitidez de la foto.
    const skyBlur = await sharp(data, { raw: info }).blur(22).raw().toBuffer()
    const skyMask = Buffer.alloc(width * height)
    for (let y = 0; y < skyBlock[3] + 6; y += 1) {
      skyMask.fill(255, skyBlock[0] - 4 + y * width, width + y * width)
    }
    const softMask = await sharp(skyMask, {
      raw: { width, height, channels: 1 },
    })
      .blur(9)
      .extractChannel(0)
      .raw()
      .toBuffer()
    for (let index = 0; index < softMask.length; index += 1) {
      const weight = softMask[index] / 255
      for (let channel = 0; channel < 3; channel += 1) {
        const at = index * 3 + channel
        data[at] = data[at] * (1 - weight) + skyBlur[at] * weight
      }
    }
    return sharp(data, { raw: info }).png().toBuffer()
  }

  const heroClean = await removePrintedContent()
  for (const width of [960, 1920]) {
    await sharp(heroClean)
      .resize({ width, kernel: 'lanczos3' })
      // El original mide 864 px: el enfoque compensa la suavidad de la ampliación.
      .sharpen({ sigma: 1.4, m1: 0.6, m2: 2 })
      .webp({ quality: 78, smartSubsample: true, effort: 6 })
      .toFile(output(`hero-${width}.webp`))
  }
}
