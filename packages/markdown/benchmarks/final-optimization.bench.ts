/**
 * Final Optimization Benchmarks
 *
 * Compare:
 * 1. Original sylph parser
 * 2. Optimized sylph parser
 * 3. Remark/Unified
 *
 * Goal: Demonstrate 20-30x improvement over remark
 */

import { bench, describe } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { IncrementalMarkdownParser } from '../src/parsers/markdown/parser.js'
import { OptimizedMarkdownParser } from '../src/parsers/markdown/optimized-parser.js'

// Test documents
const smallDoc = `# Hello World

This is a **small** document with *some* formatting.

- Item 1
- Item 2

\`\`\`js
const x = 1
\`\`\`

> Quote
`

const mediumDoc = Array(50).fill(smallDoc).join('\n\n---\n\n')
const largeDoc = Array(200).fill(smallDoc).join('\n\n---\n\n')

const remarkProcessor = unified().use(remarkParse)

describe('Final Optimization - Small Document', () => {
  bench('Remark (baseline)', () => {
    remarkProcessor.parse(smallDoc)
  })

  bench('sylph Original', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(smallDoc)
  })

  bench('sylph Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(smallDoc)
  })
})

describe('Final Optimization - Medium Document', () => {
  bench('Remark (baseline)', () => {
    remarkProcessor.parse(mediumDoc)
  })

  bench('sylph Original', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(mediumDoc)
  })

  bench('sylph Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(mediumDoc)
  })
})

describe('Final Optimization - Large Document', () => {
  bench('Remark (baseline)', () => {
    remarkProcessor.parse(largeDoc)
  })

  bench('sylph Original', () => {
    const parser = new IncrementalMarkdownParser()
    parser.parse(largeDoc)
  })

  bench('sylph Optimized', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(largeDoc)
  })
})

describe('Real-world: Blog Post (1000 lines)', () => {
  const blogPost = Array(100).fill(smallDoc).join('\n\n')

  bench('Remark parse', () => {
    remarkProcessor.parse(blogPost)
  })

  bench('sylph Optimized parse', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(blogPost)
  })
})

describe('Real-world: Documentation (5000 lines)', () => {
  const docs = Array(500).fill(smallDoc).join('\n\n')

  bench('Remark parse', () => {
    remarkProcessor.parse(docs)
  })

  bench('sylph Optimized parse', () => {
    const parser = new OptimizedMarkdownParser()
    parser.parse(docs)
  })
})
