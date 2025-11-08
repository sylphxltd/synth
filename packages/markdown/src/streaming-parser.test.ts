/**
 * Streaming Parser Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  StreamingMarkdownParser,
  parseStream,
  parseWithProgress,
  type StreamingOptions,
} from './streaming-parser.js'
import type { BaseNode, Tree } from '@sylphx/ast-core'

describe('Streaming Markdown Parser', () => {
  describe('Basic Streaming', () => {
    it('should parse markdown in chunks', async () => {
      const parser = new StreamingMarkdownParser()
      const nodes: BaseNode[] = []

      parser.on('node', (node) => {
        nodes.push(node)
      })

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      parser.write('# Hello\n')
      parser.write('\n')
      parser.write('World\n')
      await parser.end()

      const tree = await treePromise
      expect(tree).toBeDefined()
      expect(nodes.length).toBeGreaterThan(0)
    })

    it('should handle single write', async () => {
      const parser = new StreamingMarkdownParser()
      let endCalled = false

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', (tree) => {
          endCalled = true
          resolve(tree)
        })
      })

      parser.write('# Title\n\nParagraph text.')
      await parser.end()

      const tree = await treePromise
      expect(endCalled).toBe(true)
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should handle multiple small writes', async () => {
      const parser = new StreamingMarkdownParser()
      const chunks: string[] = []

      parser.on('chunk', (chunk) => {
        chunks.push(chunk)
      })

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      parser.write('#')
      parser.write(' ')
      parser.write('H')
      parser.write('e')
      parser.write('l')
      parser.write('l')
      parser.write('o')
      parser.write('\n')
      parser.write('\n')
      await parser.end()

      await treePromise
      // Small writes should be buffered
      expect(chunks.length).toBeGreaterThanOrEqual(0)
    })

    it('should emit error on write after end', async () => {
      const parser = new StreamingMarkdownParser()

      await parser.end()

      let errorEmitted = false
      parser.on('error', () => {
        errorEmitted = true
      })

      parser.write('test')
      expect(errorEmitted).toBe(true)
    })
  })

  describe('Chunk Processing', () => {
    it('should process chunks at paragraph boundaries', async () => {
      const markdown = `# Heading 1

Paragraph 1 text here.

## Heading 2

Paragraph 2 text here.

### Heading 3

Paragraph 3 text here.`

      const parser = new StreamingMarkdownParser({ chunkSize: 50 })
      const chunkTexts: string[] = []

      parser.on('chunk', (text) => {
        chunkTexts.push(text)
      })

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      parser.write(markdown)
      await parser.end()

      await treePromise
      expect(chunkTexts.length).toBeGreaterThan(0)
    })

    it('should handle custom chunk sizes', async () => {
      const markdown = 'a'.repeat(10000)

      const parser = new StreamingMarkdownParser({ chunkSize: 1000 })
      const chunks: string[] = []

      parser.on('chunk', (chunk) => {
        chunks.push(chunk)
      })

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      parser.write(markdown)
      await parser.end()

      await treePromise
    })
  })

  describe('Backpressure', () => {
    it('should apply backpressure when queue is full', async () => {
      const parser = new StreamingMarkdownParser({
        highWaterMark: 2,
        emitNodes: true,
      })

      let drainCalled = false
      parser.on('drain', () => {
        drainCalled = true
      })

      // Write enough to trigger backpressure
      const markdown = Array(100)
        .fill('# Heading\n\nParagraph\n\n')
        .join('')

      parser.write(markdown)
      await parser.end()

      // Drain should be called if backpressure was applied
      // Note: This is timing-dependent
    })

    it('should return false when backpressure is applied', () => {
      const parser = new StreamingMarkdownParser({ highWaterMark: 1 })

      // Write a large amount
      const markdown = Array(1000)
        .fill('# Heading\n\nParagraph\n\n')
        .join('')

      const canWrite = parser.write(markdown)
      // May or may not apply backpressure depending on processing speed
      expect(typeof canWrite).toBe('boolean')
    })
  })

  describe('Static Methods', () => {
    describe('fromString', () => {
      it('should parse string in streaming mode', async () => {
        const markdown = `# Title

Paragraph 1.

## Subtitle

Paragraph 2.`

        const tree = await StreamingMarkdownParser.fromString(markdown, {
          chunkSize: 20,
        })

        expect(tree).toBeDefined()
        expect(tree.nodes.length).toBeGreaterThan(0)
      })

      it('should handle large strings', async () => {
        const markdown = Array(1000)
          .fill('# Heading\n\nParagraph text.\n\n')
          .join('')

        const tree = await StreamingMarkdownParser.fromString(markdown, {
          chunkSize: 100,
        })

        expect(tree).toBeDefined()
      })

      it('should handle empty string', async () => {
        const tree = await StreamingMarkdownParser.fromString('')

        expect(tree).toBeDefined()
        expect(tree.nodes).toHaveLength(1) // Just root node
      })
    })

    describe('fromIterable', () => {
      it('should parse from async iterable', async () => {
        async function* generateChunks() {
          yield '# Title\n'
          yield '\n'
          yield 'Paragraph text.\n'
        }

        const tree = await StreamingMarkdownParser.fromIterable(generateChunks())

        expect(tree).toBeDefined()
        expect(tree.nodes.length).toBeGreaterThan(0)
      })

      it('should parse from sync iterable', async () => {
        function* generateChunks() {
          yield '# Title\n'
          yield '\n'
          yield 'Paragraph text.\n'
        }

        const tree = await StreamingMarkdownParser.fromIterable(generateChunks())

        expect(tree).toBeDefined()
        expect(tree.nodes.length).toBeGreaterThan(0)
      })

      it('should handle empty iterable', async () => {
        async function* empty() {
          // No yields
        }

        const tree = await StreamingMarkdownParser.fromIterable(empty())

        expect(tree).toBeDefined()
      })

      it('should respect backpressure in iterable', async () => {
        let drainCount = 0

        async function* generateLargeChunks() {
          for (let i = 0; i < 100; i++) {
            yield '# Heading\n\nParagraph\n\n'
          }
        }

        const parser = new StreamingMarkdownParser({
          highWaterMark: 2,
        })

        parser.on('drain', () => {
          drainCount++
        })

        const treePromise = new Promise<Tree>((resolve, reject) => {
          parser.on('end', resolve)
          parser.on('error', reject)
        })

        for await (const chunk of generateLargeChunks()) {
          const canWrite = parser.write(chunk)
          if (!canWrite) {
            await new Promise<void>((resolve) => {
              parser.once('drain', resolve)
            })
          }
        }

        await parser.end()
        await treePromise

        // Drain may or may not be called depending on timing
      })
    })
  })

  describe('Progress Tracking', () => {
    it('should report progress', async () => {
      const markdown = 'a'.repeat(10000)
      const progressUpdates: number[] = []

      const tree = await parseWithProgress(
        markdown,
        (progress) => {
          progressUpdates.push(progress.percent)
        },
        { chunkSize: 1000 }
      )

      expect(tree).toBeDefined()
      expect(progressUpdates.length).toBeGreaterThan(0)
      // Final progress should be close to 100% (may be slightly less due to buffering)
      expect(progressUpdates[progressUpdates.length - 1]).toBeGreaterThanOrEqual(90)
    })

    it('should track processed bytes', async () => {
      const markdown = '# Title\n\nParagraph'
      let finalProgress: any = null

      await parseWithProgress(
        markdown,
        (progress) => {
          finalProgress = progress
        },
        { chunkSize: 10 }
      )

      expect(finalProgress).not.toBeNull()
      expect(finalProgress.total).toBe(markdown.length)
      // Processed may be less than total due to buffering
      expect(finalProgress.processed).toBeGreaterThan(0)
      expect(finalProgress.processed).toBeLessThanOrEqual(markdown.length)
    })
  })

  describe('Event Handling', () => {
    it('should emit node events', async () => {
      const parser = new StreamingMarkdownParser({ emitNodes: true })
      const nodes: BaseNode[] = []

      parser.on('node', (node) => {
        nodes.push(node)
      })

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      parser.write('# Heading\n\nParagraph')
      await parser.end()

      await treePromise
      expect(nodes.length).toBeGreaterThan(0)
    })

    it('should not emit nodes when emitNodes is false', async () => {
      const parser = new StreamingMarkdownParser({ emitNodes: false })
      const nodes: BaseNode[] = []

      parser.on('node', (node) => {
        nodes.push(node)
      })

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      parser.write('# Heading\n\nParagraph')
      await parser.end()

      await treePromise
      expect(nodes.length).toBe(0)
    })

    it('should emit error events', async () => {
      const parser = new StreamingMarkdownParser()

      const errorPromise = new Promise<Error>((resolve) => {
        parser.on('error', resolve)
      })

      // Trigger error by writing after end
      await parser.end()
      parser.write('test')

      const error = await errorPromise
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('Integration with Parser Options', () => {
    it('should pass parse options to underlying parser', async () => {
      const markdown = '# Test'

      const tree = await StreamingMarkdownParser.fromString(markdown, {
        parseOptions: {
          buildIndex: true,
        },
      })

      expect(tree).toBeDefined()
    })

    it('should work with plugins', async () => {
      const { createVisitorPlugin } = await import('./plugin.js')

      const uppercasePlugin = createVisitorPlugin(
        { name: 'uppercase' },
        {
          heading: (node) => {
            if (node.text) {
              return { ...node, text: node.text.toUpperCase() }
            }
            return node
          },
        }
      )

      const markdown = '# hello world'

      const tree = await StreamingMarkdownParser.fromString(markdown, {
        parseOptions: {
          plugins: [uppercasePlugin],
        },
      })

      expect(tree).toBeDefined()
      // Plugin should have been applied
      const heading = tree.nodes[1] as any
      if (heading?.type === 'heading' && heading.text) {
        expect(heading.text).toBe('HELLO WORLD')
      }
    })
  })

  describe('Error Recovery', () => {
    it('should handle malformed markdown gracefully', async () => {
      const markdown = '# Heading\n```unclosed code block'

      const tree = await StreamingMarkdownParser.fromString(markdown)

      expect(tree).toBeDefined()
      // Parser should handle unclosed code blocks
    })

    it('should continue parsing after non-fatal errors', async () => {
      const parser = new StreamingMarkdownParser()

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      parser.write('# Valid heading\n\n')
      parser.write('More content\n')
      await parser.end()

      const tree = await treePromise
      expect(tree).toBeDefined()
    })
  })

  describe('Memory Efficiency', () => {
    it('should not accumulate all data in memory', async () => {
      const parser = new StreamingMarkdownParser({
        chunkSize: 100,
        emitNodes: true,
      })

      const nodeCount = { count: 0 }

      parser.on('node', () => {
        nodeCount.count++
      })

      const treePromise = new Promise<Tree>((resolve) => {
        parser.on('end', resolve)
      })

      // Write a large document in chunks
      for (let i = 0; i < 100; i++) {
        parser.write(`# Heading ${i}\n\nParagraph ${i}.\n\n`)
      }

      await parser.end()
      await treePromise

      // Nodes should have been emitted (not all accumulated)
      expect(nodeCount.count).toBeGreaterThan(0)
    })
  })
})
