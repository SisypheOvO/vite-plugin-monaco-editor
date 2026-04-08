import { Connect, ResolvedConfig } from 'vite'
import { getWorks, IMonacoEditorOpts, isCDN, resolveMonacoPath } from './index.js'
import { IWorkerDefinition, languageWorksByLabel } from './languageWork.js'
import { build } from 'rolldown'
import * as fs from 'fs'
import * as path from 'path'

export function getFilenameByEntry(entry: string) {
  entry = path.basename(entry, 'js')
  return entry + '.bundle.js'
}

export const cacheDir = 'node_modules/.monaco/'

export async function bundleWorker(entry: string): Promise<void> {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  const outfile = cacheDir + getFilenameByEntry(entry)

  await build({
    input: resolveMonacoPath(entry),
    output: {
      file: outfile,
      format: 'iife',
    },
  })
}

export function getWorkPath(
  works: IWorkerDefinition[],
  options: IMonacoEditorOpts,
  config: ResolvedConfig
) {
  const workerPaths: Record<string, string> = {}

  const publicPath = options.publicPath ?? 'monacoeditorwork'

  for (const work of works) {
    if (isCDN(publicPath)) {
      workerPaths[work.label] = publicPath + '/' + getFilenameByEntry(work.entry)
    } else {
      workerPaths[work.label] = config.base + publicPath + '/' + getFilenameByEntry(work.entry)
    }
  }

  if (workerPaths['typescript']) {
    // javascript shares the same worker
    workerPaths['javascript'] = workerPaths['typescript']
  }
  if (workerPaths['css']) {
    // scss and less share the same worker
    workerPaths['less'] = workerPaths['css']
    workerPaths['scss'] = workerPaths['css']
  }
  if (workerPaths['html']) {
    // handlebars, razor and html share the same worker
    workerPaths['handlebars'] = workerPaths['html']
    workerPaths['razor'] = workerPaths['html']
  }

  return workerPaths
}

export function workerMiddleware(
  middlewares: Connect.Server,
  config: ResolvedConfig,
  options: IMonacoEditorOpts
): void {
  const works = getWorks(options)
  // clear cacheDir

  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true })
  }

  for (const work of works) {
    middlewares.use(
      config.base + options.publicPath + '/' + getFilenameByEntry(work.entry),
      function (req, res, next) {
        const filename = cacheDir + getFilenameByEntry(work.entry)

        const send = () => {
          try {
            const contentBuffer = fs.readFileSync(filename)
            res.setHeader('Content-Type', 'text/javascript')
            res.end(contentBuffer)
          } catch (err) {
            next(err)
          }
        }

        if (fs.existsSync(filename)) {
          return send()
        }

        bundleWorker(work.entry)
          .then(send)
          .catch((err) => next(err))
      }
    )
  }
}
