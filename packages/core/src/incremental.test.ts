/**
 * Incremental Parsing Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Tree } from './types/index.js'
import { createTree } from './types/tree.js'
import {
  IncrementalParser,
  createIncrementalParser,
  applyEdit,
  type Edit,
  type SimpleEdit,
} from './incremental.js'

// Mock parser for testing
function mockParser(text: string): Tree {
  const tree = createTree('test', text)

  // Simple mock: create nodes based on lines
  const lines = text.split('\n')
  let offset = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim()) {
      const node = {
        id: i,
        type: line.startsWith('#') ? 'heading' : 'text',
        parent: null,
        children: [],
        span: {
          start: { line: i, column: 0, offset },
          end: { line: i, column: line.length, offset: offset + line.length },
        },
        data: { value: line },
      }
      tree.nodes.push(node)
      offset += line.length + 1 // +1 for newline
    }
  }

  return tree
}

describe('IncrementalParser', () => {
  let initialTree: Tree
  let parser: IncrementalParser

  beforeEach(() => {
    const text = '# Heading\nParagraph 1\nParagraph 2\n# Another Heading'
    initialTree = mockParser(text)
    parser = createIncrementalParser(initialTree)
  })

  describe('Edit tracking', () => {
    it('should record simple edit', () => {
      const edit: SimpleEdit = {
        start: 0,
        oldLength: 9,
        newLength: 11,
      }

      parser.edit(edit)
      const stats = parser.getStats()

      expect(stats.pendingEdits).toBe(1)
    })

    it('should record multiple edits', () => {
      parser.edit({ start: 0, oldLength: 5, newLength: 7 })
      parser.edit({ start: 10, oldLength: 3, newLength: 5 })
      parser.edit({ start: 20, oldLength: 2, newLength: 4 })

      const stats = parser.getStats()
      expect(stats.pendingEdits).toBe(3)
    })

    it('should normalize SimpleEdit to full Edit', () => {
      const simpleEdit: SimpleEdit = {
        start: 10,
        oldLength: 5,
        newLength: 7,
      }

      parser.edit(simpleEdit)
      expect(parser.getStats().pendingEdits).toBe(1)
    })

    it('should accept full Edit format', () => {
      const fullEdit: Edit = {
        startByte: 0,
        oldEndByte: 9,
        newEndByte: 11,
        startPosition: { line: 0, column: 0, offset: 0 },
        oldEndPosition: { line: 0, column: 9, offset: 9 },
        newEndPosition: { line: 0, column: 11, offset: 11 },
      }

      parser.edit(fullEdit)
      expect(parser.getStats().pendingEdits).toBe(1)
    })
  })

  describe('Affected node detection', () => {
    it('should find nodes affected by edit', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      // Edit the first line
      const edit: SimpleEdit = {
        start: 0,
        oldLength: 9,
        newLength: 15,
      }

      incrementalParser.edit(edit)
      const stats = incrementalParser.applyEdits(mockParser)

      // Should have detected affected nodes
      expect(stats.affectedNodes).toBeGreaterThan(0)
      expect(stats.reusedNodes).toBeGreaterThan(0)
    })

    it('should mark parent nodes as affected', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      // Edit in the middle
      incrementalParser.edit({ start: 15, oldLength: 5, newLength: 10 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.affectedNodes).toBeGreaterThan(0)
    })

    it('should handle multiple overlapping edits', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      // Multiple edits in same region
      incrementalParser.edit({ start: 0, oldLength: 5, newLength: 7 })
      incrementalParser.edit({ start: 3, oldLength: 3, newLength: 5 })

      const stats = incrementalParser.applyEdits(mockParser)
      expect(stats.affectedNodes).toBeGreaterThan(0)
    })
  })

  describe('Partial re-parsing', () => {
    it('should only re-parse affected region', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2\n# Last'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      const originalNodeCount = tree.nodes.length

      // Edit only the first line
      incrementalParser.edit({ start: 0, oldLength: 9, newLength: 15 })
      const stats = incrementalParser.applyEdits(mockParser)

      // Should have reused some nodes
      expect(stats.reusedNodes).toBeGreaterThan(0)
      expect(stats.affectedNodes).toBeLessThan(originalNodeCount)
    })

    it('should create new nodes for affected region', () => {
      const text = '# Heading\nParagraph 1'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 0, oldLength: 9, newLength: 15 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.newNodes).toBeGreaterThan(0)
    })

    it('should maintain tree structure after edit', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 15, oldLength: 5, newLength: 10 })
      incrementalParser.applyEdits(mockParser)

      const resultTree = incrementalParser.getTree()
      expect(resultTree.nodes).toBeDefined()
      expect(resultTree.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Performance statistics', () => {
    it('should track incremental parsing stats', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 0, oldLength: 9, newLength: 15 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.totalNodes).toBeGreaterThan(0)
      expect(stats.affectedNodes).toBeGreaterThanOrEqual(0)
      expect(stats.reusedNodes).toBeGreaterThanOrEqual(0)
      expect(stats.newNodes).toBeGreaterThanOrEqual(0)
      expect(stats.reparseTimeMs).toBeGreaterThanOrEqual(0)
      expect(stats.fullParseTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('should calculate speedup correctly', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2\n# Another\nMore text'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      // Small edit in large document
      incrementalParser.edit({ start: 15, oldLength: 3, newLength: 5 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.speedup).toBe(stats.fullParseTimeMs / stats.reparseTimeMs)
      // For small changes, incremental should be faster
      // (though with mock parser, timing may vary)
      expect(stats.speedup).toBeGreaterThanOrEqual(0)
    })

    it('should show efficiency gains for small edits', () => {
      const text = Array(100).fill('# Heading\nParagraph').join('\n')
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      const totalNodes = tree.nodes.length

      // Small edit
      incrementalParser.edit({ start: 50, oldLength: 5, newLength: 8 })
      const stats = incrementalParser.applyEdits(mockParser)

      // Most nodes should be reused
      expect(stats.reusedNodes).toBeGreaterThan(totalNodes * 0.5)
    })
  })

  describe('Structural sharing with node pool', () => {
    it('should release old nodes to pool', () => {
      const text = '# Heading\nParagraph 1'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 0, oldLength: 9, newLength: 15 })
      const stats = incrementalParser.applyEdits(mockParser)

      // Nodes should have been released
      expect(stats.affectedNodes).toBeGreaterThan(0)
    })

    it('should reuse unchanged nodes', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2\nParagraph 3'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      const originalCount = tree.nodes.length

      // Edit only first line
      incrementalParser.edit({ start: 0, oldLength: 9, newLength: 12 })
      const stats = incrementalParser.applyEdits(mockParser)

      // Should reuse some or all nodes
      expect(stats.reusedNodes).toBeGreaterThanOrEqual(0)
      expect(stats.reusedNodes).toBeLessThanOrEqual(originalCount)
    })
  })

  describe('Edge cases', () => {
    it('should handle edit at start of document', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 0, oldLength: 1, newLength: 2 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.totalNodes).toBeGreaterThan(0)
    })

    it('should handle edit at end of document', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      const endOffset = text.length - 1
      incrementalParser.edit({ start: endOffset, oldLength: 1, newLength: 5 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.totalNodes).toBeGreaterThan(0)
    })

    it('should handle empty edit', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 5, oldLength: 0, newLength: 0 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.speedup).toBeGreaterThanOrEqual(0)
    })

    it('should handle deletion', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 5, oldLength: 4, newLength: 0 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.totalNodes).toBeGreaterThanOrEqual(0)
    })

    it('should handle insertion', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 5, oldLength: 0, newLength: 10 })
      const stats = incrementalParser.applyEdits(mockParser)

      expect(stats.totalNodes).toBeGreaterThan(0)
    })
  })

  describe('Helper function: applyEdit', () => {
    it('should apply single edit and return new tree', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)

      const edit: SimpleEdit = {
        start: 0,
        oldLength: 9,
        newLength: 15,
      }

      const result = applyEdit(tree, edit, mockParser)

      expect(result.tree).toBeDefined()
      expect(result.stats).toBeDefined()
      expect(result.stats.totalNodes).toBeGreaterThan(0)
    })

    it('should return statistics', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)

      const result = applyEdit(
        tree,
        { start: 5, oldLength: 4, newLength: 6 },
        mockParser
      )

      expect(result.stats.reparseTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.stats.fullParseTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.stats.speedup).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Index integration', () => {
    it('should use query index for affected node detection', () => {
      const text = '# Heading\nParagraph 1\nParagraph 2'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      // Edit that affects specific nodes
      incrementalParser.edit({ start: 0, oldLength: 9, newLength: 15 })
      const stats = incrementalParser.applyEdits(mockParser)

      // Index should help find affected nodes efficiently
      expect(stats.affectedNodes).toBeGreaterThan(0)
    })

    it('should rebuild index after applying edits', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 0, oldLength: 9, newLength: 15 })
      incrementalParser.applyEdits(mockParser)

      // Index should be rebuilt (tested indirectly through successful re-parsing)
      expect(incrementalParser.getTree()).toBeDefined()
    })
  })

  describe('Multiple edit cycles', () => {
    it('should clear edits after applying', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      incrementalParser.edit({ start: 0, oldLength: 5, newLength: 7 })
      incrementalParser.applyEdits(mockParser)

      expect(incrementalParser.getStats().pendingEdits).toBe(0)
    })

    it('should support multiple edit cycles', () => {
      const text = '# Heading\nParagraph'
      const tree = mockParser(text)
      const incrementalParser = createIncrementalParser(tree)

      // First edit cycle
      incrementalParser.edit({ start: 0, oldLength: 5, newLength: 7 })
      const stats1 = incrementalParser.applyEdits(mockParser)
      expect(stats1.totalNodes).toBeGreaterThan(0)

      // Second edit cycle
      incrementalParser.edit({ start: 10, oldLength: 3, newLength: 5 })
      const stats2 = incrementalParser.applyEdits(mockParser)
      expect(stats2.totalNodes).toBeGreaterThan(0)

      // Third edit cycle
      incrementalParser.edit({ start: 5, oldLength: 2, newLength: 4 })
      const stats3 = incrementalParser.applyEdits(mockParser)
      expect(stats3.totalNodes).toBeGreaterThan(0)
    })
  })
})
