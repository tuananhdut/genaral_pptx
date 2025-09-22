import { Router } from 'express'

import { PptxController } from '@/controllers/pttx.controller'

const pptxRouter = Router()

pptxRouter.get('/genaral', PptxController.generate)

export default pptxRouter
