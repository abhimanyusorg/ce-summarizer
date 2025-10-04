import '@testing-library/jest-dom'
import fetchMock from 'jest-fetch-mock'
import { config } from 'dotenv'
import path from 'path'
import { TextEncoder, TextDecoder } from 'util'

// Load environment variables from .env.local for integration tests
config({ path: path.resolve(process.cwd(), '.env.local') })

fetchMock.enableMocks()

// Polyfills for integration tests
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}