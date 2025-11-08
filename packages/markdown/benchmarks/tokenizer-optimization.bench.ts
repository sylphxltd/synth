/**
 * Tokenizer Optimization Benchmarks
 *
 * Compare original vs optimized tokenizer
 */

import { bench, describe } from 'vitest'
import { IncrementalTokenizer } from '../src/parsers/markdown/tokenizer.js'
import { OptimizedTokenizer } from '../src/parsers/markdown/optimized-tokenizer.js'

// Test documents
const smallDoc = `# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

- Item 1
- Item 2
- Item 3

\`\`\`js
code here
\`\`\`

> Quote

---
`

const mediumDoc = Array(100).fill(smallDoc).join('\n\n')
const largeDoc = Array(500).fill(smallDoc).join('\n\n')

describe('Tokenizer Optimization - Small Document', () => {
  bench('Original tokenizer', () => {
    const tokenizer = new IncrementalTokenizer()
    tokenizer.tokenize(smallDoc)
  })

  bench('Optimized tokenizer', () => {
    const tokenizer = new OptimizedTokenizer()
    tokenizer.tokenize(smallDoc)
  })
})

describe('Tokenizer Optimization - Medium Document', () => {
  bench('Original tokenizer', () => {
    const tokenizer = new IncrementalTokenizer()
    tokenizer.tokenize(mediumDoc)
  })

  bench('Optimized tokenizer', () => {
    const tokenizer = new OptimizedTokenizer()
    tokenizer.tokenize(mediumDoc)
  })
})

describe('Tokenizer Optimization - Large Document', () => {
  bench('Original tokenizer', () => {
    const tokenizer = new IncrementalTokenizer()
    tokenizer.tokenize(largeDoc)
  })

  bench('Optimized tokenizer', () => {
    const tokenizer = new OptimizedTokenizer()
    tokenizer.tokenize(largeDoc)
  })
})

describe('Pattern-specific Benchmarks', () => {
  const headings = Array(1000).fill('# Heading').join('\n')
  const lists = Array(1000).fill('- List item').join('\n')
  const paragraphs = Array(1000).fill('Plain paragraph text').join('\n')

  bench('Original - Headings', () => {
    const tokenizer = new IncrementalTokenizer()
    tokenizer.tokenize(headings)
  })

  bench('Optimized - Headings', () => {
    const tokenizer = new OptimizedTokenizer()
    tokenizer.tokenize(headings)
  })

  bench('Original - Lists', () => {
    const tokenizer = new IncrementalTokenizer()
    tokenizer.tokenize(lists)
  })

  bench('Optimized - Lists', () => {
    const tokenizer = new OptimizedTokenizer()
    tokenizer.tokenize(lists)
  })

  bench('Original - Paragraphs', () => {
    const tokenizer = new IncrementalTokenizer()
    tokenizer.tokenize(paragraphs)
  })

  bench('Optimized - Paragraphs', () => {
    const tokenizer = new OptimizedTokenizer()
    tokenizer.tokenize(paragraphs)
  })
})
