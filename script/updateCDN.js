import { existsSync, copySync } from 'fs-extra'

const src = 'test/dist/a/monacoeditorwork'
const dest = 'cdn'

if (!existsSync(src)) {
  console.log('[copy:cdn] skip, source not found:', src)
  process.exit(0)
}

copySync(src, dest, {})
