/**
 * Simple Markdown parser
 *
 * NOTE: This is a minimal implementation for demonstration.
 * Production version should use a proper parser or integrate with existing ones.
 */

import type { Tree } from '../../types/index.js'
import { createTree, addNode } from '../../types/index.js'

/**
 * Parse markdown to AST
 */
export function parse(source: string): Tree {
  const tree = createTree('markdown', source)
  const lines = source.split('\n')

  let lineNumber = 0

  for (const line of lines) {
    lineNumber++
    parseLine(tree, line, lineNumber)
  }

  return tree
}

/**
 * Parse a single line
 */
function parseLine(tree: Tree, line: string, _lineNumber: number): void {
  // Heading
  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
  if (headingMatch) {
    const depth = headingMatch[1]!.length as 1 | 2 | 3 | 4 | 5 | 6
    const text = headingMatch[2]!

    const headingId = addNode(tree, {
      type: 'heading',
      parent: tree.root,
      children: [],
      data: { depth },
    })

    const textId = addNode(tree, {
      type: 'text',
      parent: headingId,
      children: [],
      data: { value: text },
    })

    tree.nodes[headingId]!.children.push(textId)
    tree.nodes[0]!.children.push(headingId)
    return
  }

  // Code block (simplified - just detect ``` lines)
  if (line.startsWith('```')) {
    // Handle code blocks (simplified)
    return
  }

  // List item
  const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
  if (listMatch) {
    const text = listMatch[3]!

    const listItemId = addNode(tree, {
      type: 'listItem',
      parent: tree.root,
      children: [],
    })

    const textId = addNode(tree, {
      type: 'text',
      parent: listItemId,
      children: [],
      data: { value: text },
    })

    tree.nodes[listItemId]!.children.push(textId)
    tree.nodes[0]!.children.push(listItemId)
    return
  }

  // Paragraph (any non-empty line)
  if (line.trim()) {
    const paragraphId = addNode(tree, {
      type: 'paragraph',
      parent: tree.root,
      children: [],
    })

    const textId = addNode(tree, {
      type: 'text',
      parent: paragraphId,
      children: [],
      data: { value: line },
    })

    tree.nodes[paragraphId]!.children.push(textId)
    tree.nodes[0]!.children.push(paragraphId)
  }
}
