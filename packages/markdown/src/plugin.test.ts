/**
 * Plugin System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTree } from '@sylphx/ast-core'
import type { Tree, BaseNode } from '@sylphx/ast-core'
import {
  PluginManager,
  createTransformPlugin,
  createVisitorPlugin,
  isTransformPlugin,
  isVisitorPlugin,
  remarkRemoveComments,
  remarkHeadingId,
  remarkToc,
  remarkUppercaseHeadings,
  remarkCodeLineNumbers,
  remarkWrapParagraphs,
} from './plugin.js'
import type { HeadingNode, ParagraphNode, CodeBlockNode } from './types.js'

describe('Plugin System', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTree('markdown', '# Hello\n\nWorld')

    // Add some test nodes
    const heading: HeadingNode = {
      id: 1,
      type: 'heading',
      parent: 0,
      children: [],
      depth: 1,
      text: 'Hello World',
    }

    const paragraph: ParagraphNode = {
      id: 2,
      type: 'paragraph',
      parent: 0,
      children: [],
      text: 'This is a paragraph.',
    }

    const codeBlock: CodeBlockNode = {
      id: 3,
      type: 'codeBlock',
      parent: 0,
      children: [],
      code: 'const x = 1\nconst y = 2',
      lang: 'javascript',
    }

    tree.nodes.push(heading, paragraph, codeBlock)
    tree.nodes[0]!.children = [1, 2, 3]
  })

  describe('PluginManager', () => {
    it('should register plugins', () => {
      const manager = new PluginManager()
      const plugin = createTransformPlugin(
        { name: 'test' },
        (tree) => tree
      )

      manager.use(plugin)
      expect(manager.getPlugins()).toHaveLength(1)
      expect(manager.has('test')).toBe(true)
    })

    it('should register multiple plugins', () => {
      const manager = new PluginManager()
      const plugin1 = createTransformPlugin({ name: 'test1' }, (tree) => tree)
      const plugin2 = createTransformPlugin({ name: 'test2' }, (tree) => tree)

      manager.useAll([plugin1, plugin2])
      expect(manager.getPlugins()).toHaveLength(2)
    })

    it('should remove plugins by name', () => {
      const manager = new PluginManager()
      const plugin = createTransformPlugin({ name: 'test' }, (tree) => tree)

      manager.use(plugin)
      expect(manager.has('test')).toBe(true)

      manager.remove('test')
      expect(manager.has('test')).toBe(false)
    })

    it('should clear all plugins', () => {
      const manager = new PluginManager()
      manager.use(createTransformPlugin({ name: 'test1' }, (tree) => tree))
      manager.use(createTransformPlugin({ name: 'test2' }, (tree) => tree))

      expect(manager.getPlugins()).toHaveLength(2)
      manager.clear()
      expect(manager.getPlugins()).toHaveLength(0)
    })

    it('should get plugins by type', () => {
      const manager = new PluginManager()
      const transformPlugin = createTransformPlugin({ name: 'transform' }, (tree) => tree)
      const visitorPlugin = createVisitorPlugin({ name: 'visitor' }, {})

      manager.use(transformPlugin)
      manager.use(visitorPlugin)

      const transforms = manager.getPluginsByType(isTransformPlugin)
      const visitors = manager.getPluginsByType(isVisitorPlugin)

      expect(transforms).toHaveLength(1)
      expect(visitors).toHaveLength(1)
    })
  })

  describe('Transform Plugins', () => {
    it('should apply transform plugin', async () => {
      const manager = new PluginManager()
      const plugin = createTransformPlugin(
        { name: 'add-metadata' },
        (tree) => {
          tree.meta.data = { transformed: true }
          return tree
        }
      )

      manager.use(plugin)
      const result = await manager.apply(tree)

      expect(result.meta.data).toEqual({ transformed: true })
    })

    it('should chain multiple transform plugins', async () => {
      const manager = new PluginManager()

      manager.use(
        createTransformPlugin({ name: 'plugin1' }, (tree) => {
          tree.meta.data = { count: 1 }
          return tree
        })
      )

      manager.use(
        createTransformPlugin({ name: 'plugin2' }, (tree) => {
          tree.meta.data = { ...tree.meta.data, count: (tree.meta.data?.count as number) + 1 }
          return tree
        })
      )

      const result = await manager.apply(tree)
      expect(result.meta.data?.count).toBe(2)
    })

    it('should support async transform plugins', async () => {
      const manager = new PluginManager()
      const plugin = createTransformPlugin(
        { name: 'async-transform' },
        async (tree) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          tree.meta.data = { async: true }
          return tree
        }
      )

      manager.use(plugin)
      const result = await manager.apply(tree)

      expect(result.meta.data).toEqual({ async: true })
    })
  })

  describe('Visitor Plugins', () => {
    it('should visit heading nodes', async () => {
      const manager = new PluginManager()
      let visitedHeadings = 0

      const plugin = createVisitorPlugin(
        { name: 'count-headings' },
        {
          heading: (node) => {
            visitedHeadings++
            return node
          },
        }
      )

      manager.use(plugin)
      await manager.apply(tree)

      expect(visitedHeadings).toBe(1)
    })

    it('should transform nodes with visitors', async () => {
      const manager = new PluginManager()

      const plugin = createVisitorPlugin(
        { name: 'uppercase-headings' },
        {
          heading: (node) => ({
            ...node,
            text: node.text.toUpperCase(),
          }),
        }
      )

      manager.use(plugin)
      const result = await manager.apply(tree)

      const heading = result.nodes[1] as HeadingNode
      expect(heading.text).toBe('HELLO WORLD')
    })

    it('should call setup and teardown hooks', async () => {
      const manager = new PluginManager()
      const calls: string[] = []

      const plugin = createVisitorPlugin(
        { name: 'hooks-test' },
        {
          heading: (node) => node,
        },
        {
          setup: () => {
            calls.push('setup')
          },
          teardown: () => {
            calls.push('teardown')
          },
        }
      )

      manager.use(plugin)
      await manager.apply(tree)

      expect(calls).toEqual(['setup', 'teardown'])
    })

    it('should support async setup and teardown', async () => {
      const manager = new PluginManager()
      const calls: string[] = []

      const plugin = createVisitorPlugin(
        { name: 'async-hooks' },
        {
          heading: (node) => node,
        },
        {
          setup: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            calls.push('async-setup')
          },
          teardown: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            calls.push('async-teardown')
          },
        }
      )

      manager.use(plugin)
      await manager.apply(tree)

      expect(calls).toEqual(['async-setup', 'async-teardown'])
    })
  })

  describe('Built-in Plugins', () => {
    describe('remarkHeadingId', () => {
      it('should add slugified IDs to headings', async () => {
        const manager = new PluginManager()
        manager.use(remarkHeadingId)

        const result = await manager.apply(tree)
        const heading = result.nodes[1] as HeadingNode

        expect(heading.data?.id).toBe('hello-world')
      })

      it('should handle special characters in headings', async () => {
        const heading: HeadingNode = {
          id: 1,
          type: 'heading',
          parent: 0,
          children: [],
          depth: 1,
          text: 'Hello, World! (2024)',
        }
        tree.nodes[1] = heading

        const manager = new PluginManager()
        manager.use(remarkHeadingId)

        const result = await manager.apply(tree)
        const resultHeading = result.nodes[1] as HeadingNode

        expect(resultHeading.data?.id).toBe('hello-world-2024')
      })
    })

    describe('remarkUppercaseHeadings', () => {
      it('should convert heading text to uppercase', async () => {
        const manager = new PluginManager()
        manager.use(remarkUppercaseHeadings)

        const result = await manager.apply(tree)
        const heading = result.nodes[1] as HeadingNode

        expect(heading.text).toBe('HELLO WORLD')
      })
    })

    describe('remarkCodeLineNumbers', () => {
      it('should add line numbers to code blocks', async () => {
        const manager = new PluginManager()
        manager.use(remarkCodeLineNumbers)

        const result = await manager.apply(tree)
        const codeBlock = result.nodes[3] as CodeBlockNode

        expect(codeBlock.code).toContain('  1 | const x = 1')
        expect(codeBlock.code).toContain('  2 | const y = 2')
        expect(codeBlock.data?.hasLineNumbers).toBe(true)
        expect(codeBlock.data?.originalCode).toBe('const x = 1\nconst y = 2')
      })
    })

    describe('remarkWrapParagraphs', () => {
      it('should add metadata to paragraphs', async () => {
        const manager = new PluginManager()
        manager.use(remarkWrapParagraphs)

        const result = await manager.apply(tree)
        const paragraph = result.nodes[2] as ParagraphNode

        expect(paragraph.data?.wrapped).toBe(true)
        expect(paragraph.data?.timestamp).toBeDefined()
      })
    })

    describe('remarkToc', () => {
      it('should collect headings for table of contents', async () => {
        // Add multiple headings
        const h2: HeadingNode = {
          id: 4,
          type: 'heading',
          parent: 0,
          children: [],
          depth: 2,
          text: 'Section 1',
        }
        const h3: HeadingNode = {
          id: 5,
          type: 'heading',
          parent: 0,
          children: [],
          depth: 3,
          text: 'Subsection 1.1',
        }

        tree.nodes.push(h2, h3)
        tree.nodes[0]!.children.push(4, 5)

        const manager = new PluginManager()
        // Use both plugins to add IDs and collect TOC
        manager.use(remarkHeadingId)
        manager.use(remarkToc)

        const result = await manager.apply(tree)

        expect(result.meta.data?.toc).toHaveLength(3)
        expect(result.meta.data?.toc).toEqual([
          { depth: 1, text: 'Hello World', id: 'hello-world' },
          { depth: 2, text: 'Section 1', id: 'section-1' },
          { depth: 3, text: 'Subsection 1.1', id: 'subsection-11' },
        ])
      })
    })
  })

  describe('Plugin Composition', () => {
    it('should compose multiple plugins', async () => {
      const manager = new PluginManager()

      // Chain plugins: add IDs, uppercase, collect TOC
      manager.use(remarkHeadingId)
      manager.use(remarkUppercaseHeadings)
      manager.use(remarkToc)

      const result = await manager.apply(tree)
      const heading = result.nodes[1] as HeadingNode

      // Heading should have ID and be uppercase
      expect(heading.data?.id).toBe('hello-world')
      expect(heading.text).toBe('HELLO WORLD')

      // TOC should be collected with uppercase text
      expect(result.meta.data?.toc).toEqual([
        { depth: 1, text: 'HELLO WORLD', id: 'hello-world' },
      ])
    })

    it('should apply plugins in order', async () => {
      const manager = new PluginManager()
      const order: string[] = []

      manager.use(
        createVisitorPlugin(
          { name: 'first' },
          {
            heading: (node) => {
              order.push('first')
              return node
            },
          }
        )
      )

      manager.use(
        createVisitorPlugin(
          { name: 'second' },
          {
            heading: (node) => {
              order.push('second')
              return node
            },
          }
        )
      )

      await manager.apply(tree)

      expect(order).toEqual(['first', 'second'])
    })
  })

  describe('Plugin Metadata', () => {
    it('should store plugin metadata', () => {
      const plugin = createTransformPlugin(
        {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'A test plugin',
          author: 'Test Author',
        },
        (tree) => tree
      )

      expect(plugin.meta.name).toBe('test-plugin')
      expect(plugin.meta.version).toBe('1.0.0')
      expect(plugin.meta.description).toBe('A test plugin')
      expect(plugin.meta.author).toBe('Test Author')
    })
  })
})
