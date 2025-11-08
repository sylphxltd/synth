import { describe, it, expect, beforeEach } from 'vitest'
import { createTree, addNode } from './types/tree.js'
import { createIndex, ASTIndex } from './query-index.js'

describe('Query Index', () => {
  let tree: ReturnType<typeof createTree>
  let index: ASTIndex

  beforeEach(() => {
    // Create a sample tree structure
    tree = createTree('test', 'source')

    // Add heading
    const h1 = addNode(tree, {
      type: 'heading',
      children: [],
      parent: 0,
      data: { depth: 1, text: 'Title' },
    })

    // Add paragraphs
    const p1 = addNode(tree, {
      type: 'paragraph',
      children: [],
      parent: 0,
      data: { lang: 'en' },
    })

    const p2 = addNode(tree, {
      type: 'paragraph',
      children: [],
      parent: 0,
      data: { lang: 'zh' },
    })

    // Add list
    const list = addNode(tree, {
      type: 'list',
      children: [],
      parent: 0,
      data: { ordered: true },
    })

    // Add list items
    const item1 = addNode(tree, {
      type: 'listItem',
      children: [],
      parent: list,
    })

    const item2 = addNode(tree, {
      type: 'listItem',
      children: [],
      parent: list,
    })

    tree.nodes[0].children = [h1, p1, p2, list]
    tree.nodes[list].children = [item1, item2]

    // Build index
    index = createIndex(tree)
  })

  describe('Type Index', () => {
    it('should find nodes by type', () => {
      const paragraphs = index.findByType('paragraph')
      expect(paragraphs).toHaveLength(2)

      const headings = index.findByType('heading')
      expect(headings).toHaveLength(1)

      const lists = index.findByType('list')
      expect(lists).toHaveLength(1)
    })

    it('should find nodes by multiple types', () => {
      const results = index.findByTypes(['paragraph', 'heading'])
      expect(results).toHaveLength(3)
    })

    it('should return empty array for non-existent type', () => {
      const results = index.findByType('nonexistent')
      expect(results).toEqual([])
    })

    it('should get all types', () => {
      const types = index.getTypes()
      expect(types).toContain('root')
      expect(types).toContain('heading')
      expect(types).toContain('paragraph')
      expect(types).toContain('list')
      expect(types).toContain('listItem')
    })

    it('should get type counts', () => {
      const counts = index.getTypeCounts()
      expect(counts.get('paragraph')).toBe(2)
      expect(counts.get('heading')).toBe(1)
      expect(counts.get('listItem')).toBe(2)
    })
  })

  describe('Data Index', () => {
    it('should find nodes by data attribute', () => {
      const enParagraphs = index.findByData('lang', 'en')
      expect(enParagraphs).toHaveLength(1)

      const zhParagraphs = index.findByData('lang', 'zh')
      expect(zhParagraphs).toHaveLength(1)
    })

    it('should find nodes by data value', () => {
      const orderedLists = index.findByData('ordered', true)
      expect(orderedLists).toHaveLength(1)
    })

    it('should return empty array for non-existent data', () => {
      const results = index.findByData('nonexistent', 'value')
      expect(results).toEqual([])
    })
  })

  describe('Parent-Child Index', () => {
    it('should find children of a node', () => {
      const rootChildren = index.findChildren(0)
      expect(rootChildren).toHaveLength(4)

      const listId = index.findByType('list')[0]
      const listChildren = index.findChildren(listId)
      expect(listChildren).toHaveLength(2)
    })

    it('should find parent of a node', () => {
      const listId = index.findByType('list')[0]
      const itemIds = index.findByType('listItem')

      for (const itemId of itemIds) {
        const parent = index.findParent(itemId)
        expect(parent).toBe(listId)
      }
    })

    it('should return undefined for root parent', () => {
      const parent = index.findParent(0)
      expect(parent).toBeUndefined()
    })
  })

  describe('Depth Index', () => {
    it('should find nodes at specific depth', () => {
      const depth0 = index.findByDepth(0)
      expect(depth0).toHaveLength(1) // root

      const depth1 = index.findByDepth(1)
      expect(depth1).toHaveLength(4) // h1, p1, p2, list

      const depth2 = index.findByDepth(2)
      expect(depth2).toHaveLength(2) // item1, item2
    })

    it('should find nodes in depth range', () => {
      const results = index.findByDepthRange(0, 1)
      expect(results).toHaveLength(5) // root + 4 children
    })
  })

  describe('Complex Queries', () => {
    it('should query by type and depth', () => {
      const results = index.query({
        type: 'listItem',
        depth: 2,
      })
      expect(results).toHaveLength(2)
    })

    it('should query by type and data', () => {
      const results = index.query({
        type: 'paragraph',
        data: { lang: 'en' },
      })
      expect(results).toHaveLength(1)
    })

    it('should query by parent', () => {
      const listId = index.findByType('list')[0]
      const results = index.query({
        parent: listId,
      })
      expect(results).toHaveLength(2)
    })

    it('should query by hasChildren', () => {
      const withChildren = index.query({
        hasChildren: true,
      })
      expect(withChildren.length).toBeGreaterThan(0)

      const withoutChildren = index.query({
        hasChildren: false,
      })
      expect(withoutChildren.length).toBeGreaterThan(0)
    })

    it('should query by childCount', () => {
      const exactly2Children = index.query({
        childCount: 2,
      })
      expect(exactly2Children).toHaveLength(1) // list has 2 items
    })

    it('should query by childCount range', () => {
      const results = index.query({
        childCount: { min: 1, max: 5 },
      })
      expect(results.length).toBeGreaterThan(0)
    })

    it('should combine multiple query conditions', () => {
      const results = index.query({
        type: 'paragraph',
        depth: 1,
        data: { lang: 'en' },
      })
      expect(results).toHaveLength(1)
    })
  })

  describe('Performance', () => {
    it('should be much faster than linear scan for type queries', () => {
      // Create larger tree
      const bigTree = createTree('test', 'source')
      const itemIds = []

      for (let i = 0; i < 1000; i++) {
        const id = addNode(bigTree, {
          type: i % 3 === 0 ? 'heading' : 'paragraph',
          children: [],
          parent: 0,
        })
        itemIds.push(id)
      }
      bigTree.nodes[0].children = itemIds

      // Build index
      const bigIndex = createIndex(bigTree)

      // Indexed query
      const indexedStart = performance.now()
      for (let i = 0; i < 100; i++) {
        bigIndex.findByType('heading')
      }
      const indexedTime = performance.now() - indexedStart

      // Linear scan
      const linearStart = performance.now()
      for (let i = 0; i < 100; i++) {
        bigTree.nodes.filter((n) => n.type === 'heading')
      }
      const linearTime = performance.now() - linearStart

      // Indexed should be significantly faster
      expect(indexedTime).toBeLessThan(linearTime)
    })

    it('should handle large indexes efficiently', () => {
      // Create very large tree
      const hugeTree = createTree('test', 'source')

      for (let i = 0; i < 10000; i++) {
        addNode(hugeTree, {
          type: `type${i % 10}`,
          children: [],
          parent: 0,
          data: { value: i % 100 },
        })
      }

      const start = performance.now()
      const hugeIndex = createIndex(hugeTree)
      const buildTime = performance.now() - start

      // Building index should be reasonably fast
      expect(buildTime).toBeLessThan(100)

      // Queries should be instant
      const queryStart = performance.now()
      hugeIndex.findByType('type5')
      hugeIndex.findByData('value', 42)
      const queryTime = performance.now() - queryStart

      expect(queryTime).toBeLessThan(10)
    })
  })

  describe('Statistics', () => {
    it('should provide index statistics', () => {
      const stats = index.getStats()

      expect(stats.typeIndexSize).toBeGreaterThan(0)
      expect(stats.totalNodes).toBeGreaterThan(0)
      expect(stats.indexedTypes).toBeGreaterThan(0)
      expect(stats.memoryEstimate).toBeGreaterThan(0)
    })
  })

  describe('Rebuild', () => {
    it('should rebuild index after tree modification', () => {
      const initialHeadings = index.findByType('heading')
      expect(initialHeadings).toHaveLength(1)

      // Add new heading
      const newHeading = addNode(tree, {
        type: 'heading',
        children: [],
        parent: 0,
        data: { depth: 2 },
      })
      tree.nodes[0].children.push(newHeading)

      // Rebuild index
      index.rebuild()

      const updatedHeadings = index.findByType('heading')
      expect(updatedHeadings).toHaveLength(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty tree', () => {
      const emptyTree = createTree('test', 'source')
      const emptyIndex = createIndex(emptyTree)

      const results = emptyIndex.findByType('paragraph')
      expect(results).toEqual([])
    })

    it('should throw if querying before build', () => {
      const unbuildIndex = new ASTIndex(tree)
      unbuildIndex.clear()

      expect(() => unbuildIndex.findByType('heading')).toThrow()
    })
  })
})
