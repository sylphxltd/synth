/**
 * Comprehensive benchmark comparison
 */

import { describe, bench } from 'vitest'
import { flux } from '../src/index.js'
import { markdown } from '../src/adapters/index.js'
import { mediumMarkdown, largeMarkdown } from './test-data.js'

// Setup flux
const processor = flux().adapter('markdown', markdown())

describe('Core Operations Benchmark', () => {
  bench('baseline: string length calculation', () => {
    const len = mediumMarkdown.length
    const lines = mediumMarkdown.split('\n').length
    return { len, lines }
  })

  bench('flux: full pipeline (parse + transform + compile)', async () => {
    const chain = await processor.parse(mediumMarkdown, 'markdown')

    await chain.transform(tree => {
      // Simple transform
      for (const node of tree.nodes) {
        if (node.type === 'heading') {
          const depth = (node.data?.['depth'] as number) ?? 1
          if (depth < 6) {
            node.data = { ...node.data, depth: depth + 1 }
          }
        }
      }
      return tree
    })

    await chain.compile('markdown')
  })
})

describe('Tree Operations', () => {
  bench('create tree from medium markdown', async () => {
    await processor.parse(mediumMarkdown, 'markdown')
  })

  bench('create tree from large markdown', async () => {
    await processor.parse(largeMarkdown, 'markdown')
  })

  bench('traverse entire tree (medium)', async () => {
    const chain = await processor.parse(mediumMarkdown, 'markdown')
    const tree = chain.getTree()

    let count = 0
    for (const node of tree.nodes) {
      count++
      // Simulate some work
      const type = node.type
      const hasChildren = node.children.length > 0
    }

    return count
  })

  bench('filter nodes by type (headings)', async () => {
    const chain = await processor.parse(largeMarkdown, 'markdown')
    const tree = chain.getTree()

    const headings = tree.nodes.filter(n => n.type === 'heading')
    return headings.length
  })

  bench('map over all nodes', async () => {
    const chain = await processor.parse(mediumMarkdown, 'markdown')
    const tree = chain.getTree()

    const types = tree.nodes.map(n => n.type)
    return types.length
  })
})

describe('Transform Operations', () => {
  bench('simple transform (increment depth)', async () => {
    const chain = await processor.parse(mediumMarkdown, 'markdown')

    await chain.transform(tree => {
      for (const node of tree.nodes) {
        if (node.type === 'heading') {
          const depth = (node.data?.['depth'] as number) ?? 1
          if (depth < 6) {
            node.data = { ...node.data, depth: depth + 1 }
          }
        }
      }
      return tree
    })
  })

  bench('complex transform (multiple operations)', async () => {
    const chain = await processor.parse(mediumMarkdown, 'markdown')

    await chain.transform(tree => {
      for (const node of tree.nodes) {
        // Multiple checks
        if (node.type === 'heading') {
          const depth = (node.data?.['depth'] as number) ?? 1
          node.data = { ...node.data, depth: Math.min(depth + 1, 6), processed: true }
        } else if (node.type === 'paragraph') {
          node.data = { ...node.data, type: 'processed-paragraph' }
        } else if (node.type === 'text') {
          const value = node.data?.['value'] as string
          if (value) {
            node.data = { ...node.data, length: value.length }
          }
        }
      }
      return tree
    })
  })

  bench('chained transforms (3 transforms)', async () => {
    const chain = await processor.parse(mediumMarkdown, 'markdown')

    await chain
      .transform(tree => {
        for (const node of tree.nodes) {
          if (node.type === 'heading') {
            node.data = { ...node.data, pass: 1 }
          }
        }
        return tree
      })
      .transform(tree => {
        for (const node of tree.nodes) {
          if (node.type === 'paragraph') {
            node.data = { ...node.data, pass: 2 }
          }
        }
        return tree
      })
      .transform(tree => {
        for (const node of tree.nodes) {
          node.data = { ...node.data, final: true }
        }
        return tree
      })
  })
})

describe('Compilation Performance', () => {
  bench('compile small tree to markdown', async () => {
    const chain = await processor.parse(mediumMarkdown, 'markdown')
    await chain.compile('markdown')
  })

  bench('compile large tree to markdown', async () => {
    const chain = await processor.parse(largeMarkdown, 'markdown')
    await chain.compile('markdown')
  })
})

describe('Stress Test', () => {
  bench('process 50 documents', async () => {
    for (let i = 0; i < 50; i++) {
      const chain = await processor.parse(mediumMarkdown, 'markdown')
      await chain.compile('markdown')
    }
  })

  bench('parse 100 documents (parallel)', async () => {
    const promises = Array.from({ length: 100 }, () =>
      processor.parse(mediumMarkdown, 'markdown')
    )
    await Promise.all(promises)
  })
})
