/**
 * Incremental Markdown Parser
 *
 * Parses Markdown tokens into Synth AST with support for incremental re-parsing.
 * Integrates with node pool and query index for maximum performance.
 */

import type { Tree, NodeId } from '@sylphx/ast-core'
import { createTree, addNode } from '@sylphx/ast-core'
import type { Edit } from '@sylphx/ast-core'
import { createIndex, type ASTIndex } from '@sylphx/ast-core'
import { globalNodePool } from '@sylphx/ast-optimizations'
import { IncrementalTokenizer } from './tokenizer.js'
import { InlineTokenizer } from './inline-tokenizer.js'
import type { BlockToken, InlineToken } from './tokens.js'

/**
 * Incremental Markdown Parser
 *
 * Provides complete Markdown parsing with incremental re-parsing support.
 */
export class IncrementalMarkdownParser {
  private tokenizer: IncrementalTokenizer
  private inlineTokenizer: InlineTokenizer
  private tree: Tree | null = null
  private tokens: BlockToken[] = []
  private index: ASTIndex | null = null

  constructor() {
    this.tokenizer = new IncrementalTokenizer()
    this.inlineTokenizer = new InlineTokenizer()
  }

  /**
   * Full parse of Markdown text
   */
  parse(text: string): Tree {
    // 1. Tokenize
    this.tokens = this.tokenizer.tokenize(text)

    // 2. Build AST
    this.tree = this.buildTree(this.tokens, text)

    // 3. Build index
    this.index = createIndex(this.tree)
    this.index.build()

    return this.tree
  }

  /**
   * Incremental parse after edit
   *
   * Strategy:
   * 1. Incremental tokenize
   * 2. Find affected nodes
   * 3. Re-parse affected region
   * 4. Structural sharing (reuse unchanged nodes)
   * 5. Rebuild index
   */
  parseIncremental(text: string, edit: Edit): Tree {
    if (!this.tree || !this.index) {
      throw new Error('Must call parse() before parseIncremental()')
    }

    // 1. Incremental tokenize
    this.tokens = this.tokenizer.retokenize(text, edit, this.tokens)

    // 2. Find affected nodes using index
    const affectedNodeIds = this.findAffectedNodes(edit)

    // 3. Release affected nodes to pool
    for (const nodeId of affectedNodeIds) {
      const node = this.tree.nodes[nodeId]
      if (node) {
        globalNodePool.release(node)
      }
    }

    // 4. Re-build entire tree (for now - will optimize later)
    this.tree = this.buildTree(this.tokens, text)

    // 5. Rebuild index
    this.index = createIndex(this.tree)
    this.index.build()

    return this.tree
  }

  /**
   * Build AST from tokens
   */
  private buildTree(tokens: BlockToken[], source: string): Tree {
    const tree = createTree('markdown', source)

    // Convert each token to a node
    for (const token of tokens) {
      const nodeId = this.buildNode(tree, token, tree.root)
      if (nodeId !== null) {
        tree.nodes[tree.root]!.children.push(nodeId)
      }
    }

    return tree
  }

  /**
   * Build a single node from token
   */
  private buildNode(tree: Tree, token: BlockToken, parent: NodeId): NodeId | null {
    // Skip blank lines (don't create nodes for them)
    if (token.type === 'blankLine') {
      return null
    }

    switch (token.type) {
      case 'heading': {
        const headingId = addNode(tree, {
          type: 'heading',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: { depth: token.depth },
        })

        // Parse inline elements
        this.buildInlineNodes(tree, token.text, headingId, token.position.start)

        return headingId
      }

      case 'paragraph': {
        const paragraphId = addNode(tree, {
          type: 'paragraph',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
        })

        // Parse inline elements
        this.buildInlineNodes(tree, token.text, paragraphId, token.position.start)

        return paragraphId
      }

      case 'codeBlock': {
        return addNode(tree, {
          type: 'code',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: {
            value: token.code,
            lang: token.lang,
            meta: token.meta,
          },
        })
      }

      case 'listItem': {
        const listItemId = addNode(tree, {
          type: 'listItem',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: {
            checked: token.checked,
          },
        })

        // Parse inline elements
        this.buildInlineNodes(tree, token.text, listItemId, token.position.start)

        return listItemId
      }

      case 'blockquote': {
        const blockquoteId = addNode(tree, {
          type: 'blockquote',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
        })

        // Parse inline elements
        this.buildInlineNodes(tree, token.text, blockquoteId, token.position.start)

        return blockquoteId
      }

      case 'horizontalRule': {
        return addNode(tree, {
          type: 'thematicBreak',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
        })
      }

      default: {
        console.warn(`Unknown token type: ${(token as any).type}`)
        return null
      }
    }
  }

