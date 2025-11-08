/**
 * Incremental Markdown Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { IncrementalMarkdownParser, parseMarkdown } from './parser.js'

describe('IncrementalMarkdownParser', () => {
  describe('Basic parsing', () => {
    it('should parse headings', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('# Heading 1\n## Heading 2')

      expect(tree.nodes.length).toBeGreaterThan(0)

      // Find heading nodes
      const headings = tree.nodes.filter((n) => n && n.type === 'heading')
      expect(headings.length).toBe(2)
      expect(headings[0]?.data?.depth).toBe(1)
      expect(headings[1]?.data?.depth).toBe(2)
    })

    it('should parse paragraphs', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('This is a paragraph.\n\nThis is another paragraph.')

      const paragraphs = tree.nodes.filter((n) => n && n.type === 'paragraph')
      expect(paragraphs.length).toBe(2)
    })

    it('should parse code blocks', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('```js\nconst x = 1\n```')

      const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
      expect(codeBlocks.length).toBeGreaterThan(0)
    })

    it('should parse list items', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('- Item 1\n- Item 2\n- Item 3')

      const listItems = tree.nodes.filter((n) => n && n.type === 'listItem')
      expect(listItems.length).toBe(3)
    })

    it('should parse blockquotes', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('> This is a quote\n> Second line')

      const blockquotes = tree.nodes.filter((n) => n && n.type === 'blockquote')
      expect(blockquotes.length).toBe(2)
    })

    it('should parse horizontal rules', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('---')

      const hrs = tree.nodes.filter((n) => n && n.type === 'thematicBreak')
      expect(hrs.length).toBe(1)
    })

    it('should parse task lists', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('- [x] Done\n- [ ] Todo')

      const listItems = tree.nodes.filter((n) => n && n.type === 'listItem')
      expect(listItems.length).toBe(2)
      expect(listItems[0]?.data?.checked).toBe(true)
      expect(listItems[1]?.data?.checked).toBe(false)
    })
  })

  describe('Mixed content', () => {
    it('should parse complex markdown', () => {
      const markdown = `# Title

This is a paragraph.

## Subtitle

- Item 1
- Item 2

> A quote

\`\`\`js
code here
\`\`\`

---

More text.`

      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse(markdown)

      expect(tree.nodes.length).toBeGreaterThan(0)

      const headings = tree.nodes.filter((n) => n && n.type === 'heading')
      expect(headings.length).toBe(2)

      const paragraphs = tree.nodes.filter((n) => n && n.type === 'paragraph')
      expect(paragraphs.length).toBeGreaterThan(0)

      const listItems = tree.nodes.filter((n) => n && n.type === 'listItem')
      expect(listItems.length).toBe(2)
    })
  })

  describe('Incremental parsing', () => {
    it('should handle incremental edits', () => {
      const parser = new IncrementalMarkdownParser()

      // Initial parse
      const tree1 = parser.parse('# Hello\n\nWorld')
      const initialNodes = tree1.nodes.length

      // Edit: change "Hello" to "Hello World"
      const tree2 = parser.parseIncremental('# Hello World\n\nWorld', {
        startByte: 2,
        oldEndByte: 7,
        newEndByte: 13,
        startPosition: { line: 0, column: 2, offset: 2 },
        oldEndPosition: { line: 0, column: 7, offset: 7 },
        newEndPosition: { line: 0, column: 13, offset: 13 },
      })

      // Should still have similar structure
      expect(tree2.nodes.length).toBeGreaterThanOrEqual(initialNodes - 2)
      expect(tree2.nodes.length).toBeLessThanOrEqual(initialNodes + 2)

      // Verify heading still exists
      const headings = tree2.nodes.filter((n) => n && n.type === 'heading')
      expect(headings.length).toBe(1)
    })

    it('should handle adding new lines', () => {
      const parser = new IncrementalMarkdownParser()

      // Initial parse
      parser.parse('# Hello')

      // Add new paragraph
      const tree = parser.parseIncremental('# Hello\n\nNew paragraph', {
        startByte: 7,
        oldEndByte: 7,
        newEndByte: 22,
        startPosition: { line: 0, column: 7, offset: 7 },
        oldEndPosition: { line: 0, column: 7, offset: 7 },
        newEndPosition: { line: 2, column: 13, offset: 22 },
      })

      const paragraphs = tree.nodes.filter((n) => n && n.type === 'paragraph')
      expect(paragraphs.length).toBe(1)
    })

    it('should handle deletion', () => {
      const parser = new IncrementalMarkdownParser()

      // Initial parse
      parser.parse('# Hello\n\nWorld\n\nGoodbye')

      // Delete middle paragraph
      const tree = parser.parseIncremental('# Hello\n\nGoodbye', {
        startByte: 8,
        oldEndByte: 15,
        newEndByte: 8,
        startPosition: { line: 1, column: 0, offset: 8 },
        oldEndPosition: { line: 3, column: 0, offset: 15 },
        newEndPosition: { line: 1, column: 0, offset: 8 },
      })

      const paragraphs = tree.nodes.filter((n) => n && n.type === 'paragraph')
      expect(paragraphs.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Helper functions', () => {
    it('parseMarkdown should work as one-shot', () => {
      const tree = parseMarkdown('# Hello\n\nWorld')

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)

      const headings = tree.nodes.filter((n) => n && n.type === 'heading')
      expect(headings.length).toBe(1)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('')

      expect(tree.nodes.length).toBeGreaterThanOrEqual(1) // At least root
    })

    it('should handle single line', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('# Title')

      const headings = tree.nodes.filter((n) => n && n.type === 'heading')
      expect(headings.length).toBe(1)
    })

    it('should handle only blank lines', () => {
      const parser = new IncrementalMarkdownParser()
      const tree = parser.parse('\n\n\n')

      // Blank lines are not added as nodes
      expect(tree.nodes.length).toBeLessThanOrEqual(2) // Root + maybe some blanks
    })
  })
})
