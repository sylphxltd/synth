/**
 * Markdown Parser Benchmarks
 *
 * Compare Synth's incremental Markdown parser against remark/unified.
 *
 * Goal: Demonstrate 50-100x faster parsing and 10-100x faster incremental parsing.
 */

import { bench, describe } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { IncrementalMarkdownParser, parseMarkdown } from '../src/parsers/markdown/index.js'

// Test documents of various sizes
const smallDoc = `# Hello World

This is a small document with some **bold** text and *italic* text.

- Item 1
- Item 2
- Item 3

> A quote

\`\`\`js
const x = 1
\`\`\`
`

const mediumDoc = Array(50)
  .fill(smallDoc)
  .join('\n\n---\n\n')

const largeDoc = Array(200)
  .fill(smallDoc)
  .join('\n\n---\n\n')

// Remark processor
const remarkProcessor = unified().use(remarkParse)

describe('Markdown Parser - Small Document (~100 lines)', () => {
  bench('Synth parse', () => {
    parseMarkdown(smallDoc)
  })

  bench('Remark parse', () => {
    remarkProcessor.parse(smallDoc)
  })
})

describe('Markdown Parser - Medium Document (~500 lines)', () => {
  bench('Synth parse', () => {
    parseMarkdown(mediumDoc)
  })

  bench('Remark parse', () => {
    remarkProcessor.parse(mediumDoc)
  })
})

describe('Markdown Parser - Large Document (~2000 lines)', () => {
  bench('Synth parse', () => {
    parseMarkdown(largeDoc)
  })

  bench('Remark parse', () => {
    remarkProcessor.parse(largeDoc)
  })
})

describe('Incremental Parsing - Medium Document', () => {
  const parser = new IncrementalMarkdownParser()
  parser.parse(mediumDoc)

  bench('Synth incremental (1% edit)', () => {
    const editedDoc = mediumDoc.replace('Hello World', 'Hello Synth')
    parser.parseIncremental(editedDoc, {
      startByte: 2,
      oldEndByte: 13,
      newEndByte: 13,
      startPosition: { line: 0, column: 2, offset: 2 },
      oldEndPosition: { line: 0, column: 13, offset: 13 },
      newEndPosition: { line: 0, column: 13, offset: 13 },
    })
  })

  bench('Remark full re-parse (1% edit)', () => {
    const editedDoc = mediumDoc.replace('Hello World', 'Hello Synth')
    remarkProcessor.parse(editedDoc)
  })
})

describe('Incremental Parsing - Large Document', () => {
  const parser = new IncrementalMarkdownParser()
  parser.parse(largeDoc)

  bench('Synth incremental (0.1% edit)', () => {
    const editedDoc = largeDoc.replace('Hello World', 'Hello Synth')
    parser.parseIncremental(editedDoc, {
      startByte: 2,
      oldEndByte: 13,
      newEndByte: 13,
      startPosition: { line: 0, column: 2, offset: 2 },
      oldEndPosition: { line: 0, column: 13, offset: 13 },
      newEndPosition: { line: 0, column: 13, offset: 13 },
    })
  })

  bench('Remark full re-parse (0.1% edit)', () => {
    const editedDoc = largeDoc.replace('Hello World', 'Hello Synth')
    remarkProcessor.parse(editedDoc)
  })
})

describe('Real-world Scenario: Live Preview', () => {
  const doc = mediumDoc

  bench('Synth (10 incremental edits)', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(doc)

    for (let i = 0; i < 10; i++) {
      const editedDoc = doc.replace('Hello World', `Hello World ${i}`)
      parser.parseIncremental(editedDoc, {
        startByte: 2,
        oldEndByte: 13,
        newEndByte: 13 + String(i).length,
        startPosition: { line: 0, column: 2, offset: 2 },
        oldEndPosition: { line: 0, column: 13, offset: 13 },
        newEndPosition: { line: 0, column: 13 + String(i).length, offset: 13 + String(i).length },
      })
    }
  })

  bench('Remark (10 full re-parses)', () => {
    for (let i = 0; i < 10; i++) {
      const editedDoc = doc.replace('Hello World', `Hello World ${i}`)
      remarkProcessor.parse(editedDoc)
    }
  })
})

describe('Real-world Scenario: Typing Simulation', () => {
  const doc = '# Hello\n\nWorld'

  bench('Synth (add 100 characters)', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(doc)

    let currentDoc = doc
    for (let i = 0; i < 100; i++) {
      currentDoc += 'x'
      parser.parseIncremental(currentDoc, {
        startByte: doc.length + i,
        oldEndByte: doc.length + i,
        newEndByte: doc.length + i + 1,
        startPosition: { line: 2, column: 5 + i, offset: doc.length + i },
        oldEndPosition: { line: 2, column: 5 + i, offset: doc.length + i },
        newEndPosition: { line: 2, column: 6 + i, offset: doc.length + i + 1 },
      })
    }
  })

  bench('Remark (add 100 characters)', () => {
    let currentDoc = doc
    for (let i = 0; i < 100; i++) {
      currentDoc += 'x'
      remarkProcessor.parse(currentDoc)
    }
  })
})
