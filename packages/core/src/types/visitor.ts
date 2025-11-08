/**
 * Visitor pattern for tree traversal
 */

import type { BaseNode, NodeId } from './node.js'
import type { Tree } from './tree.js'

/**
 * Visitor context passed to visitor functions
 */
export interface VisitorContext {
  /** Current tree */
  tree: Tree

  /** Current node ID */
  nodeId: NodeId

  /** Current node */
  node: BaseNode

  /** Parent node ID (null for root) */
  parentId: NodeId | null

  /** Depth in the tree (0 for root) */
  depth: number

  /** Index among siblings */
  index: number

  /** Ancestors (node IDs from root to parent) */
  ancestors: NodeId[]
}

/**
 * Visitor function type
 */
export type VisitorFn<T = void> = (context: VisitorContext) => T

/**
 * Visitor configuration
 */
export interface Visitor {
  /** Called when entering a node (pre-order) */
  enter?: VisitorFn<void | boolean>

  /** Called when leaving a node (post-order) */
  leave?: VisitorFn<void>

  /** Type-specific visitors */
  [key: string]: VisitorFn<void | boolean> | undefined
}

/**
 * Traversal order
 */
export enum TraversalOrder {
  /** Depth-first, pre-order */
  PreOrder = 'pre-order',

  /** Depth-first, post-order */
  PostOrder = 'post-order',

  /** Breadth-first */
  BreadthFirst = 'breadth-first',
}

/**
 * Traversal options
 */
export interface TraversalOptions {
  /** Traversal order */
  order?: TraversalOrder

  /** Maximum depth (-1 for unlimited) */
  maxDepth?: number

  /** Filter function - return false to skip subtree */
  filter?: (context: VisitorContext) => boolean
}
