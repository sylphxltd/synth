/**
 * Tree traversal implementation
 */

import type {
  Tree,
  NodeId,
  Visitor,
  VisitorContext,
  TraversalOptions,
} from './types/index.js'
import { getNode } from './types/index.js'
import { TraversalOrder } from './types/index.js'

/**
 * Traverse the tree with a visitor
 */
export function traverse(
  tree: Tree,
  visitor: Visitor,
  options: TraversalOptions = {}
): void {
  const order = options.order ?? TraversalOrder.PreOrder

  switch (order) {
    case TraversalOrder.PreOrder:
      traversePreOrder(tree, tree.root, visitor, options, 0, [])
      break
    case TraversalOrder.PostOrder:
      traversePostOrder(tree, tree.root, visitor, options, 0, [])
      break
    case TraversalOrder.BreadthFirst:
      traverseBreadthFirst(tree, visitor, options)
      break
  }
}

/**
 * Pre-order traversal (parent before children)
 */
function traversePreOrder(
  tree: Tree,
  nodeId: NodeId,
  visitor: Visitor,
  options: TraversalOptions,
  depth: number,
  ancestors: NodeId[]
): boolean {
  const node = getNode(tree, nodeId)
  if (!node) return true

  // Check max depth
  if (options.maxDepth !== undefined && options.maxDepth >= 0 && depth > options.maxDepth) {
    return true
  }

  const context: VisitorContext = {
    tree,
    nodeId,
    node,
    parentId: node.parent,
    depth,
    index: 0, // Will be set by parent
    ancestors,
  }

  // Apply filter
  if (options.filter && !options.filter(context)) {
    return true
  }

  // Call enter visitor
  if (visitor.enter) {
    const result = visitor.enter(context)
    if (result === false) return false // Skip subtree
  }

  // Call type-specific visitor
  const typeVisitor = visitor[node.type]
  if (typeVisitor) {
    const result = typeVisitor(context)
    if (result === false) return false // Skip subtree
  }

  // Visit children
  const children = node.children
  const newAncestors = [...ancestors, nodeId]

  for (let i = 0; i < children.length; i++) {
    const childId = children[i]!
    const shouldContinue = traversePreOrder(
      tree,
      childId,
      visitor,
      options,
      depth + 1,
      newAncestors
    )
    if (!shouldContinue) return false
  }

  return true
}

/**
 * Post-order traversal (children before parent)
 */
function traversePostOrder(
  tree: Tree,
  nodeId: NodeId,
  visitor: Visitor,
  options: TraversalOptions,
  depth: number,
  ancestors: NodeId[]
): boolean {
  const node = getNode(tree, nodeId)
  if (!node) return true

  // Check max depth
  if (options.maxDepth !== undefined && options.maxDepth >= 0 && depth > options.maxDepth) {
    return true
  }

  const context: VisitorContext = {
    tree,
    nodeId,
    node,
    parentId: node.parent,
    depth,
    index: 0,
    ancestors,
  }

  // Apply filter
  if (options.filter && !options.filter(context)) {
    return true
  }

  // Visit children first
  const children = node.children
  const newAncestors = [...ancestors, nodeId]

  for (let i = 0; i < children.length; i++) {
    const childId = children[i]!
    const shouldContinue = traversePostOrder(
      tree,
      childId,
      visitor,
      options,
      depth + 1,
      newAncestors
    )
    if (!shouldContinue) return false
  }

  // Call leave visitor
  if (visitor.leave) {
    visitor.leave(context)
  }

  // Call type-specific visitor
  const typeVisitor = visitor[node.type]
  if (typeVisitor) {
    typeVisitor(context)
  }

  return true
}

/**
 * Breadth-first traversal (level by level)
 */
function traverseBreadthFirst(
  tree: Tree,
  visitor: Visitor,
  options: TraversalOptions
): void {
  const queue: Array<{ nodeId: NodeId; depth: number; ancestors: NodeId[] }> = [
    { nodeId: tree.root, depth: 0, ancestors: [] },
  ]

  while (queue.length > 0) {
    const item = queue.shift()!
    const { nodeId, depth, ancestors } = item

    // Check max depth
    if (options.maxDepth !== undefined && options.maxDepth >= 0 && depth > options.maxDepth) {
      continue
    }

    const node = getNode(tree, nodeId)
    if (!node) continue

    const context: VisitorContext = {
      tree,
      nodeId,
      node,
      parentId: node.parent,
      depth,
      index: 0,
      ancestors,
    }

    // Apply filter
    if (options.filter && !options.filter(context)) {
      continue
    }

    // Call enter visitor
    if (visitor.enter) {
      const result = visitor.enter(context)
      if (result === false) continue
    }

    // Call type-specific visitor
    const typeVisitor = visitor[node.type]
    if (typeVisitor) {
      const result = typeVisitor(context)
      if (result === false) continue
    }

    // Enqueue children
    const newAncestors = [...ancestors, nodeId]
    for (const childId of node.children) {
      queue.push({ nodeId: childId, depth: depth + 1, ancestors: newAncestors })
    }
  }
}

/**
 * Walk the tree and collect nodes matching a predicate
 */
export function select<T extends NodeId>(
  tree: Tree,
  predicate: (context: VisitorContext) => boolean
): T[] {
  const results: T[] = []

  traverse(tree, {
    enter: (context) => {
      if (predicate(context)) {
        results.push(context.nodeId as T)
      }
    },
  })

  return results
}

/**
 * Find the first node matching a predicate
 */
export function find(
  tree: Tree,
  predicate: (context: VisitorContext) => boolean
): NodeId | null {
  let result: NodeId | null = null

  traverse(tree, {
    enter: (context) => {
      if (predicate(context)) {
        result = context.nodeId
        return false // Stop traversal
      }
      return undefined
    },
  })

  return result
}

/**
 * Select nodes by type
 */
export function selectByType(tree: Tree, type: string): NodeId[] {
  const results: NodeId[] = []

  traverse(tree, {
    enter: (ctx) => {
      if (ctx.node.type === type) {
        results.push(ctx.nodeId)
      }
    },
  })

  return results
}
