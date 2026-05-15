import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const standaloneDir = join(root, '.next', 'standalone')
const nextStaticDir = join(root, '.next', 'static')
const publicDir = join(root, 'public')
const standaloneNextStaticDir = join(standaloneDir, '.next', 'static')
const standalonePublicDir = join(standaloneDir, 'public')
const hostingerPublicHtmlDir = join(root, '..', 'public_html')
const hostingerNextStaticDir = join(hostingerPublicHtmlDir, '_next', 'static')
const hostingerStaticDir = join(hostingerPublicHtmlDir, 'static')

function copyDirectory(from, to) {
  if (!existsSync(from)) return false
  rmSync(to, { recursive: true, force: true })
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true })
  return true
}

copyDirectory(nextStaticDir, standaloneNextStaticDir)
copyDirectory(publicDir, standalonePublicDir)

if (existsSync(hostingerPublicHtmlDir)) {
  copyDirectory(nextStaticDir, hostingerNextStaticDir)
  copyDirectory(nextStaticDir, hostingerStaticDir)
  copyDirectory(publicDir, hostingerPublicHtmlDir)
}

console.log('Hostinger static assets prepared.')
