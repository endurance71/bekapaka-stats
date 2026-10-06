import { cp, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
const site = process.cwd()
if (existsSync(path.join(site, '.env.local'))) process.loadEnvFile(path.join(site, '.env.local'))
const port = process.env.SITE_PREVIEW_PORT || '3100'
const env = {
  ...process.env,
  SITE_BASE_URL: `http://127.0.0.1:${port}`,
  SITE_MEDIA_PREVIEW: '1',
  SITE_BACKEND_API_URL: process.env.SITE_PREVIEW_BACKEND_URL || 'https://panel.bekapaka.pl',
  PORT: port,
  HOSTNAME: '127.0.0.1'
}
const build = spawn('npm', ['run', 'build'], { cwd: site, env, stdio: 'inherit' })
const code = await new Promise((resolve) => build.on('exit', resolve))
if (code) process.exit(Number(code))
const output = path.join(site, '.next/standalone/site')
await mkdir(path.join(output, '.next'), { recursive: true })
await cp(path.join(site, 'public'), path.join(output, 'public'), { recursive: true })
await cp(path.join(site, '.next/static'), path.join(output, '.next/static'), { recursive: true })
const server = spawn(process.execPath, [path.join(output, 'server.js')], {
  cwd: output,
  env,
  stdio: 'inherit'
})
process.on('SIGINT', () => server.kill('SIGINT'))
process.on('SIGTERM', () => server.kill('SIGTERM'))
server.on('exit', (code) => process.exit(code || 0))
