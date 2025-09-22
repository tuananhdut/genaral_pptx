import PptxGenJS from 'pptxgenjs'

import { getImageSize } from '@/common/utils/image'

import { GridManager } from './pptx-grid.service'

export interface ProductOption {
  option_name: string
  option_image: string
}

export interface Product {
  main_image: string
  title: string
  description: string
  options?: ProductOption[]
}

export interface PptxData {
  drawing_image?: string
  title: string
  description: string
  products: Product[]
}

export interface PptxOptions {
  name?: string
  width?: number
  height?: number
  cols?: number
  rows?: number
  gapX?: number
  gapY?: number
}

const defaultOptions: Required<PptxOptions> = {
  name: 'custom',
  width: 10,
  height: 7.5,
  cols: 4,
  rows: 4,
  gapX: 0.3,
  gapY: 0.3
}

export class PptxService {
  private pptx!: PptxGenJS
  private gridManager!: GridManager
  private options: Required<PptxOptions>

  constructor(options: PptxOptions = {}) {
    this.options = { ...defaultOptions, ...options }
    this.resetPptx()
  }

  private calcImageFit(imgWidth: number, imgHeight: number, blockWidth: number, blockHeight: number) {
    if (!imgWidth || !imgHeight) return { w: blockWidth, h: blockHeight }
    let w = blockWidth
    let h = blockWidth * (imgHeight / imgWidth)
    if (h > blockHeight) {
      h = blockHeight
      w = blockHeight * (imgWidth / imgHeight)
    }
    return { w, h }
  }

  resetPptx() {
    this.pptx = new PptxGenJS()
    this.pptx.defineLayout({ name: this.options.name, width: this.options.width, height: this.options.height })
    this.pptx.layout = this.options.name
    this.gridManager = new GridManager({
      rows: this.options.rows,
      cols: this.options.cols,
      width: this.options.width,
      height: this.options.height,
      gapX: this.options.gapX,
      gapY: this.options.gapY
    })
  }

  createSlide(debug = false) {
    const slide = this.pptx.addSlide()
    this.gridManager.reset()
    if (debug) this.gridManager.addGridDebug(slide)
    return slide
  }

  addTitle(slide: PptxGenJS.Slide, title: string) {
    slide.addText(title, {
      x: this.options.gapX / 2,
      y: 0,
      fontSize: 12,
      bold: true,
      autoFit: true,
      valign: 'top',
      align: 'left',
      h: this.options.gapY
    })
  }

  addDrawingImage(slide: PptxGenJS.Slide, imagePath: string, rowspan: number, colspan: number) {
    const { width, height } = getImageSize(imagePath)

    this.gridManager.occupy(0, 0, rowspan, colspan)
    const { x, y, w, h } = this.gridManager.calcBlockPosition(0, 0, rowspan, colspan)

    const aspect = width / height
    let imgW = w
    let imgH = w / aspect
    if (imgH > h) {
      imgH = h
      imgW = h * aspect
    }

    const offsetX = x + (w - imgW) / 2
    const offsetY = y + (h - imgH) / 2

    slide.addImage({ path: imagePath, x: offsetX, y: offsetY, w: imgW, h: imgH })
  }

  async exportFile(fileName: string) {
    await this.pptx.writeFile({ fileName })
  }

  addProduct(slide: PptxGenJS.Slide, product: Product, row: number, col: number) {
    const { width, height } = getImageSize(product.main_image)
    this.gridManager.occupy(row, col)

    const { x, y, w, h } = this.gridManager.calcBlockPosition(row, col)
    const { w: imgW, h: imgH } = this.calcImageFit(width, height, w, h)

    const offsetX = x
    const offsetY = y + h - imgH

    slide.addImage({ path: product.main_image, x: offsetX, y: offsetY, w: imgW, h: imgH })

    // add title, description
    slide.addText(
      [
        { text: product.title + '\n', options: { fontSize: 10, bold: true } },
        { text: product.description, options: { fontSize: 8, color: '666666' } }
      ],
      {
        x: x,
        y: y + h,
        w: w,
        valign: 'top',
        align: 'left',
        margin: 0,
        autoFit: true
      }
    )
  }

  addOption(
    slide: PptxGenJS.Slide,
    options: ProductOption[],
    row: number,
    col: number,
    sub_cols = 4,
    sub_rows = 2,
    gapX = 0.05,
    gapY = 0.05
  ) {
    const { x: cellX, y: cellY, w: cellW, h: cellH } = this.gridManager.calcBlockPosition(row, col)

    const optionW = (cellW - (sub_cols - 1) * gapX) / sub_cols
    const optionH = (cellH - (sub_rows - 1) * gapY) / sub_rows

    for (let idx = 0; idx < Math.min(options.length, sub_cols * sub_rows); idx++) {
      const option = options[idx]
      const r = Math.floor(idx / sub_cols)
      const c = idx % sub_cols

      const optX = cellX + c * (optionW + gapX)
      const optY = cellY + r * (optionH + gapY)

      // --- Thêm ảnh ---
      let imgH = 0
      if (option.option_image) {
        const { width, height } = getImageSize(option.option_image)
        const { w: imgW, h } = this.calcImageFit(width, height, optionW, optionH)
        imgH = h
        const offsetX = optX
        const offsetY = optY
        slide.addImage({ path: option.option_image, x: offsetX, y: offsetY, w: imgW, h: imgH })
      }

      // --- Thêm text trên ảnh ---
      const textH = optionH - imgH - 0.01
      slide.addText(option.option_name, {
        x: optX,
        y: optY + imgH + 0.01,
        w: optionW,
        h: textH,
        fontSize: 7,
        bold: true,
        color: '000000',
        align: 'left',
        valign: 'top',
        margin: 0,
        autoFit: true
      })
    }

    this.gridManager.occupy(row, col)
  }

  async generateFromData(data: PptxData): Promise<Buffer> {
    console.time('PPTX Generation')

    this.resetPptx()
    let slide = this.createSlide()
    if (data.drawing_image) {
      this.addTitle(slide, `${data.title}${data.description ? ' - ' + data.description : ''}`)
      this.addDrawingImage(slide, data.drawing_image, 2, 2)
    }

    for (const product of data.products) {
      let rowsSpan = 1
      if (product.options && product.options.length > 0) {
        rowsSpan = 2
      }
      let position = this.gridManager.findFreeSpot(1, rowsSpan)
      if (!position) {
        slide = this.createSlide()
        this.gridManager.reset()
        if (data.drawing_image) {
          this.addTitle(slide, `${data.title}${data.description ? ' - ' + data.description : ''}`)
          this.addDrawingImage(slide, data.drawing_image, 2, 2)
        }
        position = this.gridManager.findFreeSpot(1, rowsSpan)
      }
      const { row, col } = position!
      this.addProduct(slide, product, row, col)
      if (product.options && product.options.length > 0) {
        this.addOption(slide, product.options, row, col + 1)
      }
    }
    console.timeEnd('PPTX Generation')

    return this.pptx.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
  }

  async generateDemo(): Promise<Buffer> {
    const slide = this.createSlide()
    this.addTitle(slide, 'Demo Slide  ')
    await this.addDrawingImage(slide, 'uploads/image_2mb.jpg', 1, 1)

    const buffer = await this.pptx.write({
      outputType: 'nodebuffer'
    })

    return buffer as Buffer
  }
}
