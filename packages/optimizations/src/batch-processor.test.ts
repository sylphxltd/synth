import { describe, it, expect } from 'vitest'
import { createTree, addNode } from '@sylphx/ast-core'
import type { BaseNode } from '@sylphx/ast-core'
import {
  batchProcess,
  batchTraverse,
  batchSelect,
  batchTransform,
  batchMap,
  batchFilter,
} from './batch-processor.js'

describe('Batch Processor', () => {
  describe('batchTraverse', () => {
    it('should traverse all nodes in batches', () => {
      const tree = createTree('test', 'source')
      const child1Id = addNode(tree, { type: 'child', children: [], parent: 0 })
      const child2Id = addNode(tree, { type: 'child', children: [], parent: 0 })
      tree.nodes[0].children = [child1Id, child2Id]

      const visited: string[] = []

      batchTraverse(tree, {
        batch: (nodes) => {
          for (const node of nodes) {
            visited.push(node.type)
          }
        },
      })

      expect(visited).toEqual(['root', 'child', 'child'])
    })

    it('should group nodes by type when groupByType is true', () => {
      const tree = createTree('test', 'source')
      const para1Id = addNode(tree, { type: 'paragraph', children: [], parent: 0 })
      const headingId = addNode(tree, { type: 'heading', children: [], parent: 0 })
      const para2Id = addNode(tree, { type: 'paragraph', children: [], parent: 0 })
      tree.nodes[0].children = [para1Id, headingId, para2Id]

      const batches: string[][] = []

      batchTraverse(
        tree,
        {
          paragraph: (nodes) => {
            batches.push(nodes.map((n) => n.type))
          },
          heading: (nodes) => {
            batches.push(nodes.map((n) => n.type))
          },
          root: (nodes) => {
            batches.push(nodes.map((n) => n.type))
          },
        },
        { groupByType: true }
      )

      // Should have 3 batches: root, paragraphs, heading
      expect(batches).toHaveLength(3)
      expect(batches).toContainEqual(['root'])
      expect(batches).toContainEqual(['paragraph', 'paragraph'])
      expect(batches).toContainEqual(['heading'])
    })

    it('should respect custom batch size', () => {
      const tree = createTree('test', 'source')

      // Add 10 children
      const childIds = []
      for (let i = 0; i < 10; i++) {
        const childId = addNode(tree, { type: 'item', children: [], parent: 0 })
        childIds.push(childId)
      }
      tree.nodes[0].children = childIds

      const batchSizes: number[] = []

      batchTraverse(
        tree,
        {
          batch: (nodes) => {
            batchSizes.push(nodes.length)
          },
        },
        { batchSize: 3, groupByType: false }
      )

      // With 11 total nodes (root + 10 children) and batch size 3:
      // Batches: [3, 3, 3, 2]
      expect(batchSizes).toEqual([3, 3, 3, 2])
    })
  })

  describe('batchSelect', () => {
    it('should select nodes matching predicate', () => {
      const tree = createTree('test', 'source')
      const heading1Id = addNode(tree, {
        type: 'heading',
        children: [],
        parent: 0,
        data: { depth: 1 },
      })
      const paraId = addNode(tree, { type: 'paragraph', children: [], parent: 0 })
      const heading2Id = addNode(tree, {
        type: 'heading',
        children: [],
        parent: 0,
        data: { depth: 2 },
      })
      tree.nodes[0].children = [heading1Id, paraId, heading2Id]

      const headings = batchSelect(tree, (node) => node.type === 'heading')

      expect(headings).toHaveLength(2)
      expect(headings.map((n) => n.type)).toEqual(['heading', 'heading'])
    })

    it('should return empty array when no matches', () => {
      const tree = createTree('test', 'source')
      const results = batchSelect(tree, (node) => node.type === 'nonexistent')

      expect(results).toEqual([])
    })
  })

  describe('batchTransform', () => {
    it('should transform matching nodes', () => {
      const tree = createTree('test', 'source')
      const heading1Id = addNode(tree, {
        type: 'heading',
        children: [],
        parent: 0,
        data: { depth: 1 },
      })
      const heading2Id = addNode(tree, {
        type: 'heading',
        children: [],
        parent: 0,
        data: { depth: 2 },
      })
      tree.nodes[0].children = [heading1Id, heading2Id]

      // Increase all heading depths by 1
      batchTransform(
        tree,
        (node) => node.type === 'heading',
        (node) => ({
          ...node,
          data: { ...node.data, depth: (node.data?.depth as number) + 1 },
        })
      )

      expect(tree.nodes[heading1Id].data?.depth).toBe(2)
      expect(tree.nodes[heading2Id].data?.depth).toBe(3)
    })

    it('should not transform non-matching nodes', () => {
      const tree = createTree('test', 'source')
      const paraId = addNode(tree, {
        type: 'paragraph',
        children: [],
        parent: 0,
        data: { value: 'original' },
      })
      tree.nodes[0].children = [paraId]

      batchTransform(
        tree,
        (node) => node.type === 'heading',
        (node) => ({ ...node, data: { value: 'modified' } })
      )

      expect(tree.nodes[paraId].data?.value).toBe('original')
    })
  })

  describe('batchMap', () => {
    it('should apply function to all nodes', () => {
      const tree = createTree('test', 'source')
      const child1Id = addNode(tree, { type: 'item', children: [], parent: 0 })
      const child2Id = addNode(tree, { type: 'item', children: [], parent: 0 })
      tree.nodes[0].children = [child1Id, child2Id]

      // Add a flag to all nodes
      batchMap(tree, (node) => ({
        ...node,
        data: { ...node.data, processed: true },
      }))

      expect(tree.nodes[0].data?.processed).toBe(true)
      expect(tree.nodes[child1Id].data?.processed).toBe(true)
      expect(tree.nodes[child2Id].data?.processed).toBe(true)
    })
  })

  describe('batchFilter', () => {
    it('should filter nodes by predicate', () => {
      const tree = createTree('test', 'source')
      const headingId = addNode(tree, { type: 'heading', children: [], parent: 0 })
      const para1Id = addNode(tree, { type: 'paragraph', children: [], parent: 0 })
      const para2Id = addNode(tree, { type: 'paragraph', children: [], parent: 0 })
      tree.nodes[0].children = [headingId, para1Id, para2Id]

      const paragraphs = batchFilter(tree, (node) => node.type === 'paragraph')

      expect(paragraphs).toHaveLength(2)
      expect(paragraphs.map((n) => n.type)).toEqual(['paragraph', 'paragraph'])
    })
  })

  describe('batchProcess', () => {
    it('should process specific node IDs', () => {
      const tree = createTree('test', 'source')
      const child1Id = addNode(tree, { type: 'item', children: [], parent: 0 })
      const child2Id = addNode(tree, { type: 'item', children: [], parent: 0 })
      const child3Id = addNode(tree, { type: 'item', children: [], parent: 0 })
      tree.nodes[0].children = [child1Id, child2Id, child3Id]

      const visited: number[] = []

      // Process only child1 and child3
      batchProcess(
        tree,
        [child1Id, child3Id],
        {
          batch: (nodes) => {
            for (const node of nodes) {
              visited.push(node.id)
            }
          },
        }
      )

      expect(visited).toEqual([child1Id, child3Id])
    })
  })

  describe('Performance characteristics', () => {
    it('should handle large trees efficiently', () => {
      const tree = createTree('test', 'source')

      // Create a tree with 1000 nodes
      const childIds = []
      for (let i = 0; i < 1000; i++) {
        const childId = addNode(tree, { type: 'item', children: [], parent: 0 })
        childIds.push(childId)
      }
      tree.nodes[0].children = childIds

      let count = 0
      const start = performance.now()

      batchTraverse(tree, {
        batch: (nodes) => {
          count += nodes.length
        },
      })

      const duration = performance.now() - start

      expect(count).toBe(1001) // root + 1000 children
      expect(duration).toBeLessThan(10) // Should be very fast
    })
  })
})
