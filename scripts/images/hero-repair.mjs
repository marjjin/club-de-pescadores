import sharp from 'sharp'

// Las líneas del muelle convergen en este punto de fuga. Rellenar a lo largo de
// ellas conserva baranda y vigas nítidas, algo que un promedio de vecinos borra.
const vanishingPoint = [927, 188]
const waterLineAtLeft = 225 // Fila donde el borde inferior del muelle toca x = 0.

const isWater = (x, y) =>
  y >
  waterLineAtLeft +
    ((vanishingPoint[1] - waterLineAtLeft) * x) / vanishingPoint[0]

export const fillAlongPerspective = (data, width, height, hole) => {
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
export const addWaterTexture = async (data, info, hole, buttonsBlock) => {
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
