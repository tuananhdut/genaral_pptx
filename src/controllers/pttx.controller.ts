import { Request, Response } from 'express'
import { PassThrough } from 'stream'

import { PptxService } from '@/services/pptx.service'

function generateMockData() {
  const products = Array.from({ length: 20 }, (_, k) => {
    const options =
      Math.random() < 0.5
        ? []
        : Array.from({ length: Math.floor(Math.random() * 8) + 1 }, (_, j) => ({
            option_name: `Opt ddddđ ddddd dddđ ddddd${j + 1}`,
            option_image: 'uploads/image_2mb.jpg'
          }))

    return {
      main_image: 'uploads/image_2mb.jpg',
      title: `Sản phẩm 01-${k + 1}`,
      description: `Mô tả sản phẩm 01-${k + 1}`,
      options
    }
  })

  return {
    drawing_image: 'uploads/image_2mb.jpg',
    title: 'Sản phẩm 01',
    description: 'Mô tả sản phẩm 01',
    products
  }
}

export class PptxController {
  static async generate(req: Request, res: Response) {
    try {
      const pptxService = new PptxService()
      const data = await generateMockData()

      const buffer = await pptxService.generateFromData(data, '2x4')

      res.setHeader('Content-Disposition', 'attachment; filename=demo.pptx')
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
      const readStream = new PassThrough()
      readStream.end(buffer)
      readStream.pipe(res)
    } catch (error) {
      console.error('Error generating PPTX:', error)
      res.status(500).json({ message: 'Failed to generate PPTX' })
    }
  }
}