  /**
   * Build inline nodes from text
   */
  private buildInlineNodes(
    tree: Tree,
    text: string,
    parent: NodeId,
    startPos: { line: number; column: number; offset: number }
  ): void {
    // Tokenize inline elements
    const inlineTokens = this.inlineTokenizer.tokenize(text, startPos.line, startPos.offset)

    // Create nodes for each inline token
    for (const inlineToken of inlineTokens) {
      const nodeId = this.buildInlineNode(tree, inlineToken, parent)
      if (nodeId !== null) {
        tree.nodes[parent]!.children.push(nodeId)
      }
    }
  }

  /**
   * Build a single inline node
   */
  private buildInlineNode(tree: Tree, token: InlineToken, parent: NodeId): NodeId | null {
    switch (token.type) {
      case 'text': {
        return addNode(tree, {
          type: 'text',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: { value: token.value },
        })
      }

      case 'emphasis': {
        const emphasisId = addNode(tree, {
          type: 'emphasis',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
        })

        // Add text child for the emphasized content
        const textId = addNode(tree, {
          type: 'text',
          parent: emphasisId,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: { value: token.text },
        })

        tree.nodes[emphasisId]!.children.push(textId)
        return emphasisId
      }

      case 'strong': {
        const strongId = addNode(tree, {
          type: 'strong',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
        })

        // Add text child for the strong content
        const textId = addNode(tree, {
          type: 'text',
          parent: strongId,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: { value: token.text },
        })

        tree.nodes[strongId]!.children.push(textId)
        return strongId
      }

      case 'inlineCode': {
        return addNode(tree, {
          type: 'inlineCode',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: { value: token.value },
        })
      }

      case 'link': {
        const linkId = addNode(tree, {
          type: 'link',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: {
            url: token.url,
            title: token.title,
          },
        })

        // Add text child for link text
        const textId = addNode(tree, {
          type: 'text',
          parent: linkId,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: { value: token.text },
        })

        tree.nodes[linkId]!.children.push(textId)
        return linkId
      }

      case 'image': {
        return addNode(tree, {
          type: 'image',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: {
            url: token.url,
            title: token.title,
            alt: token.alt,
          },
        })
      }

      case 'lineBreak': {
        return addNode(tree, {
          type: 'break',
          parent,
          children: [],
          span: {
            start: token.position.start,
            end: token.position.end,
          },
          data: { hard: token.hard },
        })
      }

      default: {
        console.warn(`Unknown inline token type: ${(token as any).type}`)
        return null
      }
    }
  }

  /**
   * Find affected nodes based on edit
   */
  private findAffectedNodes(edit: Edit): NodeId[] {
    if (!this.index) return []

    const affected = new Set<NodeId>()

    // Find nodes that overlap with the edit range
    for (let i = 0; i < this.tree!.nodes.length; i++) {
      const node = this.tree!.nodes[i]
      if (!node || !node.span) continue

      const nodeStart = node.span.start.offset
      const nodeEnd = node.span.end.offset

      // Check if node overlaps with edit range
      if (
        (nodeStart <= edit.startByte && nodeEnd >= edit.startByte) ||
        (nodeStart <= edit.oldEndByte && nodeEnd >= edit.oldEndByte) ||
        (nodeStart >= edit.startByte && nodeEnd <= edit.oldEndByte)
      ) {
        affected.add(i)

        // Also mark parent as affected
        if (node.parent !== null) {
          affected.add(node.parent)
        }
      }
    }

    return Array.from(affected)
  }

  /**
   * Get current tree
   */
  getTree(): Tree {
    if (!this.tree) {
      throw new Error('No tree available. Call parse() first.')
    }
    return this.tree
  }

  /**
   * Get current tokens
   */
  getTokens(): BlockToken[] {
    return this.tokens
  }

  /**
   * Get index
   */
  getIndex(): ASTIndex | null {
    return this.index
  }
}

/**
 * Create an incremental Markdown parser
 */
export function createMarkdownParser(): IncrementalMarkdownParser {
  return new IncrementalMarkdownParser()
}

/**
 * Parse Markdown text (one-shot)
 */
export function parseMarkdown(text: string): Tree {
  const parser = createMarkdownParser()
  return parser.parse(text)
}
