import { describe, it, expect } from 'vitest'
import { createTree, addNode } from './types/index.js'
import { createZipper, down, up, right, left, getFocus, edit } from './zipper.js'

describe('zipper', () => {
  it('should navigate down to first child', () => {
    const tree = createTree('test', '')

    const childId = addNode(tree, { type: 'child', parent: 0, children: [] })
    tree.nodes[0]!.children = [childId]

    const zipper = createZipper(tree)
    const moved = down(zipper)

    expect(moved).not.toBeNull()
    expect(getFocus(moved!)?.type).toBe('child')
  })

  it('should navigate up to parent', () => {
    const tree = createTree('test', '')

    const childId = addNode(tree, { type: 'child', parent: 0, children: [] })
    tree.nodes[0]!.children = [childId]

    const zipper = createZipper(tree)
    const downZipper = down(zipper)!
    const upZipper = up(downZipper)!

    expect(getFocus(upZipper)?.type).toBe('root')
  })

  it('should navigate right to sibling', () => {
    const tree = createTree('test', '')

    const child1 = addNode(tree, { type: 'child1', parent: 0, children: [] })
    const child2 = addNode(tree, { type: 'child2', parent: 0, children: [] })
    tree.nodes[0]!.children = [child1, child2]

    const zipper = createZipper(tree)
    const downZipper = down(zipper)!
    const rightZipper = right(downZipper)!

    expect(getFocus(rightZipper)?.type).toBe('child2')
  })

  it('should edit focused node', () => {
    const tree = createTree('test', '')

    const childId = addNode(tree, { type: 'child', parent: 0, children: [] })
    tree.nodes[0]!.children = [childId]

    const zipper = createZipper(tree)
    const downZipper = down(zipper)!

    edit(downZipper, (node) => ({
      data: { modified: true },
    }))

    expect(tree.nodes[childId]!.data?.['modified']).toBe(true)
  })
})
