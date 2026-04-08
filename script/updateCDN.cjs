const { existsSync, copySync } = require('fs-extra');

const src = 'test/dist/a/monacoeditorwork';
const dest = 'cdn';

if (!existsSync(src)) {
  console.log('[copy:cdn] skip, source not found:', src);
  process.exit(0);
}

copySync(src, dest, {});
console.log('[copy:cdn] success, copied from', src, 'to', dest);
