import cors from 'cors'
import type { Application, Request, Response, NextFunction } from 'express'
import express from 'express'
import http from 'http'
import { StatusCodes } from 'http-status-codes'
import morgan from 'morgan'
import path from 'path'

import { errorHandler } from '@/common/middleware/error-handling.middleware'
import { ENV } from '@/config/config'

import { ApiError } from '../common/responses/api-error'
import routes from '../routes/index'

class App {
  public app: Application
  public server: http.Server
  private socketClients: Map<number, string>

  constructor() {
    this.app = express()
    this.server = http.createServer(this.app)
    this.socketClients = new Map()
    this.plugins()
    this.routes()
    this.catchError()
  }

  private routes(): void {
    this.app.use('/api', routes)
    this.app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))
  }

  private plugins(): void {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(cors())
    if (ENV === 'development') {
      this.app.use(morgan('dev'))
    } else if (ENV === 'production') {
      this.app.use(morgan('combined'))
    }
  }

  private catchError(): void {
    this.app.all('*', (req: Request, res: Response, next: NextFunction) => {
      next(new ApiError(StatusCodes.NOT_FOUND, `Can't find ${req.originalUrl} on this server!`))
    })
    this.app.use(errorHandler)
  }
}

export default new App().app
