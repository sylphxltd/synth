/**
 * Tree structure and operations
 */

import type { BaseNode, NodeId, RootNode } from './node.js'

/**
 * Tree metadata
 */
export interface TreeMetadata {
  /** Language/format of the source */
  language: string

  /** Original source text */
  source: string

  /** Creation timestamp */
  created: number

  /** Last modified timestamp */
  modified: number

  /** Custom metadata */
  data?: Record<string, unknown>
}

/**
 * AST Tree structure
 *
 * Uses an arena-based storage model:
 * - All nodes stored in a flat array
 * - Node IDs are array indices
 * - Efficient memory layout for cache locality
 */
export interface Tree {
  /** Tree metadata */
  meta: TreeMetadata

  /** Root node ID (always 0) */
  root: NodeId

  /** Node storage (arena) */
  nodes: BaseNode[]

  /** String pool for deduplication */
  strings: Map<string, number>
}

/**
 * Create an empty tree
 */
export function createTree(language: string, source: string = ''): Tree {
  const now = Date.now()

  const root: RootNode = {
    id: 0,
    type: 'root',
    parent: null,
    children: [],
  }

  return {
    meta: {
      language,
      source,
      created: now,
      modified: now,
    },
    root: 0,
    nodes: [root],
    strings: new Map(),
  }
}

/**
 * Get node by ID
 */
export function getNode(tree: Tree, id: NodeId): BaseNode | undefined {
  return tree.nodes[id]
}

/**
 * Get root node
 */
export function getRoot(tree: Tree): RootNode {
  return tree.nodes[0] as RootNode
}

/**
 * Add a node to the tree
 * Returns the new node's ID
 */
export function addNode(tree: Tree, node: Omit<BaseNode, 'id'>): NodeId {
  const id = tree.nodes.length
  const newNode: BaseNode = { ...node, id }
  tree.nodes.push(newNode)
  tree.meta.modified = Date.now()
  return id
}

/**
 * Update a node in place
 */
export function updateNode(tree: Tree, id: NodeId, updates: Partial<BaseNode>): void {
  const node = tree.nodes[id]
  if (node) {
    Object.assign(node, updates)
    tree.meta.modified = Date.now()
  }
}

/**
 * Remove a node (marks as deleted, doesn't actually remove)
 */
export function removeNode(tree: Tree, id: NodeId): void {
  const node = tree.nodes[id]
  if (node && node.parent !== null) {
    const parent = tree.nodes[node.parent]
    if (parent) {
      parent.children = parent.children.filter(childId => childId !== id)
      tree.meta.modified = Date.now()
    }
  }
}

/**
 * Get all children nodes
 */
export function getChildren(tree: Tree, id: NodeId): BaseNode[] {
  const node = tree.nodes[id]
  if (!node) return []
  return node.children.map(childId => tree.nodes[childId]!).filter(Boolean)
}

/**
 * Get parent node
 */
export function getParent(tree: Tree, id: NodeId): BaseNode | null {
  const node = tree.nodes[id]
  if (!node || node.parent === null) return null
  return tree.nodes[node.parent] ?? null
}

/**
 * Intern a string in the string pool
 */
export function internString(tree: Tree, str: string): number {
  const existing = tree.strings.get(str)
  if (existing !== undefined) return existing

  const id = tree.strings.size
  tree.strings.set(str, id)
  return id
}
