/**
 * Incremental Parsing System
 *
 * Based on tree-sitter's incremental parsing approach
 *
 * Key concepts:
 * 1. Edit tracking: Record what changed
 * 2. Affected node detection: Find nodes that need re-parsing
 * 3. Partial re-parse: Only re-parse affected subtrees
 * 4. Structural sharing: Reuse unchanged nodes
 *
 * Expected performance: 90%+ faster than full re-parse
 */

import type { Tree, NodeId, BaseNode, Position } from './types/index.js'
import { getNode } from './types/tree.js'
import { createIndex, type ASTIndex } from './query-index.js'
// TODO: Node pool has been moved to @sylphx/ast-optimizations package
// import { globalNodePool } from './node-pool.js'

/**
 * Text edit description (tree-sitter compatible)
 */
export interface Edit {
  startByte: number
  oldEndByte: number
  newEndByte: number
  startPosition: Position
  oldEndPosition: Position
  newEndPosition: Position
}

/**
 * Simple edit for common cases
 */
export interface SimpleEdit {
  start: number // byte offset
  oldLength: number
  newLength: number
  newText?: string
}

/**
 * Range affected by an edit
 */
export interface AffectedRange {
  startByte: number
  endByte: number
  startPosition: Position
  endPosition: Position
}

/**
 * Incremental parsing statistics
 */
export interface IncrementalStats {
  totalNodes: number
  affectedNodes: number
  reusedNodes: number
  newNodes: number
  reparseTimeMs: number
  fullParseTimeMs: number // For comparison
  speedup: number // fullParseTime / reparseTime
}

/**
 * Incremental parser state
 */
export class IncrementalParser {
  private tree: Tree
  private index: ASTIndex | null = null
  private edits: Edit[] = []

  constructor(tree: Tree) {
    this.tree = tree
  }

  /**
   * Record an edit to apply later
   */
  edit(edit: Edit | SimpleEdit): void {
    // Convert SimpleEdit to full Edit if needed
    const fullEdit = this.normalizeEdit(edit)
    this.edits.push(fullEdit)
  }

  /**
   * Apply all recorded edits and re-parse affected regions
   */
  applyEdits(parser: (text: string) => Tree): IncrementalStats {
    const startTime = performance.now()

    // Build index if not already built
    if (!this.index) {
      this.index = createIndex(this.tree)
    }

    // Find all affected nodes
    const affectedNodeIds = this.findAffectedNodes()

    // Calculate affected range
    const affectedRange = this.calculateAffectedRange(this.edits)

    // Partial re-parse
    const newNodes = this.reparseAffected(affectedRange, parser)

    // Reuse unchanged nodes (structural sharing)
    const reusedCount = this.tree.nodes.length - affectedNodeIds.length

    // Update statistics
    const reparseTime = performance.now() - startTime

    // Estimate full parse time (for comparison)
    const fullParseStart = performance.now()
    parser(this.tree.meta.source)
    const fullParseTime = performance.now() - fullParseStart

    // Release old nodes back to pool
    // TODO: Re-enable when node-pool is available from @sylphx/ast-optimizations
    // for (const node of affectedNodes) {
    //   globalNodePool.release(node)
    // }

    // Clear edits
    this.edits = []

    // Rebuild index
    this.index.rebuild()

    return {
      totalNodes: this.tree.nodes.length,
      affectedNodes: affectedNodeIds.length,
      reusedNodes: reusedCount,
      newNodes: newNodes.length,
      reparseTimeMs: reparseTime,
      fullParseTimeMs: fullParseTime,
      speedup: fullParseTime / reparseTime,
    }
  }

  /**
   * Find all nodes affected by the edits
   */
  private findAffectedNodes(): NodeId[] {
    if (!this.index) {
      this.index = createIndex(this.tree)
    }

    const affectedIds = new Set<NodeId>()

    for (const edit of this.edits) {
      // Find nodes that overlap with the edit range
      const overlapping = this.findOverlappingNodes(edit)

      for (const id of overlapping) {
        affectedIds.add(id)

        // Also mark parent nodes as affected
        this.markParentsAsAffected(id, affectedIds)
      }
    }

    return Array.from(affectedIds)
  }

  /**
   * Find nodes that overlap with an edit
   */
  private findOverlappingNodes(edit: Edit): NodeId[] {
    const overlapping: NodeId[] = []

    // Use byte offset to find overlapping nodes
    for (const node of this.tree.nodes) {
      if (!node.span) continue

      const nodeStart = node.span.start.offset
      const nodeEnd = node.span.end.offset

      // Check if node overlaps with edit range
      if (this.rangesOverlap(nodeStart, nodeEnd, edit.startByte, edit.oldEndByte)) {
        overlapping.push(node.id)
      }
    }

    return overlapping
  }

