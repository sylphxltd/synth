/**
 * Common transform utilities
 */

import type { Tree, NodeId, BaseNode, Visitor } from '../types/index.js'
import type { TransformFn } from './processor.js'
import { traverse } from '../core/index.js'
import { updateNode, removeNode } from '../types/index.js'

/**
 * Transform nodes matching a predicate
 */
export function transformNodes(
  predicate: (node: BaseNode) => boolean,
  transform: (node: BaseNode) => Partial<BaseNode>
): TransformFn {
  return async (tree: Tree) => {
    const visitor: Visitor = {
      enter: (ctx) => {
        if (predicate(ctx.node)) {
          const updates = transform(ctx.node)
          updateNode(tree, ctx.nodeId, updates)
        }
      },
    }

    traverse(tree, visitor)
    return tree
  }
}

/**
 * Transform nodes of a specific type
 */
export function transformByType(
  type: string,
  transform: (node: BaseNode) => Partial<BaseNode>
): TransformFn {
  return transformNodes((node) => node.type === type, transform)
}

/**
 * Remove nodes matching a predicate
 */
export function removeNodes(predicate: (node: BaseNode) => boolean): TransformFn {
  return async (tree: Tree) => {
    const toRemove: NodeId[] = []

    traverse(tree, {
      enter: (ctx) => {
        if (predicate(ctx.node)) {
          toRemove.push(ctx.nodeId)
        }
      },
    })

    // Remove in reverse order to avoid index issues
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const nodeId = toRemove[i]!
      removeNode(tree, nodeId)
    }

    return tree
  }
}

/**
 * Filter - keep only nodes matching predicate
 */
export function filter(predicate: (node: BaseNode) => boolean): TransformFn {
  return removeNodes((node) => !predicate(node))
}

/**
 * Map over all nodes
 */
export function mapNodes(fn: (node: BaseNode) => Partial<BaseNode>): TransformFn {
  return async (tree: Tree) => {
    traverse(tree, {
      enter: (ctx) => {
        const updates = fn(ctx.node)
        updateNode(tree, ctx.nodeId, updates)
      },
    })

    return tree
  }
}

/**
 * Clone a tree (deep copy)
 */
export function cloneTree(tree: Tree): Tree {
  return {
    meta: { ...tree.meta },
    root: tree.root,
    nodes: tree.nodes.map(node => ({ ...node, children: [...node.children] })),
    strings: new Map(tree.strings),
  }
}

/**
 * Merge multiple trees into one
 */
export function mergeTrees(...trees: Tree[]): Tree {
  if (trees.length === 0) {
    throw new Error('Cannot merge zero trees')
  }

  const [first, ...rest] = trees
  const result = cloneTree(first!)

  // Simple merge: append all children to root
  for (const tree of rest) {
    const rootNode = result.nodes[0]!
    rootNode.children.push(...tree.nodes[0]!.children)

    // Add non-root nodes
    for (let i = 1; i < tree.nodes.length; i++) {
      const node = tree.nodes[i]!
      result.nodes.push({ ...node, id: result.nodes.length })
    }
  }

  return result
}
