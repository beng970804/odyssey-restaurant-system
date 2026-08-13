import { writeFileSync } from 'node:fs'
import { createApp, OPENAPI_INFO } from '../src/app'
import { registerAllRoutes } from '../src/routes'

const app = createApp()
registerAllRoutes(app)

const doc = app.getOpenAPI31Document(OPENAPI_INFO)
writeFileSync(new URL('../openapi.json', import.meta.url), JSON.stringify(doc, null, 2) + '\n')

console.log('wrote openapi.json')
