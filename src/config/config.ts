import dotenv from 'dotenv'

dotenv.config()

export const ENV = process.env.NODE_ENV ?? 'development'

export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000'
export const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || '/uploads'
