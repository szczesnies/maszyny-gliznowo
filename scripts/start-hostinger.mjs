import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'

const standaloneServer = '.next/standalone/server.js'
const command = existsSync(standaloneServer)
  ? ['node', [standaloneServer]]
  : [process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'start']]

const child = spawn(command[0], command[1], {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
