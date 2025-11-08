/**
 * Query Optimization Index for Fast AST Queries
 *
 * Build indexes for common query patterns to achieve O(1) or O(log n) lookups
 * instead of O(n) tree traversals.
 *
 * Expected performance: 100-1000x faster than linear scans
 *
 * Index types:
 * - Type index: Find all nodes of a given type
 * - Path index: Query nodes by tree path
 * - Data index: Query nodes by data attributes
 * - Parent-child index: Fast relationship queries
 */

import type { Tree, NodeId, BaseNode } from './types/index.js'
import { getNode } from './types/tree.js'

/**
 * Query selector types
 */
export type QuerySelector = string | QueryPredicate | QueryObject

export type QueryPredicate = (node: BaseNode) => boolean

export interface QueryObject {
  type?: string | string[]
  depth?: number | { min?: number; max?: number }
  hasChildren?: boolean
  childCount?: number | { min?: number; max?: number }
  parent?: NodeId
  data?: Record<string, unknown>
}

/**
 * Index statistics
 */
export interface IndexStats {
  typeIndexSize: number
  pathIndexSize: number
  dataIndexSize: number
  totalNodes: number
  indexedTypes: number
  memoryEstimate: number // bytes
}

/**
 * AST Query Index
 */
export class ASTIndex {
  // Type index: type -> Set<NodeId>
  private typeIndex = new Map<string, Set<NodeId>>()

  // Path index: path string -> NodeId
  private pathIndex = new Map<string, NodeId>()

  // Data index: key -> value -> Set<NodeId>
  private dataIndex = new Map<string, Map<unknown, Set<NodeId>>>()

  // Parent-child index: parentId -> Set<childId>
  private parentChildIndex = new Map<NodeId, Set<NodeId>>()

  // Child-parent reverse index: childId -> parentId
  private childParentIndex = new Map<NodeId, NodeId>()

  // Depth index: depth -> Set<NodeId>
  private depthIndex = new Map<number, Set<NodeId>>()

  private tree: Tree
  private isBuilt = false

  constructor(tree: Tree) {
    this.tree = tree
  }

  /**
   * Build all indexes from the tree
   */
  build(): void {
    this.clear()

    // Traverse tree and build indexes
    this.buildIndexes(this.tree.root, [], 0)
    this.isBuilt = true
  }

  /**
   * Recursively build indexes
   */
  private buildIndexes(nodeId: NodeId, path: string[], depth: number): void {
    const node = getNode(this.tree, nodeId)
    if (!node) return

    // Type index
    this.addToTypeIndex(node.type, nodeId)

    // Path index
    const pathStr = path.join('/')
    this.pathIndex.set(pathStr, nodeId)

    // Data index
    if (node.data) {
      for (const [key, value] of Object.entries(node.data)) {
        this.addToDataIndex(key, value, nodeId)
      }
    }

    // Parent-child index
    if (node.parent !== null) {
      this.addToParentChildIndex(node.parent, nodeId)
      this.childParentIndex.set(nodeId, node.parent)
    }

    // Depth index
    this.addToDepthIndex(depth, nodeId)

    // Recurse to children
    for (let i = 0; i < node.children.length; i++) {
      const childId = node.children[i]!
      const childPath = [...path, node.type, i.toString()]
      this.buildIndexes(childId, childPath, depth + 1)
    }
  }

  /**
   * Add node to type index
   */
  private addToTypeIndex(type: string, nodeId: NodeId): void {
    let set = this.typeIndex.get(type)
    if (!set) {
      set = new Set()
      this.typeIndex.set(type, set)
    }
    set.add(nodeId)
  }

  /**
   * Add node to data index
   */
  private addToDataIndex(key: string, value: unknown, nodeId: NodeId): void {
    let valueMap = this.dataIndex.get(key)
    if (!valueMap) {
      valueMap = new Map()
      this.dataIndex.set(key, valueMap)
    }

    let set = valueMap.get(value)
    if (!set) {
      set = new Set()
      valueMap.set(value, set)
    }
    set.add(nodeId)
  }

  /**
   * Add to parent-child index
   */
  private addToParentChildIndex(parentId: NodeId, childId: NodeId): void {
    let set = this.parentChildIndex.get(parentId)
    if (!set) {
      set = new Set()
      this.parentChildIndex.set(parentId, set)
    }
    set.add(childId)
  }

  /**
   * Add to depth index
   */
  private addToDepthIndex(depth: number, nodeId: NodeId): void {
    let set = this.depthIndex.get(depth)
    if (!set) {
      set = new Set()
      this.depthIndex.set(depth, set)
    }
    set.add(nodeId)
  }

  /**
   * Find nodes by type (O(1))
   */
  findByType(type: string): NodeId[] {
    this.ensureBuilt()
    const set = this.typeIndex.get(type)
    return set ? Array.from(set) : []
  }

  /**
   * Find nodes by multiple types (O(k) where k = number of types)
   */
  findByTypes(types: string[]): NodeId[] {
    this.ensureBuilt()
    const result = new Set<NodeId>()

    for (const type of types) {
      const set = this.typeIndex.get(type)
      if (set) {
        for (const id of set) {
          result.add(id)
        }
      }
    }

    return Array.from(result)
  }

  /**
   * Find node by path (O(1))
   */
  findByPath(path: string): NodeId | undefined {
    this.ensureBuilt()
    return this.pathIndex.get(path)
  }

  /**
   * Find nodes by data attribute (O(1))
   */
  findByData(key: string, value: unknown): NodeId[] {
    this.ensureBuilt()
    const valueMap = this.dataIndex.get(key)
    if (!valueMap) return []

    const set = valueMap.get(value)
    return set ? Array.from(set) : []
  }

