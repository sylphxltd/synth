/**
 * Phase 3 Optimization Benchmarks
 *
 * Tests the performance improvements from:
 * - Node pooling (1.5-2x expected)
 * - Batch processing (2-3x expected)
 * - Incremental parsing (10-100x expected for edits)
 */

import { describe, bench } from 'vitest'
import { UltraOptimizedMarkdownParser } from '../src/parsers/markdown/ultra-optimized-parser.js'
import { BatchTokenizer } from '../src/parsers/markdown/batch-tokenizer.js'
import { IncrementalMarkdownParser, detectEdit } from '../src/parsers/markdown/incremental-parser.js'

// Generate test documents
const smallDoc = `# Small Document

This is a small test document with a few paragraphs.

## Section 1

Some content here.

## Section 2

More content here.
`

const mediumDoc = Array(100)
  .fill(
    `# Heading

This is a paragraph with some **bold** and *italic* text.

## Subheading

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const code = "example"
\`\`\`

`
  )
  .join('\n')

const largeDoc = Array(1000)
  .fill(
    `# Heading

This is a paragraph with some **bold** and *italic* text.

## Subheading

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const code = "example"
\`\`\`

`
  )
  .join('\n')

describe('Phase 3: Node Pooling', () => {
  bench('Standard parser (no pooling)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(mediumDoc, { useNodePool: false })
  })

  bench('With node pooling', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(mediumDoc, { useNodePool: true })
  })

  bench('Node pooling - repeated parses (simulates reuse)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    for (let i = 0; i < 10; i++) {
      parser.parse(smallDoc, { useNodePool: true })
    }
  })
})

describe('Phase 3: Batch Processing', () => {
  bench('Standard tokenizer (line-by-line)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(largeDoc)
  })

  bench('Batch tokenizer (8 lines at once)', () => {
    const batchTokenizer = new BatchTokenizer(8)
    batchTokenizer.tokenize(largeDoc)
  })

  bench('Batch tokenizer (16 lines at once)', () => {
    const batchTokenizer = new BatchTokenizer(16)
    batchTokenizer.tokenize(largeDoc)
  })

  bench('Batch tokenizer (32 lines at once)', () => {
    const batchTokenizer = new BatchTokenizer(32)
    batchTokenizer.tokenize(largeDoc)
  })
})

describe('Phase 3: Incremental Parsing', () => {
  // Simulate small edit (single character)
  const originalText = mediumDoc
  const editedText = mediumDoc.replace('This is', 'This was')
  const smallEdit = detectEdit(originalText, editedText)

  bench('Full re-parse (small edit)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(editedText)
  })

  bench('Incremental parse (small edit)', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(originalText)
    parser.update(editedText, smallEdit)
  })

  // Simulate medium edit (paragraph change)
  const paraEditText = mediumDoc.replace(
    'This is a paragraph with some **bold** and *italic* text.',
    'This is a completely different paragraph with new content and more words to make it longer.'
  )
  const mediumEdit = detectEdit(originalText, paraEditText)

  bench('Full re-parse (medium edit)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(paraEditText)
  })

  bench('Incremental parse (medium edit)', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(originalText)
    parser.update(paraEditText, mediumEdit)
  })

  // Simulate large edit (section addition)
  const largeEditText = originalText + '\n\n# New Section\n\nCompletely new content here.\n\n'
  const largeEdit = detectEdit(originalText, largeEditText)

  bench('Full re-parse (large edit)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(largeEditText)
  })

  bench('Incremental parse (large edit)', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(originalText)
    parser.update(largeEditText, largeEdit)
  })
})

describe('Phase 3: Combined Optimizations', () => {
  const originalText = largeDoc
  const editedText = largeDoc.replace('This is', 'This was')
  const edit = detectEdit(originalText, editedText)

  bench('Baseline (no optimizations)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(editedText, { useNodePool: false })
  })

  bench('Node pooling only', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(editedText, { useNodePool: true })
  })

  bench('Incremental + Node pooling', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(originalText)
    parser.update(editedText, edit)
  })

  bench('All optimizations (theoretical peak)', () => {
    // This would combine batch tokenizer + node pooling + incremental
    // For now, just test incremental with node pooling
    const parser = new IncrementalMarkdownParser()
    parser.parse(originalText)
    parser.update(editedText, edit)
  })
})

describe('Phase 3: Scaling Analysis', () => {
  const sizes = [
    { name: '1KB', doc: smallDoc },
    { name: '10KB', doc: mediumDoc },
    { name: '100KB', doc: largeDoc },
  ]

  for (const { name, doc } of sizes) {
    bench(`Standard parser - ${name}`, () => {
      const parser = new UltraOptimizedMarkdownParser()
      parser.parse(doc)
    })

    bench(`Batch tokenizer - ${name}`, () => {
      const batchTokenizer = new BatchTokenizer(8)
      batchTokenizer.tokenize(doc)
    })

    // Simulate typing (single character edit)
    const edited = doc + 'x'
    const edit = detectEdit(doc, edited)

    bench(`Incremental - ${name} (typing)`, () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse(doc)
      parser.update(edited, edit)
    })
  }
})
