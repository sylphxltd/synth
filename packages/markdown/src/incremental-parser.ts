/**
 * Incremental Markdown Parser
 *
 * Re-parses only affected regions when text is edited
 * Expected gain: 10-100x for incremental updates
 */

import type { Tree, NodeId } from '@sylphx/ast-core'
import { UltraOptimizedMarkdownParser, type ParseOptions } from './ultra-optimized-parser.js'
import type { ASTIndex } from '@sylphx/ast-core'

/**
 * Simple edit description
 */
export interface Edit {
  startIndex: number
  oldEndIndex: number
  newEndIndex: number
}

/**
 * Range in the document
 */
interface Range {
  start: number // Character offset
  end: number
}

/**
 * Affected region after an edit
 */
interface AffectedRegion {
  /**
   * Character range that needs re-parsing
   */
  range: Range

  /**
   * Node IDs that are affected
   */
  affectedNodes: NodeId[]

  /**
   * Lines that need re-tokenization
   */
  affectedLines: { start: number; end: number }
}

/**
 * Incremental Parser that only re-parses modified regions
 */
export class IncrementalMarkdownParser {
  private parser: UltraOptimizedMarkdownParser
  private previousText: string = ''
  private previousTree: Tree | null = null

  constructor() {
    this.parser = new UltraOptimizedMarkdownParser()
  }

  /**
   * Initial parse of document
   */
  parse(text: string, options?: Omit<ParseOptions, 'plugins'>): Tree {
    this.previousText = text
    this.previousTree = this.parser.parse(text, options)
    return this.previousTree
  }

  /**
   * Incremental update after edit
   */
  update(newText: string, edit: Edit, options?: Omit<ParseOptions, 'plugins'>): Tree {
    if (!this.previousTree) {
      // No previous tree, do full parse
      return this.parse(newText, options)
    }

    // For most documents, full re-parse is faster due to tree merging overhead
    // Incremental parsing only beneficial for VERY large documents (>100KB)
    // where affected region is small (<10%)
    const documentSize = newText.length
    const LARGE_DOC_THRESHOLD = 100_000 // 100KB

    // Only use incremental parsing for large documents
    if (documentSize < LARGE_DOC_THRESHOLD) {
      // Small/medium documents: full re-parse is faster
      return this.parse(newText, options)
    }

    // Find affected region for large documents
    const affected = this.findAffectedRegion(edit, this.previousText, newText)
    const affectedSize = affected.range.end - affected.range.start
    const affectedPercent = affectedSize / documentSize

    // Only use incremental if edit affects <10% of large document
    if (affectedPercent < 0.1) {
      // Incremental update (< 10% of large document affected)
      return this.incrementalParse(newText, affected, options)
    } else {
      // Full re-parse (>= 10% affected or small document)
      return this.parse(newText, options)
    }
  }

  /**
   * Find the region affected by an edit
   */
  private findAffectedRegion(edit: Edit, _oldText: string, newText: string): AffectedRegion {
    const { startIndex, newEndIndex } = edit

    // Expand range to include complete blocks
    // Markdown blocks are separated by blank lines
    const expandedRange = this.expandToBlockBoundaries(
      { start: startIndex, end: newEndIndex },
      newText
    )

    // Find affected nodes in previous tree
    const affectedNodes = this.findAffectedNodes(expandedRange, this.previousTree!)

    // Calculate affected line range
    const affectedLines = this.calculateAffectedLines(expandedRange, newText)

    return {
      range: expandedRange,
      affectedNodes,
      affectedLines,
    }
  }

  /**
   * Expand range to include complete Markdown blocks
   */
  private expandToBlockBoundaries(range: Range, text: string): Range {
    let start = range.start
    let end = range.end

    // Move start back to beginning of line
    while (start > 0 && text[start - 1] !== '\n') {
      start--
    }

    // Move start back to include preceding blank line (if any)
    while (start > 0) {
      const prevLineEnd = start - 1
      let prevLineStart = prevLineEnd
      while (prevLineStart > 0 && text[prevLineStart - 1] !== '\n') {
        prevLineStart--
      }

      const prevLine = text.slice(prevLineStart, prevLineEnd)
      if (prevLine.trim() === '') {
        // Found blank line, include it
        start = prevLineStart
      } else {
        break
      }
    }

    // Move end forward to end of line
    while (end < text.length && text[end] !== '\n') {
      end++
    }

    // Move end forward to include following blank line (if any)
    while (end < text.length) {
      let nextLineStart = end + 1
      let nextLineEnd = nextLineStart
      while (nextLineEnd < text.length && text[nextLineEnd] !== '\n') {
        nextLineEnd++
      }

      const nextLine = text.slice(nextLineStart, nextLineEnd)
      if (nextLine.trim() === '') {
        // Found blank line, include it
        end = nextLineEnd
      } else {
        break
      }
    }

    return { start, end }
  }

