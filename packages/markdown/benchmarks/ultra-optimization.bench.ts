/**
 * Ultra-Optimization Benchmarks
 *
 * Compare:
 * - Remark (baseline)
 * - Synth Optimized (9-11x)
 * - Synth Ultra-Optimized (target 20-30x)
 */

import { bench, describe } from 'vitest'
import { remark } from 'remark'
import { OptimizedMarkdownParser } from '../src/parsers/markdown/optimized-parser.js'
import { UltraOptimizedMarkdownParser } from '../src/parsers/markdown/ultra-optimized-parser.js'
import { BatchTokenizer } from '../src/parsers/markdown/batch-tokenizer.js'

// Test documents
const smallDoc = `# Hello World

This is a **bold** paragraph with *italic* text.

- Item 1
- Item 2
- Item 3
`

const mediumDoc = `# Document Title

## Introduction

This is a paragraph with **bold text**, *italic text*, and \`inline code\`.

Here's a [link](https://example.com) and an image: ![alt](image.jpg)

## Code Examples

\`\`\`javascript
const x = 1
const y = 2
console.log(x + y)
\`\`\`

## Lists

- First item
- Second item with **bold**
- Third item with *italic*

### Nested List

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

## Blockquotes

> This is a blockquote
> with multiple lines
> and **formatting**

---

## Conclusion

Final paragraph with all features: **bold**, *italic*, \`code\`, and [links](https://example.com).
`

const largeDoc = Array(50).fill(mediumDoc).join('\n\n')

const blogPost = Array(20).fill(mediumDoc).join('\n\n')

const documentation = Array(100).fill(mediumDoc).join('\n\n')

describe('Ultra-Optimization: Small Documents', () => {
  bench('Remark (baseline)', () => {
    remark().parse(smallDoc)
  })

  bench('Synth Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(smallDoc)
  })

  bench('Synth Ultra-Optimized', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(smallDoc)
  })
})

describe('Ultra-Optimization: Medium Documents', () => {
  bench('Remark (baseline)', () => {
    remark().parse(mediumDoc)
  })

  bench('Synth Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(mediumDoc)
  })

  bench('Synth Ultra-Optimized', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(mediumDoc)
  })
})

describe('Ultra-Optimization: Large Documents', () => {
  bench('Remark (baseline)', () => {
    remark().parse(largeDoc)
  })

  bench('Synth Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(largeDoc)
  })

  bench('Synth Ultra-Optimized', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(largeDoc)
  })
})

describe('Ultra-Optimization: Blog Posts (1000 lines)', () => {
  bench('Remark (baseline)', () => {
    remark().parse(blogPost)
  })

  bench('Synth Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(blogPost)
  })

  bench('Synth Ultra-Optimized', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(blogPost)
  })
})

describe('Ultra-Optimization: Documentation (5000 lines)', () => {
  bench('Remark (baseline)', () => {
    remark().parse(documentation)
  })

  bench('Synth Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(documentation)
  })

  bench('Synth Ultra-Optimized', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(documentation)
  })
})

describe('Ultra-Optimization: Tokenizer Comparison', () => {
  bench('Optimized Tokenizer', () => {
    const parser = new OptimizedMarkdownParser()
    // @ts-ignore - accessing private for benchmark
    parser.tokenizer.tokenize(mediumDoc)
  })

  bench('Ultra-Optimized Tokenizer', () => {
    const parser = new UltraOptimizedMarkdownParser()
    // @ts-ignore - accessing private for benchmark
    parser.tokenizer.tokenize(mediumDoc)
  })
})

describe('Phase 3: Batch Tokenizer Performance', () => {
  bench('Standard tokenizer - Medium', () => {
    const parser = new UltraOptimizedMarkdownParser()
    // @ts-ignore - accessing private for benchmark
    parser.tokenizer.tokenize(mediumDoc)
  })

  bench('Batch tokenizer - Medium', () => {
    const tokenizer = new BatchTokenizer(16)
    tokenizer.tokenize(mediumDoc)
  })

  bench('Standard tokenizer - Large', () => {
    const parser = new UltraOptimizedMarkdownParser()
    // @ts-ignore - accessing private for benchmark
    parser.tokenizer.tokenize(largeDoc)
  })

  bench('Batch tokenizer - Large', () => {
    const tokenizer = new BatchTokenizer(16)
    tokenizer.tokenize(largeDoc)
  })
})
