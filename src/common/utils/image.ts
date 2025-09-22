import fs from 'fs'
import sizeOf from 'image-size'

import { ApiError } from '../responses'

export function getImageSize(filePath: string): { width: number; height: number } {
  const buffer = fs.readFileSync(filePath)
  const dimensions = sizeOf(buffer)
  if (!dimensions.width || !dimensions.height) throw ApiError.internal('Cannot get image dimensions')
  return { width: dimensions.width, height: dimensions.height }
}