  /**
   * Find nodes affected by the edit
   */
  private findAffectedNodes(range: Range, tree: Tree): NodeId[] {
    const affected: NodeId[] = []

    for (let i = 0; i < tree.nodes.length; i++) {
      const node = tree.nodes[i]
      if (!node || !node.span) continue

      const nodeStart = node.span.start.offset
      const nodeEnd = node.span.end.offset

      // Check if node overlaps with affected range
      if (nodeStart <= range.end && nodeEnd >= range.start) {
        affected.push(i)
      }
    }

    return affected
  }

  /**
   * Calculate affected line range
   */
  private calculateAffectedLines(range: Range, text: string): { start: number; end: number } {
    let lineStart = 0
    let lineEnd = 0
    let currentOffset = 0

    // Find start line
    for (let i = 0; i < text.length && currentOffset < range.start; i++) {
      if (text[i] === '\n') {
        lineStart++
      }
      currentOffset++
    }

    // Find end line
    currentOffset = 0
    for (let i = 0; i < text.length && currentOffset < range.end; i++) {
      if (text[i] === '\n') {
        lineEnd++
      }
      currentOffset++
    }

    return { start: lineStart, end: lineEnd }
  }

  /**
   * Perform incremental parse of affected region
   */
  private incrementalParse(
    newText: string,
    affected: AffectedRegion,
    options?: Omit<ParseOptions, 'plugins'>
  ): Tree {
    if (!this.previousTree) {
      // Safety check - should never happen
      this.previousText = newText
      this.previousTree = this.parser.parse(newText, options)
      return this.previousTree
    }

    // Extract affected text region
    const affectedText = newText.slice(affected.range.start, affected.range.end)

    // Parse only the affected region
    const affectedTree = this.parser.parse(affectedText, options)

    // Merge trees: Replace affected nodes with new nodes
    const mergedTree = this.mergeTree(
      this.previousTree,
      affectedTree,
      affected,
      newText
    )

    // Update state
    this.previousText = newText
    this.previousTree = mergedTree

    return mergedTree
  }

  /**
   * Merge new tree with existing tree (in-place modification for performance)
   */
  private mergeTree(
    oldTree: Tree,
    newTree: Tree,
    affected: AffectedRegion,
    newText: string
  ): Tree {
    // Update metadata in-place
    oldTree.meta.source = newText
    oldTree.meta.modified = Date.now()

    // Calculate offset delta for position adjustments
    const oldSize = affected.range.end - affected.range.start
    const newSize = newTree.meta.source.length
    const offsetDelta = newSize - oldSize

    // Find affected child indices
    const rootNode = oldTree.nodes[oldTree.root]
    if (!rootNode) {
      throw new Error('Invalid tree: missing root node')
    }

    const childrenBeforeAffected: number[] = []
    const childrenAfterAffected: number[] = []

    for (let i = 0; i < rootNode.children.length; i++) {
      const childId = rootNode.children[i]
      if (childId === undefined) continue

      const child = oldTree.nodes[childId]
      if (!child || !child.span) continue

      const childStart = child.span.start.offset
      const childEnd = child.span.end.offset

      // Check if child is before affected region
      if (childEnd < affected.range.start) {
        childrenBeforeAffected.push(childId)
      }
      // Check if child is after affected region
      else if (childStart > affected.range.end) {
        childrenAfterAffected.push(childId)
        // Adjust position in-place for nodes after affected region
        const nodeToAdjust = oldTree.nodes[childId]
        if (nodeToAdjust) {
          this.adjustNodePositionInPlace(nodeToAdjust, offsetDelta)
        }
      }
      // Otherwise child is affected and will be replaced
    }

    // Add new nodes from the affected tree (deep copy entire subtrees)
    const newNodeIds: number[] = []
    const rootChildren = newTree.nodes[newTree.root]?.children || []

    for (const childId of rootChildren) {
      const newNode = newTree.nodes[childId]
      if (!newNode) continue

      // Deep copy subtree and add all nodes to tree
      const newRootId = this.deepCopySubtree(
        newNode,
        newTree.nodes,
        oldTree,
        affected.range.start,
        oldTree.root
      )

      newNodeIds.push(newRootId)
    }

    // Reconstruct root children: before + new + after
    rootNode.children = [
      ...childrenBeforeAffected,
      ...newNodeIds,
      ...childrenAfterAffected,
    ]

    return oldTree
  }

