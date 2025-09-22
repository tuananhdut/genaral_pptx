import { Router } from 'express'

import pptxRouter from './pptx.route'

const routes = Router()

routes.use('/pttx', pptxRouter)

export default routes