  /**
   * Find children of a node (O(1))
   */
  findChildren(parentId: NodeId): NodeId[] {
    this.ensureBuilt()
    const set = this.parentChildIndex.get(parentId)
    return set ? Array.from(set) : []
  }

  /**
   * Find parent of a node (O(1))
   */
  findParent(childId: NodeId): NodeId | undefined {
    this.ensureBuilt()
    const parent = this.childParentIndex.get(childId)
    return parent !== undefined ? parent : undefined
  }

  /**
   * Find all nodes at a specific depth (O(1))
   */
  findByDepth(depth: number): NodeId[] {
    this.ensureBuilt()
    const set = this.depthIndex.get(depth)
    return set ? Array.from(set) : []
  }

  /**
   * Find nodes in a depth range
   */
  findByDepthRange(minDepth: number, maxDepth: number): NodeId[] {
    this.ensureBuilt()
    const result = new Set<NodeId>()

    for (let depth = minDepth; depth <= maxDepth; depth++) {
      const set = this.depthIndex.get(depth)
      if (set) {
        for (const id of set) {
          result.add(id)
        }
      }
    }

    return Array.from(result)
  }

  /**
   * Query with a query object (combines multiple indexes)
   */
  query(selector: QueryObject): NodeId[] {
    this.ensureBuilt()

    let candidates: Set<NodeId> | undefined

    // Start with type filter (most selective usually)
    if (selector.type) {
      const types = Array.isArray(selector.type) ? selector.type : [selector.type]
      candidates = new Set(this.findByTypes(types))
    }

    // Apply depth filter
    if (selector.depth !== undefined) {
      const depthIds =
        typeof selector.depth === 'number'
          ? this.findByDepth(selector.depth)
          : this.findByDepthRange(
              selector.depth.min ?? 0,
              selector.depth.max ?? Number.MAX_SAFE_INTEGER
            )

      if (candidates) {
        candidates = new Set(depthIds.filter((id) => candidates!.has(id)))
      } else {
        candidates = new Set(depthIds)
      }
    }

    // Apply parent filter
    if (selector.parent !== undefined) {
      const childIds = this.findChildren(selector.parent)

      if (candidates) {
        candidates = new Set(childIds.filter((id) => candidates!.has(id)))
      } else {
        candidates = new Set(childIds)
      }
    }

    // Apply data filters
    if (selector.data) {
      for (const [key, value] of Object.entries(selector.data)) {
        const dataIds = this.findByData(key, value)

        if (candidates) {
          candidates = new Set(dataIds.filter((id) => candidates!.has(id)))
        } else {
          candidates = new Set(dataIds)
        }
      }
    }

    // If no filters, return all nodes
    if (!candidates) {
      candidates = new Set<NodeId>()
      for (const ids of this.typeIndex.values()) {
        for (const id of ids) {
          candidates.add(id)
        }
      }
    }

    // Apply node-level filters (hasChildren, childCount)
    const result: NodeId[] = []
    for (const id of candidates) {
      const node = getNode(this.tree, id)
      if (!node) continue

      // Check hasChildren
      if (selector.hasChildren !== undefined) {
        if (selector.hasChildren && node.children.length === 0) continue
        if (!selector.hasChildren && node.children.length > 0) continue
      }

      // Check childCount
      if (selector.childCount !== undefined) {
        if (typeof selector.childCount === 'number') {
          if (node.children.length !== selector.childCount) continue
        } else {
          const min = selector.childCount.min ?? 0
          const max = selector.childCount.max ?? Number.MAX_SAFE_INTEGER
          if (node.children.length < min || node.children.length > max) continue
        }
      }

      result.push(id)
    }

    return result
  }

  /**
   * Get available node types
   */
  getTypes(): string[] {
    this.ensureBuilt()
    return Array.from(this.typeIndex.keys())
  }

  /**
   * Get count of nodes by type
   */
  getTypeCount(type: string): number {
    this.ensureBuilt()
    return this.typeIndex.get(type)?.size ?? 0
  }

  /**
   * Get all type counts
   */
  getTypeCounts(): Map<string, number> {
    this.ensureBuilt()
    const counts = new Map<string, number>()
    for (const [type, set] of this.typeIndex) {
      counts.set(type, set.size)
    }
    return counts
  }

  /**
   * Get index statistics
   */
  getStats(): IndexStats {
    const typeIndexSize = this.typeIndex.size
    const pathIndexSize = this.pathIndex.size
    const dataIndexSize = this.dataIndex.size

    let totalNodes = 0
    for (const set of this.typeIndex.values()) {
      totalNodes += set.size
    }

    // Rough memory estimate (very approximate)
    const memoryEstimate =
      typeIndexSize * 100 + // type map overhead
      pathIndexSize * 150 + // path strings
      dataIndexSize * 100 + // data index
      totalNodes * 32 // node ID storage

    return {
      typeIndexSize,
      pathIndexSize,
      dataIndexSize,
      totalNodes,
      indexedTypes: typeIndexSize,
      memoryEstimate,
    }
  }

  /**
   * Clear all indexes
   */
  clear(): void {
    this.typeIndex.clear()
    this.pathIndex.clear()
    this.dataIndex.clear()
    this.parentChildIndex.clear()
    this.childParentIndex.clear()
    this.depthIndex.clear()
    this.isBuilt = false
  }

  /**
   * Rebuild indexes (after tree modification)
   */
  rebuild(): void {
    this.build()
  }

  /**
   * Check if indexes are built
   */
  private ensureBuilt(): void {
    if (!this.isBuilt) {
      throw new Error('Index not built. Call build() first.')
    }
  }
}

/**
 * Create an index for a tree
 */
export function createIndex(tree: Tree): ASTIndex {
  const index = new ASTIndex(tree)
  index.build()
  return index
}
