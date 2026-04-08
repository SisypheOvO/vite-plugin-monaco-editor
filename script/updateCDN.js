const fse = require('fs-extra')

const src = 'test/dist/a/monacoeditorwork'
const dest = 'cdn'

if (!fse.existsSync(src)) {
  console.log('[copy:cdn] skip, source not found:', src)
  process.exit(0)
}

fse.copySync(src, dest, {})
