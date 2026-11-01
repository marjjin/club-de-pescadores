// Genera las imágenes optimizadas del sitio.
// Uso: node scripts/optimize-images.mjs <carpeta-con-originales>
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const sourceDir = process.argv[2]
if (!sourceDir) {
  console.error('Falta la carpeta con los originales.')
  process.exit(1)
}

const outputDir = path.resolve('src/assets/images')
await mkdir(outputDir, { recursive: true })

const source = (file) => path.join(sourceDir, file)
const output = (file) => path.join(outputDir, file)

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
  ['4.png', 'news-contest.webp', { left: 0, top: 0, width: 863, height: 575 }],
  ['6.png', 'news-river.webp', { left: 0, top: 340, width: 563, height: 375 }],
  [
    '6.png',
    'facility-river.webp',
    { left: 140, top: 300, width: 400, height: 521 },
  ],
  ['9.png', 'news-catch.webp', { left: 0, top: 120, width: 568, height: 379 }],
]

for (const [file, name, region] of crops) {
  await sharp(source(file))
    .extract(region)
    .webp({ quality: 76 })
    .toFile(output(name))
}

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
await sharp(source('10.jpg')).resize(64).png().toFile('public/favicon.png')

// La foto del hero solo existe dentro del diseño, con texto impreso encima.
// Se marcan esas letras y se reconstruye el fondo desde los píxeles vecinos.
const design = source('8.png')
const heroBox = { left: 0, top: 118, width: 864, height: 364 }
const offset = heroBox.top

const skyBlock = [626, 120 - offset, 846, 242 - offset] // cartel
const buttonsBlock = [38, 428 - offset, 366, 364] // botones
const printedText = [30, 225 - offset, 404, 425 - offset]

// Las líneas del muelle convergen en este punto de fuga. Rellenar a lo largo de
// ellas conserva baranda y vigas nítidas, algo que un promedio de vecinos borra.
const vanishingPoint = [927, 188]
const waterLineAtLeft = 225 // Fila donde el borde inferior del muelle toca x = 0.

const isWater = (x, y) =>
  y >
  waterLineAtLeft +
    ((vanishingPoint[1] - waterLineAtLeft) * x) / vanishingPoint[0]

const fillAlongPerspective = (data, width, height, hole) => {
  const known = hole.slice()
  const walk = (x, y, stepX, stepY) => {
    for (let distance = 1; distance < 500; distance += 1) {
      const px = Math.round(x + stepX * distance)
      const py = Math.round(y + stepY * distance)
      if (px < 0 || py < 0 || px >= width || py >= height) return null
      if (!known[px + py * width])
        return { distance, at: (px + py * width) * 3 }
    }
    return null
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!known[x + y * width]) continue
      const length = Math.hypot(vanishingPoint[0] - x, vanishingPoint[1] - y)
      const stepX = (vanishingPoint[0] - x) / length
      const stepY = (vanishingPoint[1] - y) / length
      const ahead = walk(x, y, stepX, stepY)
      const behind = walk(x, y, -stepX, -stepY)
      const nearest = ahead ?? behind
      if (!nearest) continue
      const other = behind ?? ahead
      const weight = other.distance / (nearest.distance + other.distance)
      const at = (x + y * width) * 3
      for (let channel = 0; channel < 3; channel += 1) {
        data[at + channel] =
          data[nearest.at + channel] * weight +
          data[other.at + channel] * (1 - weight)
      }
    }
  }
}

// El color del agua sale del relleno y las ondas se toman del río sano de la derecha.
const addWaterTexture = async (data, info, hole) => {
  const { width, height } = info
  const donorShift = 370
  const seamFadeWidth = 110
  const smooth = await sharp(data, { raw: info }).blur(10).raw().toBuffer()
  const donorSmooth = await sharp(data, { raw: info }).blur(4).raw().toBuffer()
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width - donorShift; x += 1) {
      if (!hole[x + y * width] || !isWater(x, y)) continue
      const at = (x + y * width) * 3
      const donor = (x + donorShift + y * width) * 3
      // Junto a los botones del diseño el color se acerca al del río real, sin corte.
      const seam = (buttonsBlock[2] + 14 + y * width) * 3
      const fade =
        y >= buttonsBlock[1]
          ? Math.max(0, 1 - (buttonsBlock[2] - x) / seamFadeWidth) ** 2
          : 0
      for (let channel = 0; channel < 3; channel += 1) {
        const ripple =
          data[donor + channel] / (donorSmooth[donor + channel] + 1)
        const tone =
          smooth[at + channel] * (1 - fade) + smooth[seam + channel] * fade
        data[at + channel] = Math.min(
          255,
          tone * Math.min(1.7, Math.max(0.5, ripple)),
        )
      }
    }
  }
}

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

  // Rellena el hueco de afuera hacia adentro con el promedio de los vecinos conocidos.
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
  await addWaterTexture(data, info, damaged)

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
