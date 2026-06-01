// Shared helpers for the build-time data pipeline.
import { createWriteStream, existsSync, statSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const RAW = join(ROOT, 'raw')
export const DATA = join(ROOT, 'src', 'data')
mkdirSync(RAW, { recursive: true })
mkdirSync(DATA, { recursive: true })

// Download a URL to raw/<name>, skipping if already present and non-empty.
export async function download(url, name) {
  const dest = join(RAW, name)
  if (existsSync(dest) && statSync(dest).size > 0) {
    console.log(`  cached  ${name} (${(statSync(dest).size / 1e6).toFixed(1)} MB)`)
    return dest
  }
  console.log(`  fetch   ${url}`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
  console.log(`  saved   ${name} (${(statSync(dest).size / 1e6).toFixed(1)} MB)`)
  return dest
}

// Diacritic-insensitive, lowercased normalization for the search index.
export function norm(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export async function writeJSON(name, obj) {
  const dest = join(DATA, name)
  const text = JSON.stringify(obj)
  await writeFile(dest, text)
  console.log(`  wrote   src/data/${name} (${(text.length / 1e6).toFixed(2)} MB)`)
  return dest
}
