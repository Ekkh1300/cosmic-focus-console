import { copyFile, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Put the single-file build where it is easy to find and double-click:
 *   E:\ty\کیهان.html
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'dist-single', 'index.html')
const target = path.join(root, 'کیهان.html')

const info = await stat(source)
const raw = await import('node:fs/promises').then((fs) => fs.readFile(source))
await copyFile(source, target)

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
console.log(`✓ single file : ${target}`)
console.log(`  size        : ${kb(info.size)}`)
console.log(`  gzip        : ${kb(gzipSync(raw).length)}`)
