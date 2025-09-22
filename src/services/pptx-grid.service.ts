import pptxgen from 'pptxgenjs'

interface GridOptions {
  rows: number
  cols: number
  width: number
  height: number
  gapX: number
  gapY: number
}

export class GridManager {
  private grid: number[][]
  private width: number
  private height: number
  private cols: number
  private rows: number
  private gapX: number
  private gapY: number

  constructor({ width = 10, height = 7.5, cols = 4, rows = 4, gapX = 0.3, gapY = 0.3 }: GridOptions) {
    this.width = width
    this.height = height
    this.cols = cols
    this.rows = rows
    this.gapX = gapX
    this.gapY = gapY
    this.grid = this.createGrid()
  }

  private createGrid(): number[][] {
    return Array.from({ length: this.rows }, () => Array(this.cols).fill(0))
  }

  reset(): void {
    this.grid = this.createGrid()
  }

  isFree(row: number, col: number, rowspan: number = 1, colspan: number = 1): boolean {
    for (let r = row; r < row + rowspan; r++) {
      for (let c = col; c < col + colspan; c++) {
        if (r >= this.rows || c >= this.cols || this.grid[r][c] === 1) return false
      }
    }
    return true
  }

  occupy(row: number, col: number, rowspan: number = 1, colspan: number = 1): void {
    for (let r = row; r < row + rowspan; r++) {
      for (let c = col; c < col + colspan; c++) {
        if (r < this.rows && c < this.cols) this.grid[r][c] = 1
      }
    }
  }

  findFreeSpot(rowspan: number, colspan: number): { row: number; col: number } | null {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.isFree(r, c, rowspan, colspan)) {
          this.occupy(r, c, rowspan, colspan)
          return { row: r, col: c }
        }
      }
    }
    return null
  }

  calcBlockSize() {
    const blockW = (this.width - this.gapX * (this.cols + 1)) / this.cols
    const blockH = (this.height - this.gapY * (this.rows + 1)) / this.rows
    return { blockW, blockH }
  }

  calcBlockPosition(row: number, col: number, rowspan: number = 1, colspan: number = 1) {
    const { blockW, blockH } = this.calcBlockSize()

    const x = this.gapX + col * (blockW + this.gapX)
    const y = this.gapY + row * (blockH + this.gapY)
    const w = blockW * colspan + this.gapX * (colspan - 1)
    const h = blockH * rowspan + this.gapY * (rowspan - 1)

    return { x, y, w, h }
  }

  isFull(): boolean {
    return this.grid.every((row) => row.every((cell) => cell === 1))
  }

  nextSlide() {
    this.reset()
  }

  addGridDebug(slide: pptxgen.Slide) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const { x, y, w, h } = this.calcBlockPosition(r, c, 1, 1)
        const isUsed = this.grid[r][c] === 1

        slide.addShape('rect', {
          x,
          y,
          w,
          h,
          line: { color: '999999', width: 1 },
          fill: { color: isUsed ? 'FFCCCC' : 'FFFFFF' }
        })

        slide.addText(`${r},${c}`, {
          x,
          y,
          w,
          h,
          fontSize: 8,
          color: 'FF0000',
          align: 'center',
          valign: 'middle'
        })
      }
    }
  }
}
