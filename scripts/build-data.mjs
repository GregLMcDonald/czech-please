// Runs the full data pipeline: dictionary, phrases, sentences, grammar.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const steps = ['build-dict.mjs', 'build-phrases.mjs', 'build-sentences.mjs', 'build-grammar.mjs']

for (const s of steps) {
  execFileSync('node', [join(here, s)], { stdio: 'inherit' })
}
console.log('\n✓ All data built into src/data/')
