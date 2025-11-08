/**
 * Incremental Parsing Benchmarks
 *
 * Goal: Demonstrate 90%+ performance improvement over full re-parse
 */

import { bench, describe } from 'vitest'
import type { Tree } from '../src/types/index.js'
import { createTree } from '../src/types/tree.js'
import { createIncrementalParser, applyEdit } from '../src/core/incremental.js'

// Mock parser for benchmarking
function mockParser(text: string): Tree {
  const tree = createTree('markdown', text)

  // Simulate realistic parsing work
  const lines = text.split('\n')
  let offset = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed) {
      const node = {
        id: i,
        type: trimmed.startsWith('#')
          ? 'heading'
          : trimmed.startsWith('-')
            ? 'list'
            : 'paragraph',
        parent: null,
        children: [],
        span: {
          start: { line: i, column: 0, offset },
          end: { line: i, column: line.length, offset: offset + line.length },
        },
        data: { value: line },
      }
      tree.nodes.push(node)
    }
    offset += line.length + 1
  }

  return tree
}

// Generate test documents of various sizes
function generateDocument(lineCount: number): string {
  const lines: string[] = []
  for (let i = 0; i < lineCount; i++) {
    if (i % 10 === 0) {
      lines.push(`# Heading ${i / 10}`)
    } else if (i % 5 === 0) {
      lines.push(`## Subheading ${i}`)
    } else if (i % 3 === 0) {
      lines.push(`- List item ${i}`)
    } else {
      lines.push(`This is paragraph ${i} with some text content.`)
    }
  }
  return lines.join('\n')
}

describe('Incremental Parsing - Small Document (100 lines)', () => {
  const text = generateDocument(100)
  const tree = mockParser(text)

  bench('Full re-parse', () => {
    mockParser(text)
  })

  bench('Incremental parse (single small edit)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 50, oldLength: 10, newLength: 15 })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (multiple small edits)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 50, oldLength: 5, newLength: 7 })
    incrementalParser.edit({ start: 150, oldLength: 3, newLength: 5 })
    incrementalParser.edit({ start: 300, oldLength: 8, newLength: 10 })
    incrementalParser.applyEdits(mockParser)
  })
})

describe('Incremental Parsing - Medium Document (1000 lines)', () => {
  const text = generateDocument(1000)
  const tree = mockParser(text)

  bench('Full re-parse', () => {
    mockParser(text)
  })

  bench('Incremental parse (single small edit)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 500, oldLength: 10, newLength: 15 })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (edit at start)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 0, oldLength: 20, newLength: 25 })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (edit at end)', () => {
    const incrementalParser = createIncrementalParser(tree)
    const endOffset = text.length - 50
    incrementalParser.edit({ start: endOffset, oldLength: 20, newLength: 30 })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (multiple scattered edits)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 100, oldLength: 5, newLength: 7 })
    incrementalParser.edit({ start: 500, oldLength: 10, newLength: 12 })
    incrementalParser.edit({ start: 1000, oldLength: 8, newLength: 15 })
    incrementalParser.edit({ start: 2000, oldLength: 6, newLength: 9 })
    incrementalParser.applyEdits(mockParser)
  })
})

describe('Incremental Parsing - Large Document (10000 lines)', () => {
  const text = generateDocument(10000)
  const tree = mockParser(text)

  bench('Full re-parse', () => {
    mockParser(text)
  })

  bench('Incremental parse (tiny edit 0.01% of document)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 5000, oldLength: 10, newLength: 15 })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (small edit 0.1% of document)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 5000, oldLength: 100, newLength: 150 })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (medium edit 1% of document)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({ start: 5000, oldLength: 1000, newLength: 1500 })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (10 small scattered edits)', () => {
    const incrementalParser = createIncrementalParser(tree)
    for (let i = 0; i < 10; i++) {
      incrementalParser.edit({
        start: i * 1000,
        oldLength: 10,
        newLength: 15,
      })
    }
    incrementalParser.applyEdits(mockParser)
  })
})

describe('Incremental Parsing - Real-world Scenarios', () => {
  describe('Typing simulation (character by character)', () => {
    const text = generateDocument(500)

    bench('Full re-parse after each character (10 chars)', () => {
      for (let i = 0; i < 10; i++) {
        mockParser(text + 'x'.repeat(i))
      }
    })

    bench('Incremental parse after each character (10 chars)', () => {
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      for (let i = 0; i < 10; i++) {
        incrementalParser.edit({
          start: text.length + i,
          oldLength: 0,
          newLength: 1,
        })
        incrementalParser.applyEdits(mockParser)
      }
    })
  })

  describe('Code refactoring simulation', () => {
    const text = generateDocument(2000)
    const tree = mockParser(text)

    bench('Full re-parse (refactor)', () => {
      mockParser(text)
    })

    bench('Incremental parse (rename variable - multiple locations)', () => {
      const incrementalParser = createIncrementalParser(tree)
      // Simulate renaming a variable at 5 locations
      for (let i = 0; i < 5; i++) {
        incrementalParser.edit({
          start: i * 400,
          oldLength: 8,
          newLength: 12,
        })
      }
      incrementalParser.applyEdits(mockParser)
    })
  })

  describe('Live preview simulation', () => {
    const text = generateDocument(1000)

    bench('Full re-parse (100 edits)', () => {
      for (let i = 0; i < 100; i++) {
        mockParser(text)
      }
    })

    bench('Incremental parse (100 small edits)', () => {
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      for (let i = 0; i < 100; i++) {
        incrementalParser.edit({
          start: (i * 50) % text.length,
          oldLength: 5,
          newLength: 7,
        })
        incrementalParser.applyEdits(mockParser)
      }
    })
  })
})

describe('Incremental Parsing - applyEdit helper', () => {
  const text = generateDocument(1000)
  const tree = mockParser(text)

  bench('applyEdit helper (single edit)', () => {
    applyEdit(tree, { start: 500, oldLength: 10, newLength: 15 }, mockParser)
  })

  bench('Full re-parse (baseline)', () => {
    mockParser(text)
  })
})

describe('Incremental Parsing - Worst Case (large change)', () => {
  const text = generateDocument(1000)
  const tree = mockParser(text)

  bench('Full re-parse', () => {
    mockParser(text)
  })

  bench('Incremental parse (50% of document changed)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({
      start: 0,
      oldLength: text.length / 2,
      newLength: text.length / 2 + 100,
    })
    incrementalParser.applyEdits(mockParser)
  })

  bench('Incremental parse (entire document changed)', () => {
    const incrementalParser = createIncrementalParser(tree)
    incrementalParser.edit({
      start: 0,
      oldLength: text.length,
      newLength: text.length + 100,
    })
    incrementalParser.applyEdits(mockParser)
  })
})
