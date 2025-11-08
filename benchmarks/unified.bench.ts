/**
 * Benchmark: Flux AST vs unified/remark
 */

import { describe, bench } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

import { flux } from '../src/index.js'
import { markdown } from '../src/adapters/index.js'
import { smallMarkdown, mediumMarkdown, largeMarkdown } from './test-data.js'

// Setup
const fluxProcessor = flux().adapter('markdown', markdown())

const unifiedProcessor = unified()
  .use(remarkParse)
  .use(remarkStringify)

describe('Parse Performance', () => {
  bench('flux: parse small (1KB)', async () => {
    await fluxProcessor.parse(smallMarkdown, 'markdown')
  })

  bench('unified: parse small (1KB)', async () => {
    await unifiedProcessor.process(smallMarkdown)
  })

  bench('flux: parse medium (3KB)', async () => {
    await fluxProcessor.parse(mediumMarkdown, 'markdown')
  })

  bench('unified: parse medium (3KB)', async () => {
    await unifiedProcessor.process(mediumMarkdown)
  })

  bench('flux: parse large (10KB)', async () => {
    await fluxProcessor.parse(largeMarkdown, 'markdown')
  })

  bench('unified: parse large (10KB)', async () => {
    await unifiedProcessor.process(largeMarkdown)
  })
})

describe('Parse + Compile Performance', () => {
  bench('flux: parse + compile small', async () => {
    const chain = await fluxProcessor.parse(smallMarkdown, 'markdown')
    await chain.compile('markdown')
  })

  bench('unified: parse + compile small', async () => {
    await unifiedProcessor.process(smallMarkdown)
  })

  bench('flux: parse + compile medium', async () => {
    const chain = await fluxProcessor.parse(mediumMarkdown, 'markdown')
    await chain.compile('markdown')
  })

  bench('unified: parse + compile medium', async () => {
    await unifiedProcessor.process(mediumMarkdown)
  })

  bench('flux: parse + compile large', async () => {
    const chain = await fluxProcessor.parse(largeMarkdown, 'markdown')
    await chain.compile('markdown')
  })

  bench('unified: parse + compile large', async () => {
    await unifiedProcessor.process(largeMarkdown)
  })
})

describe('Transform Performance', () => {
  bench('flux: transform (increment headings)', async () => {
    const chain = await fluxProcessor.parse(mediumMarkdown, 'markdown')
    await chain.transform(tree => {
      for (const node of tree.nodes) {
        if (node.type === 'heading') {
          const depth = (node.data?.['depth'] as number) ?? 1
          if (depth < 6) {
            node.data = { ...node.data, depth: (depth + 1) as 1 | 2 | 3 | 4 | 5 | 6 }
          }
        }
      }
      return tree
    })
  })

  bench('unified: transform (increment headings)', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(() => (tree: any) => {
        function visit(node: any) {
          if (node.type === 'heading' && node.depth < 6) {
            node.depth++
          }
          if (node.children) {
            node.children.forEach(visit)
          }
        }
        visit(tree)
      })
      .use(remarkStringify)

    await processor.process(mediumMarkdown)
  })
})

describe('Tree Traversal Performance', () => {
  bench('flux: traverse and count nodes', async () => {
    const chain = await fluxProcessor.parse(largeMarkdown, 'markdown')
    const tree = chain.getTree()
    let count = 0

    for (const node of tree.nodes) {
      count++
    }
  })

  bench('unified: traverse and count nodes', async () => {
    const result = await unifiedProcessor.parse(largeMarkdown)
    let count = 0

    function visit(node: any) {
      count++
      if (node.children) {
        node.children.forEach(visit)
      }
    }
    visit(result)
  })

  bench('flux: find all headings', async () => {
    const chain = await fluxProcessor.parse(largeMarkdown, 'markdown')
    const tree = chain.getTree()
    const headings = tree.nodes.filter(node => node.type === 'heading')
  })

  bench('unified: find all headings', async () => {
    const result = await unifiedProcessor.parse(largeMarkdown)
    const headings: any[] = []

    function visit(node: any) {
      if (node.type === 'heading') {
        headings.push(node)
      }
      if (node.children) {
        node.children.forEach(visit)
      }
    }
    visit(result)
  })
})

describe('Memory Efficiency', () => {
  bench('flux: create 100 trees', async () => {
    for (let i = 0; i < 100; i++) {
      await fluxProcessor.parse(smallMarkdown, 'markdown')
    }
  })

  bench('unified: create 100 trees', async () => {
    for (let i = 0; i < 100; i++) {
      await unifiedProcessor.parse(smallMarkdown)
    }
  })
})