  /**
   * Adjust node position in-place (for nodes after affected region)
   */
  private adjustNodePositionInPlace(node: any, offsetDelta: number): void {
    if (node.span) {
      node.span.start.offset += offsetDelta
      node.span.end.offset += offsetDelta
    }

    // Recursively adjust all descendants via their IDs
    for (const childId of node.children) {
      if (typeof childId === 'number' && this.previousTree) {
        const childNode = this.previousTree.nodes[childId]
        if (childNode) {
          this.adjustNodePositionInPlace(childNode, offsetDelta)
        }
      }
    }
  }

  /**
   * Deep copy entire subtree with position offset
   * Returns the root node ID of the copied subtree
   */
  private deepCopySubtree(
    node: any,
    sourceNodes: any[],
    targetTree: Tree,
    offset: number,
    newParent: number
  ): number {
    // First, recursively copy all children
    const copiedChildIds: number[] = []

    for (const childId of node.children) {
      const childNode = sourceNodes[childId]
      if (childNode) {
        // Recursively copy child - we'll set proper parent after creating this node
        const childCopyId = this.deepCopySubtree(
          childNode,
          sourceNodes,
          targetTree,
          offset,
          -1 // Placeholder, will be updated
        )
        copiedChildIds.push(childCopyId)
      }
    }

    // Create the copied node
    const nodeId = targetTree.nodes.length
    const copied = {
      id: nodeId,
      type: node.type,
      parent: newParent,
      children: copiedChildIds,
      span: node.span
        ? {
            start: {
              line: node.span.start.line,
              column: node.span.start.column,
              offset: node.span.start.offset + offset,
            },
            end: {
              line: node.span.end.line,
              column: node.span.end.column,
              offset: node.span.end.offset + offset,
            },
          }
        : undefined,
      data: node.data ? { ...node.data } : undefined,
    }

    targetTree.nodes.push(copied as any)

    // Update parent references in children
    for (const childId of copiedChildIds) {
      if (targetTree.nodes[childId]) {
        targetTree.nodes[childId]!.parent = nodeId
      }
    }

    return nodeId
  }

  /**
   * Get current tree
   */
  getTree(): Tree | null {
    return this.previousTree
  }

  /**
   * Get index (lazy build)
   */
  getIndex(): ASTIndex {
    return this.parser.getIndex()
  }
}

/**
 * Helper to detect edit operations from text changes
 */
export function detectEdit(oldText: string, newText: string): Edit {
  // Find common prefix
  let startIndex = 0
  while (
    startIndex < oldText.length &&
    startIndex < newText.length &&
    oldText[startIndex] === newText[startIndex]
  ) {
    startIndex++
  }

  // Find common suffix
  let oldEndIndex = oldText.length
  let newEndIndex = newText.length

  while (
    oldEndIndex > startIndex &&
    newEndIndex > startIndex &&
    oldText[oldEndIndex - 1] === newText[newEndIndex - 1]
  ) {
    oldEndIndex--
    newEndIndex--
  }

  return {
    startIndex,
    oldEndIndex,
    newEndIndex,
  }
}

/**
 * Calculate edit distance for analysis
 */
export function calculateEditDistance(edit: Edit): number {
  const deletions = edit.oldEndIndex - edit.startIndex
  const insertions = edit.newEndIndex - edit.startIndex
  return Math.max(deletions, insertions)
}

/**
 * Check if incremental parsing would be beneficial
 */
export function shouldUseIncremental(edit: Edit, documentLength: number): boolean {
  const affectedSize = calculateEditDistance(edit)
  const threshold = documentLength * 0.3 // 30% threshold

  return affectedSize < threshold
}
