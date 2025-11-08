/**
 * Functional composition examples
 */

import { flux } from '../src/index.js'
import { markdown } from '../src/adapters/index.js'
import { compose, pipe, tap, timed } from '../src/api/index.js'
import type { Tree } from '../src/types/index.js'

// Example transforms
const incrementHeadings = async (tree: Tree) => {
  for (const node of tree.nodes) {
    if (node.type === 'heading') {
      const depth = (node.data?.['depth'] as number) ?? 1
      if (depth < 6) {
        node.data = { ...node.data, depth: (depth + 1) as 1 | 2 | 3 | 4 | 5 | 6 }
      }
    }
  }
  return tree
}

const logTree = async (tree: Tree) => {
  console.log(`Tree has ${tree.nodes.length} nodes`)
  return tree
}

const addMetadata = async (tree: Tree) => {
  tree.meta.data = {
    ...tree.meta.data,
    processed: true,
    timestamp: Date.now(),
  }
  return tree
}

async function compositionExample() {
  console.log('=== Composition Example ===\n')

  const processor = flux().adapter('markdown', markdown())

  const source = `# Title
## Subtitle
Content here`

  // Compose multiple transforms
  const pipeline = compose(
    tap((tree) => console.log('Starting transform...')),
    timed(incrementHeadings, 'increment headings'),
    addMetadata,
    logTree
  )

  const chain = await processor.parse(source, 'markdown')
  await chain.transform(pipeline)

  const output = await chain.compile()
  console.log('\nFinal output:')
  console.log(output)

  console.log('\nTree metadata:')
  console.log(chain.getTree().meta.data)
}

async function pipeExample() {
  console.log('\n\n=== Pipe Example ===\n')

  const processor = flux().adapter('markdown', markdown())

  const source = `# Original`

  // Pipe style (same as compose)
  const transform = pipe(
    incrementHeadings,
    incrementHeadings, // Apply twice
    tap((tree) => console.log('Headings incremented twice'))
  )

  const chain = await processor.parse(source, 'markdown')
  await chain.transform(transform)

  const output = await chain.compile()
  console.log('Output:', output)
}

// Run examples
;(async () => {
  try {
    await compositionExample()
    await pipeExample()
  } catch (error) {
    console.error('Error:', error)
  }
})()
