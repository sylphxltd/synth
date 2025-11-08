/**
 * Incremental Parser Tests - Comprehensive Coverage
 */

import { describe, it, expect } from 'vitest'
import {
  IncrementalMarkdownParser,
  detectEdit,
  calculateEditDistance,
  shouldUseIncremental,
  type Edit,
} from './incremental-parser.js'

describe('IncrementalMarkdownParser', () => {
  describe('Constructor and Basic Operations', () => {
    it('should create a new incremental parser', () => {
      const parser = new IncrementalMarkdownParser()
      expect(parser).toBeDefined()
      expect(parser.getTree()).toBeNull()
    })

    it('should return null tree before first parse', () => {
      const parser = new IncrementalMarkdownParser()
      expect(parser.getTree()).toBeNull()
    })

    it('should return tree after first parse', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('# Hello')
      expect(tree).toBeDefined()
      expect(parser.getTree()).toBe(tree)
    })

    it('should get index', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('# Hello', { buildIndex: true })
      const index = parser.getIndex()
      expect(index).toBeDefined()
    })
  })

  describe('Initial Parse', () => {
    it('should parse simple markdown', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('# Heading\n\nParagraph')

      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse with options', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('# Hello', {
        buildIndex: true,
        useNodePool: false
      })

      expect(tree).toBeDefined()
    })

    it('should parse empty string', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('')

      expect(tree.nodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse large document', () => {
      const parser = new IncrementalMarkdownParser()
      const largeDoc = Array(1000).fill('# Heading\n\nParagraph').join('\n\n')
      const tree = parser.parse(largeDoc)

      expect(tree.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Update Without Previous Tree', () => {
    it('should do full parse when no previous tree exists', () => {
      const parser = new IncrementalMarkdownParser()

      // Update without initial parse
      const tree = parser.update('# Hello', {
        startIndex: 0,
        oldEndIndex: 0,
        newEndIndex: 7,
      })

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Small Document Updates (Full Re-parse)', () => {
    it('should do full re-parse for small documents', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('# Hello')

      // Small document (< 100KB) always does full re-parse
      const tree = parser.update('# Hello World', {
        startIndex: 7,
        oldEndIndex: 7,
        newEndIndex: 13,
      })

      expect(tree).toBeDefined()
    })

    it('should handle small document with large edit', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('# Original\n\nText')

      const tree = parser.update('# Completely Different\n\nNew Content', {
        startIndex: 0,
        oldEndIndex: 16,
        newEndIndex: 35,
      })

      expect(tree).toBeDefined()
    })
  })

  describe('Large Document Updates (Incremental)', () => {
    it('should use incremental parsing for large documents with small edits', () => {
      const parser = new IncrementalMarkdownParser()

      // Create a document > 100KB
      const section = '# Section\n\nThis is a paragraph with some content.\n\n'
      const largeDoc = section.repeat(2500) // ~135KB

      parser.parse(largeDoc)

      // Make a small edit at the beginning
      const edit: Edit = {
        startIndex: 2,
        oldEndIndex: 9,
        newEndIndex: 19,
      }

      const newDoc = largeDoc.slice(0, 2) + 'Big Section' + largeDoc.slice(9)
      const tree = parser.update(newDoc, edit)

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should fall back to full parse for large documents with large edits', () => {
      const parser = new IncrementalMarkdownParser()

      // Create a document > 100KB
      const section = '# Section\n\nContent\n\n'
      const largeDoc = section.repeat(5000) // ~110KB

      parser.parse(largeDoc)

      // Make a large edit (> 10% of document)
      const halfwayPoint = Math.floor(largeDoc.length / 2)
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: halfwayPoint,
        newEndIndex: 100,
      }

      const newDoc = 'New content' + largeDoc.slice(halfwayPoint)
      const tree = parser.update(newDoc, edit)

      expect(tree).toBeDefined()
    })
  })

  describe('Edit Detection', () => {
    it('should detect insertion at beginning', () => {
      const edit = detectEdit('Hello', 'XXXHello')

      expect(edit.startIndex).toBe(0)
      expect(edit.oldEndIndex).toBe(0)
      expect(edit.newEndIndex).toBe(3)
    })

    it('should detect insertion at end', () => {
      const edit = detectEdit('Hello', 'HelloXXX')

      expect(edit.startIndex).toBe(5)
      expect(edit.oldEndIndex).toBe(5)
      expect(edit.newEndIndex).toBe(8)
    })

    it('should detect insertion in middle', () => {
      const edit = detectEdit('Hello World', 'Hello Beautiful World')

      expect(edit.startIndex).toBe(6)
      expect(edit.oldEndIndex).toBe(6)
      expect(edit.newEndIndex).toBe(16)
    })

    it('should detect deletion at beginning', () => {
      const edit = detectEdit('Hello World', 'World')

      expect(edit.startIndex).toBe(0)
      expect(edit.oldEndIndex).toBe(6)
      expect(edit.newEndIndex).toBe(0)
    })

    it('should detect deletion at end', () => {
      const edit = detectEdit('Hello World', 'Hello')

      expect(edit.startIndex).toBe(5)
      expect(edit.oldEndIndex).toBe(11)
      expect(edit.newEndIndex).toBe(5)
    })

    it('should detect deletion in middle', () => {
      const edit = detectEdit('Hello Beautiful World', 'Hello World')

      expect(edit.startIndex).toBe(6)
      expect(edit.oldEndIndex).toBe(16)
      expect(edit.newEndIndex).toBe(6)
    })

    it('should detect replacement', () => {
      const edit = detectEdit('Hello World', 'Hello Earth')

      expect(edit.startIndex).toBe(6)
      expect(edit.oldEndIndex).toBe(11)
      expect(edit.newEndIndex).toBe(11)
    })

    it('should handle identical texts', () => {
      const edit = detectEdit('Same', 'Same')

      expect(edit.startIndex).toBe(4)
      expect(edit.oldEndIndex).toBe(4)
      expect(edit.newEndIndex).toBe(4)
    })

    it('should handle empty old text', () => {
      const edit = detectEdit('', 'New')

      expect(edit.startIndex).toBe(0)
      expect(edit.oldEndIndex).toBe(0)
      expect(edit.newEndIndex).toBe(3)
    })

    it('should handle empty new text', () => {
      const edit = detectEdit('Old', '')

      expect(edit.startIndex).toBe(0)
      expect(edit.oldEndIndex).toBe(3)
      expect(edit.newEndIndex).toBe(0)
    })

    it('should handle complete replacement', () => {
      const edit = detectEdit('ABC', 'XYZ')

      expect(edit.startIndex).toBe(0)
      expect(edit.oldEndIndex).toBe(3)
      expect(edit.newEndIndex).toBe(3)
    })
  })

  describe('Edit Distance Calculation', () => {
    it('should calculate distance for insertion', () => {
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: 0,
        newEndIndex: 10,
      }

      const distance = calculateEditDistance(edit)
      expect(distance).toBe(10)
    })

    it('should calculate distance for deletion', () => {
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: 10,
        newEndIndex: 0,
      }

      const distance = calculateEditDistance(edit)
      expect(distance).toBe(10)
    })

    it('should calculate distance for replacement', () => {
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: 10,
        newEndIndex: 15,
      }

      const distance = calculateEditDistance(edit)
      expect(distance).toBe(15) // max(10, 15)
    })

    it('should calculate zero distance for no change', () => {
      const edit: Edit = {
        startIndex: 5,
        oldEndIndex: 5,
        newEndIndex: 5,
      }

      const distance = calculateEditDistance(edit)
      expect(distance).toBe(0)
    })
  })

  describe('Should Use Incremental Decision', () => {
    it('should recommend incremental for small edits', () => {
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: 10,
        newEndIndex: 15,
      }

      const result = shouldUseIncremental(edit, 1000)
      expect(result).toBe(true)
    })

    it('should recommend full parse for large edits', () => {
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: 400,
        newEndIndex: 450,
      }

      const result = shouldUseIncremental(edit, 1000)
      expect(result).toBe(false) // 45% > 30% threshold
    })

    it('should handle exactly 30% threshold', () => {
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: 300,
        newEndIndex: 300,
      }

      const result = shouldUseIncremental(edit, 1000)
      expect(result).toBe(false) // Equal to threshold
    })

    it('should handle very small edits', () => {
      const edit: Edit = {
        startIndex: 100,
        oldEndIndex: 101,
        newEndIndex: 102,
      }

      const result = shouldUseIncremental(edit, 10000)
      expect(result).toBe(true)
    })

    it('should handle complete replacement', () => {
      const edit: Edit = {
        startIndex: 0,
        oldEndIndex: 1000,
        newEndIndex: 1000,
      }

      const result = shouldUseIncremental(edit, 1000)
      expect(result).toBe(false)
    })
  })

  describe('Block Boundary Expansion', () => {
    it('should expand to include complete blocks', () => {
      const parser = new IncrementalMarkdownParser()

      const text = '# Heading\n\nParagraph one.\n\nParagraph two.'
      parser.parse(text)

      // Edit in middle of "Paragraph one"
      const edit: Edit = {
        startIndex: 15,
        oldEndIndex: 18,
        newEndIndex: 21,
      }

      const newText = text.slice(0, 15) + 'modified' + text.slice(18)
      const tree = parser.update(newText, edit)

      expect(tree).toBeDefined()
    })

    it('should handle edits at block boundaries', () => {
      const parser = new IncrementalMarkdownParser()

      const text = '# Heading\n\nParagraph'
      parser.parse(text)

      // Edit at blank line
      const edit: Edit = {
        startIndex: 9,
        oldEndIndex: 11,
        newEndIndex: 11,
      }

      const newText = text.slice(0, 9) + '\n\n' + text.slice(11)
      const tree = parser.update(newText, edit)

      expect(tree).toBeDefined()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple consecutive updates', () => {
      const parser = new IncrementalMarkdownParser()

      let text = '# Original'
      parser.parse(text)

      // Update 1: Append text
      text = '# Original\n\nParagraph'
      parser.update(text, {
        startIndex: 10,
        oldEndIndex: 10,
        newEndIndex: 22,
      })

      // Update 2: Edit heading
      text = '# Modified\n\nParagraph'
      const tree = parser.update(text, {
        startIndex: 2,
        oldEndIndex: 10,
        newEndIndex: 10,
      })

      expect(tree).toBeDefined()
    })

    it('should handle adding blank lines', () => {
      const parser = new IncrementalMarkdownParser()

      parser.parse('# Title\nText')

      const tree = parser.update('# Title\n\nText', {
        startIndex: 7,
        oldEndIndex: 7,
        newEndIndex: 8,
      })

      expect(tree).toBeDefined()
    })

    it('should handle removing blank lines', () => {
      const parser = new IncrementalMarkdownParser()

      parser.parse('# Title\n\nText')

      const tree = parser.update('# Title\nText', {
        startIndex: 7,
        oldEndIndex: 8,
        newEndIndex: 7,
      })

      expect(tree).toBeDefined()
    })

    it('should handle restructuring document', () => {
      const parser = new IncrementalMarkdownParser()

      const original = '# A\n\n# B\n\n# C'
      parser.parse(original)

      const modified = '# A\n\n# C\n\n# B'
      const edit = detectEdit(original, modified)
      const tree = parser.update(modified, edit)

      expect(tree).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle edit at start of document', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('Hello World')

      const tree = parser.update('XXXHello World', {
        startIndex: 0,
        oldEndIndex: 0,
        newEndIndex: 3,
      })

      expect(tree).toBeDefined()
    })

    it('should handle edit at end of document', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('Hello World')

      const tree = parser.update('Hello WorldXXX', {
        startIndex: 11,
        oldEndIndex: 11,
        newEndIndex: 14,
      })

      expect(tree).toBeDefined()
    })

    it('should handle single character insertion', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('Hello World')

      const tree = parser.update('Hello XWorld', {
        startIndex: 6,
        oldEndIndex: 6,
        newEndIndex: 7,
      })

      expect(tree).toBeDefined()
    })

    it('should handle single character deletion', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('Hello World')

      const tree = parser.update('HelloWorld', {
        startIndex: 5,
        oldEndIndex: 6,
        newEndIndex: 5,
      })

      expect(tree).toBeDefined()
    })

    it('should handle newline insertion', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('HelloWorld')

      const tree = parser.update('Hello\nWorld', {
        startIndex: 5,
        oldEndIndex: 5,
        newEndIndex: 6,
      })

      expect(tree).toBeDefined()
    })

    it('should handle newline deletion', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('Hello\nWorld')

      const tree = parser.update('HelloWorld', {
        startIndex: 5,
        oldEndIndex: 6,
        newEndIndex: 5,
      })

      expect(tree).toBeDefined()
    })

    it('should handle document cleared', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('# Heading\n\nParagraph')

      const tree = parser.update('', {
        startIndex: 0,
        oldEndIndex: 20,
        newEndIndex: 0,
      })

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle document completely replaced', () => {
      const parser = new IncrementalMarkdownParser()
      parser.parse('Original')

      const tree = parser.update('Completely Different Content', {
        startIndex: 0,
        oldEndIndex: 8,
        newEndIndex: 28,
      })

      expect(tree).toBeDefined()
    })
  })

  describe('Real-World Editing Scenarios', () => {
    it('should handle typing in a paragraph', () => {
      const parser = new IncrementalMarkdownParser()

      let text = '# Title\n\nThis is a para'
      parser.parse(text)

      // User continues typing "graph"
      text = '# Title\n\nThis is a paragraph'
      const tree = parser.update(text, {
        startIndex: 23,
        oldEndIndex: 23,
        newEndIndex: 28,
      })

      expect(tree).toBeDefined()
    })

    it('should handle backspace deletion', () => {
      const parser = new IncrementalMarkdownParser()

      let text = '# Title\n\nParagraph'
      parser.parse(text)

      // User presses backspace
      text = '# Title\n\nParagrap'
      const tree = parser.update(text, {
        startIndex: 17,
        oldEndIndex: 18,
        newEndIndex: 17,
      })

      expect(tree).toBeDefined()
    })

    it('should handle paste operation', () => {
      const parser = new IncrementalMarkdownParser()

      let text = '# Title\n\nBefore After'
      parser.parse(text)

      // User pastes "Inserted Content " in the middle
      text = '# Title\n\nBefore Inserted Content After'
      const tree = parser.update(text, {
        startIndex: 15,
        oldEndIndex: 15,
        newEndIndex: 33,
      })

      expect(tree).toBeDefined()
    })

    it('should handle cut operation', () => {
      const parser = new IncrementalMarkdownParser()

      let text = '# Title\n\nBefore Middle After'
      parser.parse(text)

      // User cuts "Middle "
      text = '# Title\n\nBefore After'
      const tree = parser.update(text, {
        startIndex: 15,
        oldEndIndex: 22,
        newEndIndex: 15,
      })

      expect(tree).toBeDefined()
    })

    it('should handle adding a new heading', () => {
      const parser = new IncrementalMarkdownParser()

      let text = '# First\n\n# Third'
      parser.parse(text)

      // User adds "# Second\n\n" between
      text = '# First\n\n# Second\n\n# Third'
      const tree = parser.update(text, {
        startIndex: 9,
        oldEndIndex: 9,
        newEndIndex: 20,
      })

      expect(tree).toBeDefined()
    })

    it('should handle deleting a section', () => {
      const parser = new IncrementalMarkdownParser()

      let text = '# A\n\nContent A\n\n# B\n\nContent B\n\n# C\n\nContent C'
      parser.parse(text)

      // User deletes section B
      text = '# A\n\nContent A\n\n# C\n\nContent C'
      const edit = detectEdit('# A\n\nContent A\n\n# B\n\nContent B\n\n# C\n\nContent C', text)
      const tree = parser.update(text, edit)

      expect(tree).toBeDefined()
    })
  })

  describe('Markdown-Specific Edits', () => {
    it('should handle changing heading level', () => {
      const parser = new IncrementalMarkdownParser()

      parser.parse('# Heading')

      const tree = parser.update('## Heading', {
        startIndex: 0,
        oldEndIndex: 1,
        newEndIndex: 2,
      })

      expect(tree).toBeDefined()
    })

    it('should handle converting paragraph to list', () => {
      const parser = new IncrementalMarkdownParser()

      parser.parse('Text')

      const tree = parser.update('- Text', {
        startIndex: 0,
        oldEndIndex: 0,
        newEndIndex: 2,
      })

      expect(tree).toBeDefined()
    })

    it('should handle adding code block delimiters', () => {
      const parser = new IncrementalMarkdownParser()

      parser.parse('code here')

      const tree = parser.update('```\ncode here\n```', {
        startIndex: 0,
        oldEndIndex: 0,
        newEndIndex: 4,
      })

      expect(tree).toBeDefined()
    })

    it('should handle adding bold formatting', () => {
      const parser = new IncrementalMarkdownParser()

      parser.parse('Some text here')

      const tree = parser.update('Some **text** here', {
        startIndex: 5,
        oldEndIndex: 5,
        newEndIndex: 7,
      })

      expect(tree).toBeDefined()
    })
  })
})
