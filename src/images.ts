import { type Oklch, useMode, modeRgb, type Rgb, modeOklch } from 'culori/fn'

useMode(modeOklch)
export const rgbConvertor = useMode(modeRgb)

export const inRgb = ({ r, g, b }: Rgb) =>
  0 <= r && r <= 1 && 0 <= g && g <= 1 && 0 <= b && b <= 1

export function getLCPixel(x: number, y: number): { c: number; l: number } {
  return { c: x * 0.4, l: 1 - y }
}

export function getClLocation(c: number, l: number): { x: number; y: number } {
  return { x: c / 0.4, y: 1 - l }
}

/**
 * Generates the color to render at a specific pixel
 * @param x 0-1 on the x-axis
 * @param y 0-1 on the y-axis
 * @param h The hue that the color picker is currently rendering
 */
export function getRGBPixel(x: number, y: number, h: number): Rgb | null {
  const { c, l } = getLCPixel(x, y)
  const color: Oklch = { mode: 'oklch', h, c, l }
  const rgb = rgbConvertor(color)
  if (!inRgb(rgb)) return null
  return rgb
}

export function getHuePixel(h: number): Rgb {
  return rgbConvertor({ mode: 'oklch', l: 0.8, c: 0.09, h })
}

export function renderLCToContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hue: number,
) {
  ctx.clearRect(0, 0, width, height)

  const data = new Uint8ClampedArray(width * height * 4)

  let blockIndex = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = getRGBPixel(x / width, y / height, hue)
      const dataColor: [number, number, number, number] = color
        ? [
            Math.floor(color.r * 255),
            Math.floor(color.g * 255),
            Math.floor(color.b * 255),
            255,
          ]
        : [0, 0, 0, 0]

      const startIndex = blockIndex * 4

      data[startIndex] = dataColor[0]
      data[startIndex + 1] = dataColor[1]
      data[startIndex + 2] = dataColor[2]
      data[startIndex + 3] = dataColor[3]

      blockIndex++
    }
  }

  const imageData = new ImageData(data, width)
  ctx.putImageData(imageData, 0, 0)
}

export function renderHueToContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)

  const data = new Uint8ClampedArray(width * height * 4)

  let blockIndex = 0
  for (let y = 0; y < height; y++) {
    const color = getHuePixel((y / height) * 360)

    for (let x = 0; x < width; x++) {
      const startIndex = blockIndex * 4

      data[startIndex] = Math.floor(color.r * 255)
      data[startIndex + 1] = Math.floor(color.g * 255)
      data[startIndex + 2] = Math.floor(color.b * 255)
      data[startIndex + 3] = 255

      blockIndex++
    }
  }

  const imageData = new ImageData(data, width)
  ctx.putImageData(imageData, 0, 0)
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill?: string,
  strokeOptions?: { stroke: string; strokeWidth: number },
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (strokeOptions) {
    const { stroke, strokeWidth } = strokeOptions
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}
