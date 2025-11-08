/**
 * Parser Profiling Benchmarks
 *
 * Detailed profiling to identify performance bottlenecks.
 */

import { bench, describe } from 'vitest'
import { IncrementalMarkdownParser } from '../src/parsers/markdown/index.js'

// Test document
const testDoc = `# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

Another paragraph with [a link](https://example.com) and \`inline code\`.

### Heading 3

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const x = 1
const y = 2
console.log(x + y)
\`\`\`

> Blockquote with **emphasis**

---

More text here.
`

const mediumDoc = Array(50).fill(testDoc).join('\n\n')

describe('Profiling: Component Breakdown', () => {
  bench('Full parse (baseline)', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(mediumDoc)
  })

  bench('Tokenizer only', () => {
    const parser = new IncrementalMarkdownParser()
    // @ts-ignore - accessing private for profiling
    parser.tokenizer.tokenize(mediumDoc)
  })

  bench('Parser only (pre-tokenized)', () => {
    const parser = new IncrementalMarkdownParser()
    // @ts-ignore
    const tokens = parser.tokenizer.tokenize(mediumDoc)
    // @ts-ignore
    parser.buildTree(tokens, mediumDoc)
  })
})

describe('Profiling: Tokenizer Patterns', () => {
  const lines = mediumDoc.split('\n')
  const parser = new IncrementalMarkdownParser()

  bench('Heading detection', () => {
    for (const line of lines) {
      line.match(/^(#{1,6})\s+(.+)$/)
    }
  })

  bench('List item detection', () => {
    for (const line of lines) {
      line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/)
    }
  })

  bench('Blockquote detection', () => {
    for (const line of lines) {
      line.trim().startsWith('>')
    }
  })

  bench('Horizontal rule detection', () => {
    for (const line of lines) {
      /^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())
    }
  })
})

describe('Profiling: String Operations', () => {
  const lines = mediumDoc.split('\n')

  bench('String split', () => {
    mediumDoc.split('\n')
  })

  bench('String trim (all lines)', () => {
    for (const line of lines) {
      line.trim()
    }
  })

  bench('String trimStart (all lines)', () => {
    for (const line of lines) {
      line.trimStart()
    }
  })

  bench('String slice (all lines)', () => {
    for (const line of lines) {
      line.slice(0, 10)
    }
  })
})

describe('Profiling: Inline Tokenizer', () => {
  const parser = new IncrementalMarkdownParser()
  const sampleText = 'This is **bold** and *italic* with `code` and [link](url)'

  bench('Inline tokenize', () => {
    // @ts-ignore
    parser.inlineTokenizer.tokenize(sampleText, 0, 0)
  })

  bench('Emphasis detection', () => {
    sampleText.indexOf('*')
  })

  bench('Code detection', () => {
    sampleText.indexOf('`')
  })

  bench('Link detection', () => {
    sampleText.indexOf('[')
  })
})

describe('Profiling: Object Creation', () => {
  bench('Create token objects', () => {
    const tokens = []
    for (let i = 0; i < 1000; i++) {
      tokens.push({
        type: 'heading',
        depth: 1,
        text: 'Hello',
        raw: '# Hello',
        position: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 7, offset: 7 },
        },
      })
    }
  })

  bench('Create position objects', () => {
    const positions = []
    for (let i = 0; i < 1000; i++) {
      positions.push({
        line: i,
        column: 0,
        offset: i * 10,
      })
    }
  })
})