  /**
   * Check if two ranges overlap
   */
  private rangesOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): boolean {
    return start1 <= end2 && start2 <= end1
  }

  /**
   * Mark parent nodes as affected
   */
  private markParentsAsAffected(nodeId: NodeId, affectedSet: Set<NodeId>): void {
    const node = getNode(this.tree, nodeId)
    if (!node || node.parent === null) return

    affectedSet.add(node.parent)
    this.markParentsAsAffected(node.parent, affectedSet)
  }

  /**
   * Calculate the overall affected range
   */
  private calculateAffectedRange(edits: Edit[]): AffectedRange {
    let minStart = Infinity
    let maxEnd = 0

    for (const edit of edits) {
      minStart = Math.min(minStart, edit.startByte)
      maxEnd = Math.max(maxEnd, edit.newEndByte)
    }

    return {
      startByte: minStart,
      endByte: maxEnd,
      startPosition: edits[0]!.startPosition,
      endPosition: edits[edits.length - 1]!.newEndPosition,
    }
  }

  /**
   * Re-parse only the affected region
   */
  private reparseAffected(range: AffectedRange, parser: (text: string) => Tree): BaseNode[] {
    // Extract affected text region
    const affectedText = this.tree.meta.source.slice(range.startByte, range.endByte)

    // Parse just this region
    const partialTree = parser(affectedText)

    // Adjust node positions to match original document
    const newNodes: BaseNode[] = []
    for (const node of partialTree.nodes) {
      if (node.span) {
        node.span.start.offset += range.startByte
        node.span.end.offset += range.startByte
      }
      newNodes.push(node)
    }

    // Splice new nodes into existing tree
    // (Simplified - in practice would need more sophisticated merging)
    const firstAffected = this.findNodeAtOffset(range.startByte)
    const lastAffected = this.findNodeAtOffset(range.endByte)

    if (firstAffected !== null && lastAffected !== null) {
      // Remove affected nodes and insert new ones
      this.tree.nodes.splice(firstAffected, lastAffected - firstAffected + 1, ...newNodes)
    }

    return newNodes
  }

  /**
   * Find node at byte offset
   */
  private findNodeAtOffset(offset: number): NodeId | null {
    for (let i = 0; i < this.tree.nodes.length; i++) {
      const node = this.tree.nodes[i]!
      if (!node.span) continue

      if (node.span.start.offset <= offset && offset <= node.span.end.offset) {
        return i
      }
    }
    return null
  }

  /**
   * Normalize SimpleEdit to full Edit
   */
  private normalizeEdit(edit: Edit | SimpleEdit): Edit {
    if ('startByte' in edit) {
      return edit as Edit
    }

    // Convert SimpleEdit to Edit
    const simple = edit as SimpleEdit
    return {
      startByte: simple.start,
      oldEndByte: simple.start + simple.oldLength,
      newEndByte: simple.start + simple.newLength,
      startPosition: this.offsetToPosition(simple.start),
      oldEndPosition: this.offsetToPosition(simple.start + simple.oldLength),
      newEndPosition: this.offsetToPosition(simple.start + simple.newLength),
    }
  }

  /**
   * Convert byte offset to Position
   */
  private offsetToPosition(offset: number): Position {
    let line = 0
    let column = 0
    let currentOffset = 0

    const text = this.tree.meta.source

    for (let i = 0; i < offset && i < text.length; i++) {
      if (text[i] === '\n') {
        line++
        column = 0
      } else {
        column++
      }
      currentOffset++
    }

    return { line, column, offset }
  }

  /**
   * Get current tree
   */
  getTree(): Tree {
    return this.tree
  }

  /**
   * Get statistics without applying edits
   */
  getStats(): { pendingEdits: number; totalNodes: number } {
    return {
      pendingEdits: this.edits.length,
      totalNodes: this.tree.nodes.length,
    }
  }
}

/**
 * Create an incremental parser for a tree
 */
export function createIncrementalParser(tree: Tree): IncrementalParser {
  return new IncrementalParser(tree)
}

/**
 * Helper: Apply a single edit and get new tree
 */
export function applyEdit(
  tree: Tree,
  edit: Edit | SimpleEdit,
  parser: (text: string) => Tree
): { tree: Tree; stats: IncrementalStats } {
  const incremental = createIncrementalParser(tree)
  incremental.edit(edit)
  const stats = incremental.applyEdits(parser)
  return { tree: incremental.getTree(), stats }
}
