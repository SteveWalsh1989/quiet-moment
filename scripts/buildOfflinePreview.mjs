import { readFile, readdir, writeFile } from 'node:fs/promises'
import { log } from 'node:console'
import { URL } from 'node:url'

const output = new URL('../dist/', import.meta.url)
const html = await readFile(new URL('index.html', output), 'utf8')
const scriptTag = html.match(/<script\b[^>]+src="([^"]+)"[^>]*><\/script>/)
const stylesheetTag = html.match(/<link\b[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/)
if (!scriptTag || !stylesheetTag)
  throw new Error('Expected a Vite script and stylesheet in dist/index.html.')

async function inlineAsset(url, format) {
  const contents = await readFile(url)
  return `data:${format};base64,${contents.toString('base64')}`
}

const audioDirectory = new URL('audio/', output)
const audioFiles = (await readdir(audioDirectory)).filter((name) => name.endsWith('.wav'))
const sounds = Object.fromEntries(
  await Promise.all(
    audioFiles.map(async (name) => [
      name.slice(0, -4),
      await inlineAsset(new URL(name, audioDirectory), 'audio/wav'),
    ]),
  ),
)
const mark = await inlineAsset(new URL('mark.svg', output), 'image/svg+xml')
const script = (await readFile(new URL(scriptTag[1], output), 'utf8')).replaceAll(
  '</script',
  '<\\/script',
)
const stylesheetUrl = new URL(stylesheetTag[1], output)
let stylesheet = await readFile(stylesheetUrl, 'utf8')
for (const [reference, path] of [...stylesheet.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)]) {
  const font = await inlineAsset(new URL(path, stylesheetUrl), 'font/woff2')
  stylesheet = stylesheet.replaceAll(reference, `url(${font})`)
}

const preview = html
  .replace('./mark.svg', mark)
  .replace(
    scriptTag[0],
    () =>
      `<script>globalThis.quietMomentOffline=${JSON.stringify({ mark, sounds })};</script>\n<script type="module">${script}</script>`,
  )
  .replace(stylesheetTag[0], () => `<style>${stylesheet}</style>`)
await writeFile(new URL('Quiet-Moment.html', output), preview)
log('Wrote dist/Quiet-Moment.html')
