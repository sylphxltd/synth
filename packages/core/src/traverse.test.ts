import { describe, it, expect } from 'vitest'
import { createTree, addNode } from './types/index.js'
import { traverse, select, selectByType } from './traverse.js'
import { TraversalOrder } from './types/index.js'

describe('traverse', () => {
  it('should traverse tree in pre-order', () => {
    const tree = createTree('test', '')

    // Build tree: root -> [a, b] where a -> [c]
    const aId = addNode(tree, { type: 'a', parent: 0, children: [] })
    const bId = addNode(tree, { type: 'b', parent: 0, children: [] })
    const cId = addNode(tree, { type: 'c', parent: aId, children: [] })

    tree.nodes[0]!.children = [aId, bId]
    tree.nodes[aId]!.children = [cId]

    const visited: string[] = []

    traverse(tree, {
      enter: (ctx) => {
        visited.push(ctx.node.type)
      },
    })

    expect(visited).toEqual(['root', 'a', 'c', 'b'])
  })

  it('should traverse tree in post-order', () => {
    const tree = createTree('test', '')

    const aId = addNode(tree, { type: 'a', parent: 0, children: [] })
    const bId = addNode(tree, { type: 'b', parent: 0, children: [] })
    const cId = addNode(tree, { type: 'c', parent: aId, children: [] })

    tree.nodes[0]!.children = [aId, bId]
    tree.nodes[aId]!.children = [cId]

    const visited: string[] = []

    traverse(
      tree,
      {
        leave: (ctx) => {
          visited.push(ctx.node.type)
        },
      },
      { order: TraversalOrder.PostOrder }
    )

    expect(visited).toEqual(['c', 'a', 'b', 'root'])
  })

  it('should select nodes by predicate', () => {
    const tree = createTree('test', '')

    const aId = addNode(tree, { type: 'heading', parent: 0, children: [] })
    const bId = addNode(tree, { type: 'paragraph', parent: 0, children: [] })
    const cId = addNode(tree, { type: 'heading', parent: 0, children: [] })

    tree.nodes[0]!.children = [aId, bId, cId]

    const headings = selectByType(tree, 'heading')

    expect(headings).toEqual([aId, cId])
  })
})
