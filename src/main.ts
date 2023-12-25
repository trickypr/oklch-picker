import {
  drawCircle,
  getClLocation,
  getLCPixel,
  inRgb,
  renderHueToContext,
  renderLCToContext,
  rgbConvertor,
} from './images.ts'
import type { Oklch } from 'culori/fn'

const DEFAULT_HUE_WIDTH = 20
const DEFAULT_HEIGHT = 200
const DEFAULT_WIDTH = DEFAULT_HEIGHT + DEFAULT_HUE_WIDTH

const DEFAULT_HUE_WIDTH_STRING = DEFAULT_HUE_WIDTH.toString()
const DEFAULT_HEIGHT_STRING = DEFAULT_HEIGHT.toString()
const DEFAULT_WIDTH_STRING = DEFAULT_WIDTH.toString()

class OklchPicker extends HTMLElement {
  static observedAttributes = ['l', 'c', 'h', 'width', 'height', 'hueWidth']

  l: number = 0
  c: number = 0
  h: number = 0

  private internalUpdate = false

  private clCanvas?: HTMLCanvasElement
  private clContext?: CanvasRenderingContext2D

  private hCanvas?: HTMLCanvasElement
  private hContext?: CanvasRenderingContext2D

  constructor() {
    super()
  }

  connectedCallback() {
    // Skip recalls. Can cause some really obscure errors, Although I am not sure if those errors are actually a
    // problem
    if (this.clCanvas && this.hCanvas) return

    const shadow = this.attachShadow({ mode: 'open' })

    this.clCanvas = document.createElement('canvas')
    this.hCanvas = document.createElement('canvas')
    shadow.append(this.clCanvas, this.hCanvas)

    this.clContext = this.clCanvas.getContext('2d')!
    this.hContext = this.hCanvas.getContext('2d')!

    this.clCanvas.addEventListener('mousedown', (e) =>
      this.updateLc(e.offsetX, e.offsetY),
    )
    this.clCanvas.addEventListener(
      'mousemove',
      (e) => e.buttons === 1 && this.updateLc(e.offsetX, e.offsetY),
    )

    this.hCanvas.addEventListener('mousedown', (e) => this.updateHue(e.offsetY))
    this.hCanvas.addEventListener(
      'mousemove',
      (e) => e.buttons === 1 && this.updateHue(e.offsetY),
    )

    this.setDimensions()
    this.getColorsFromProperties()
    this.render()
  }

  attributeChangedCallback() {
    if (this.internalUpdate) return

    this.setDimensions()
    this.getColorsFromProperties()
    this.render()
  }

  private calculateDimensions() {
    const width = parseInt(this.getAttribute('width') || DEFAULT_WIDTH_STRING)
    const height = parseInt(
      this.getAttribute('height') || DEFAULT_HEIGHT_STRING,
    )
    const hueWidth = parseInt(
      this.getAttribute('hueWidth') || DEFAULT_HUE_WIDTH_STRING,
    )
    const clWidth = width - hueWidth

    return { height, hueWidth, clWidth }
  }

  private getPosition(height: number) {
    const { x: clX, y: clY } = getClLocation(this.c, this.l)
    const hY = (this.h * height) / 360
    return { clX, clY, hY }
  }

  private getColorsFromProperties() {
    this.l = parseFloat(this.getAttribute('l') || this.l.toString())
    this.c = parseFloat(this.getAttribute('c') || this.c.toString())
    this.h = parseFloat(this.getAttribute('h') || this.h.toString())
  }

  private setDimensions() {
    const { height, hueWidth, clWidth } = this.calculateDimensions()

    this.hCanvas?.setAttribute('width', hueWidth.toString())
    this.hCanvas?.setAttribute('height', height.toString())

    this.clCanvas?.setAttribute('width', clWidth.toString())
    this.clCanvas?.setAttribute('height', height.toString())
  }

  private render() {
    if (!this.clContext || !this.hContext) return

    const { height, hueWidth, clWidth } = this.calculateDimensions()
    const hue = this.h

    renderLCToContext(this.clContext, clWidth, height, hue)
    renderHueToContext(this.hContext, hueWidth, height)
    this.renderSelector(clWidth, hueWidth, height)
  }

  private renderSelector(clWidth: number, hueWidth: number, height: number) {
    if (!this.clContext || !this.hContext) return
    const { clX, clY, hY } = this.getPosition(height)

    drawCircle(
      this.clContext,
      clX * clWidth - 2,
      clY * height - 2,
      4,
      undefined,
      { stroke: this.l > 0.5 ? 'black' : 'white', strokeWidth: 1 },
    )

    this.hContext.strokeStyle = 'black'
    this.hContext.lineWidth = 1
    this.hContext.rect(0, hY - 2, hueWidth, 4)
    this.hContext.stroke()
  }

  private updateLc(x: number, y: number) {
    const { height, clWidth } = this.calculateDimensions()
    const { c, l } = getLCPixel(x / clWidth, y / height)

    const color: Oklch = { mode: 'oklch', l, c, h: this.h }
    const rgb = rgbConvertor(color)
    if (!inRgb(rgb)) return

    this.c = c
    this.l = l

    this.internalUpdate = true
    this.setAttribute('c', this.c.toString())
    this.setAttribute('l', this.l.toString())
    this.internalUpdate = false

    const event = new CustomEvent('color', { detail: { c, l, h: this.h } })
    this.dispatchEvent(event)

    this.render()
  }

  private updateHue(y: number) {
    const { height } = this.calculateDimensions()
    const hue = (y / height) * 360

    this.setAttribute('h', hue.toString())

    const event = new CustomEvent('color', {
      detail: { h: hue, c: this.c, l: this.l },
    })
    this.dispatchEvent(event)
  }
}

customElements.define('oklch-picker', OklchPicker)
