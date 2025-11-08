/**
 * Basic usage examples
 */

import { flux } from '../src/index.js'
import { markdown } from '../src/adapters/index.js'

async function basicExample() {
  console.log('=== Basic Markdown Parsing ===\n')

  const processor = flux().adapter('markdown', markdown())

  const source = `# Hello World

This is a paragraph.

## Subheading

- Item 1
- Item 2
- Item 3
`

  const chain = await processor.parse(source, 'markdown')
  const tree = chain.getTree()

  console.log('Parsed tree nodes:', tree.nodes.length)
  console.log('\nTree structure:')
  console.log(JSON.stringify(tree.nodes, null, 2))

  // Compile back to markdown
  const output = await chain.compile()
  console.log('\n=== Compiled output ===\n')
  console.log(output)
}

async function transformExample() {
  console.log('\n\n=== Transform Example ===\n')

  const processor = flux().adapter('markdown', markdown())

  const source = `# Heading
## Subheading
### Sub-subheading`

  const chain = await processor.parse(source, 'markdown')

  // Transform: increase all heading depths by 1
  await chain.transform((tree) => {
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

  const output = await chain.compile()
  console.log('Transformed markdown:')
  console.log(output)
}

async function zipperExample() {
  console.log('\n\n=== Zipper Navigation Example ===\n')

  const processor = flux().adapter('markdown', markdown())

  const source = `# Title
Paragraph text`

  const chain = await processor.parse(source, 'markdown')
  const zipper = chain.zipper()

  console.log('Initial focus:', zipper.tree.nodes[zipper.focus]?.type)

  const { down, getFocus } = await import('../src/core/zipper.js')

  const moved = down(zipper)
  if (moved) {
    console.log('After moving down:', getFocus(moved)?.type)
  }
}

// Run examples
;(async () => {
  try {
    await basicExample()
    await transformExample()
    await zipperExample()
  } catch (error) {
    console.error('Error:', error)
  }
})()
