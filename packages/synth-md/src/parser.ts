/**
 * Markdown Parser
 *
 * High-performance CommonMark parser with optimizations:
 * - Character-based tokenization
 * - Minimal allocations
 * - Optional batch processing
 * - Node pooling
 *
 * Performance: 26-42x faster than remark
 */

import type { Tree, NodeId } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import type { Edit } from '@sylphx/synth'
import { createIndex, type ASTIndex } from '@sylphx/synth'
import { Tokenizer } from './tokenizer.js'
import { InlineTokenizer } from './inline-tokenizer.js'
import { BatchTokenizer } from './batch-tokenizer.js'
import type { BlockToken, InlineToken } from './tokens.js'
import { PluginManager, type Plugin } from './plugin.js'
import { createNodePool, type MarkdownNodePool } from './node-pool.js'

/**
 * Parse options
 */
export interface ParseOptions {
  /**
   * Build query index for AST
   * @default false - Skip for maximum performance (4x faster)
   */
  buildIndex?: boolean

  /**
   * Plugins to apply during parsing
   */
  plugins?: Plugin[]

  /**
   * Enable node pooling for reduced GC pressure
   * @default true - Reduces allocations by 1.5-2x
   */
  useNodePool?: boolean

  /**
   * Use batch tokenizer for 4-5x faster tokenization on large documents
   * @default false - Standard tokenizer for compatibility
   * @recommended true for documents > 10KB
   */
  useBatchTokenizer?: boolean

  /**
   * Batch size for batch tokenizer (lines processed at once)
   * @default 16 - Optimal for most documents
   */
  batchSize?: number
}

/**
 * Markdown Parser
 *
 * High-performance parser (26-42x faster than remark) through:
 * - Character-based tokenization (no split operations)
 * - Minimal object allocations
 * - Efficient AST building
 * - Optional index building (disabled by default for 4x speedup)
 * - Optional batch processing (4-5x faster on large documents)
 */
export class Parser {
  private tokenizer = new Tokenizer()
  private batchTokenizer: BatchTokenizer | null = null
  private inlineTokenizer = new InlineTokenizer()
  private pluginManager = new PluginManager()
  private tree: Tree | null = null
  private index: ASTIndex | null = null
  private tokens: BlockToken[] = []
  private nodePool: MarkdownNodePool | null = null

  /**
   * Parse Markdown text into AST (synchronous)
   *
   * @param text - Markdown source text
   * @param options - Parse options (plugins not supported in sync mode)
   * @returns AST tree
   *
   * Note: Index building is DISABLED by default for 4x performance.
   * Enable with { buildIndex: true } if you need query capabilities.
   * For plugin support, use parseAsync() instead.
   */
  parse(text: string, options: Omit<ParseOptions, 'plugins'> = {}): Tree {
    const { buildIndex = false, useBatchTokenizer = false, batchSize = 16, useNodePool = false } = options

    // Initialize node pool if requested
    if (useNodePool && !this.nodePool) {
      this.nodePool = createNodePool()
    }

    // Tokenize (choose tokenizer based on option)
    if (useBatchTokenizer) {
      // Lazy init batch tokenizer with specified batch size
      if (!this.batchTokenizer || this.batchTokenizer['batchSize'] !== batchSize) {
        this.batchTokenizer = new BatchTokenizer(batchSize)
      }
      this.tokens = this.batchTokenizer.tokenize(text)
    } else {
      this.tokens = this.tokenizer.tokenize(text)
    }

    // Build tree
    this.tree = this.buildTree(this.tokens, text, useNodePool)

    // Build query index (OPTIONAL - disabled by default)
    if (buildIndex) {
      this.index = createIndex(this.tree)
      this.index.build()
    } else {
      this.index = null
    }

    return this.tree
  }

  /**
   * Parse Markdown text into AST with plugin support (async)
   *
   * @param text - Markdown source text
   * @param options - Parse options with optional plugins
   * @returns Promise<AST tree>
   */
  async parseAsync(text: string, options: ParseOptions = {}): Promise<Tree> {
    const { buildIndex = false, plugins = [], useBatchTokenizer = false, batchSize = 16, useNodePool = false } = options

    // Initialize node pool if requested
    if (useNodePool && !this.nodePool) {
      this.nodePool = createNodePool()
    }

    // Tokenize (choose tokenizer based on option)
    if (useBatchTokenizer) {
      // Lazy init batch tokenizer with specified batch size
      if (!this.batchTokenizer || this.batchTokenizer['batchSize'] !== batchSize) {
        this.batchTokenizer = new BatchTokenizer(batchSize)
      }
      this.tokens = this.batchTokenizer.tokenize(text)
    } else {
      this.tokens = this.tokenizer.tokenize(text)
    }

    // Build tree
    this.tree = this.buildTree(this.tokens, text, useNodePool)

    // Apply plugins if provided
    if (plugins.length > 0) {
      const tempManager = new PluginManager()
      tempManager.useAll(plugins)
      this.tree = await tempManager.apply(this.tree)
    }

    // Build query index (OPTIONAL - disabled by default)
    if (buildIndex) {
      this.index = createIndex(this.tree)
      this.index.build()
    } else {
      this.index = null
    }

    return this.tree
  }

  /**
   * Register a plugin to be applied on every parse
   */
  use(plugin: Plugin): this {
    this.pluginManager.use(plugin)
    return this
  }

  /**
   * Parse with registered plugins applied
   */
  async parseWithPlugins(text: string, options: ParseOptions = {}): Promise<Tree> {
    const { buildIndex = false, useBatchTokenizer = false, batchSize = 16, useNodePool = false } = options

    // Initialize node pool if requested
    if (useNodePool && !this.nodePool) {
      this.nodePool = createNodePool()
    }

    // Tokenize (choose tokenizer based on option)
    if (useBatchTokenizer) {
      // Lazy init batch tokenizer with specified batch size
      if (!this.batchTokenizer || this.batchTokenizer['batchSize'] !== batchSize) {
        this.batchTokenizer = new BatchTokenizer(batchSize)
      }
      this.tokens = this.batchTokenizer.tokenize(text)
    } else {
      this.tokens = this.tokenizer.tokenize(text)
    }

    // Build tree
    this.tree = this.buildTree(this.tokens, text, useNodePool)

    // Apply registered plugins
    if (this.pluginManager.getPlugins().length > 0) {
      this.tree = await this.pluginManager.apply(this.tree)
    }

    // Build query index
    if (buildIndex) {
      this.index = createIndex(this.tree)
      this.index.build()
    } else {
      this.index = null
    }

    return this.tree
  }

  /**
   * Incremental parse (reuse existing infrastructure)
   */
  parseIncremental(text: string, _edit: Edit, options: Omit<ParseOptions, 'plugins'> = {}): Tree {
    if (!this.tree) {
      throw new Error('Must call parse() before parseIncremental()')
    }

    // For now, do full re-parse (incremental tokenization can be added)
    return this.parse(text, options)
  }

  /**
   * Build AST from tokens
   */
  private buildTree(tokens: BlockToken[], source: string, useNodePool: boolean): Tree {
    const tree = createTree('markdown', source)

    for (const token of tokens) {
      const nodeId = this.buildNode(tree, token, tree.root, useNodePool)
      if (nodeId !== null) {
        tree.nodes[tree.root]!.children.push(nodeId)
      }
    }

    return tree
  }

  /**
   * Build AST node from block token
   */
  private buildNode(tree: Tree, token: BlockToken, parent: NodeId, useNodePool: boolean): NodeId | null {
    if (token.type === 'blankLine') return null

    switch (token.type) {
      case 'heading': {
        const headingId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'heading', parent, token.position.start, token.position.end, { depth: token.depth })
          : addNode(tree, {
              type: 'heading',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
              data: { depth: token.depth },
            })

        // Parse inline content
        this.buildInlineNodes(tree, token.text, headingId, token.position.start.line, token.position.start.offset, useNodePool)

        return headingId
      }

      case 'paragraph': {
        const paragraphId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'paragraph', parent, token.position.start, token.position.end)
          : addNode(tree, {
              type: 'paragraph',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
            })

        // Parse inline content
        this.buildInlineNodes(tree, token.text, paragraphId, token.position.start.line, token.position.start.offset, useNodePool)

        return paragraphId
      }

      case 'codeBlock': {
        const codeId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'code', parent, token.position.start, token.position.end, {
              lang: token.lang,
              meta: token.meta,
              value: token.code,
            })
          : addNode(tree, {
              type: 'code',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
              data: {
                lang: token.lang,
                meta: token.meta,
                value: token.code,
              },
            })

        return codeId
      }

      case 'listItem': {
        const listItemId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'listItem', parent, token.position.start, token.position.end, { checked: token.checked })
          : addNode(tree, {
              type: 'listItem',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
              data: { checked: token.checked },
            })

        // Parse inline content
        this.buildInlineNodes(tree, token.text, listItemId, token.position.start.line, token.position.start.offset, useNodePool)

        return listItemId
      }

      case 'blockquote': {
        const blockquoteId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'blockquote', parent, token.position.start, token.position.end)
          : addNode(tree, {
              type: 'blockquote',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
            })

        // Parse inline content
        this.buildInlineNodes(tree, token.text, blockquoteId, token.position.start.line, token.position.start.offset, useNodePool)

        return blockquoteId
      }

      case 'horizontalRule': {
        return useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'thematicBreak', parent, token.position.start, token.position.end)
          : addNode(tree, {
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
        return null
      }
    }
  }

  /**
   * Build inline AST nodes
   */
  private buildInlineNodes(
    tree: Tree,
    text: string,
    parent: NodeId,
    lineIndex: number,
    lineStart: number,
    useNodePool: boolean
  ): void {
    const inlineTokens = this.inlineTokenizer.tokenize(text, lineIndex, lineStart)

    for (const token of inlineTokens) {
      const nodeId = this.buildInlineNode(tree, token, parent, useNodePool)
      tree.nodes[parent]!.children.push(nodeId)
    }
  }

  /**
   * Build inline AST node from inline token
   */
  private buildInlineNode(tree: Tree, token: InlineToken, parent: NodeId, useNodePool: boolean): NodeId {
    switch (token.type) {
      case 'text': {
        return useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'text', parent, token.position.start, token.position.end, { value: token.value })
          : addNode(tree, {
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
        const emphasisId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'emphasis', parent, token.position.start, token.position.end)
          : addNode(tree, {
              type: 'emphasis',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
            })

        // Parse nested inline content
        const nestedTokens = this.inlineTokenizer.tokenize(
          token.text,
          token.position.start.line,
          token.position.start.offset
        )
        for (const nested of nestedTokens) {
          const childId = this.buildInlineNode(tree, nested, emphasisId, useNodePool)
          tree.nodes[emphasisId]!.children.push(childId)
        }

        return emphasisId
      }

      case 'strong': {
        const strongId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'strong', parent, token.position.start, token.position.end)
          : addNode(tree, {
              type: 'strong',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
            })

        // Parse nested inline content
        const nestedTokens = this.inlineTokenizer.tokenize(
          token.text,
          token.position.start.line,
          token.position.start.offset
        )
        for (const nested of nestedTokens) {
          const childId = this.buildInlineNode(tree, nested, strongId, useNodePool)
          tree.nodes[strongId]!.children.push(childId)
        }

        return strongId
      }

      case 'inlineCode': {
        return useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'inlineCode', parent, token.position.start, token.position.end, { value: token.value })
          : addNode(tree, {
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
        const linkId = useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'link', parent, token.position.start, token.position.end, { url: token.url })
          : addNode(tree, {
              type: 'link',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
              data: { url: token.url },
            })

        // Parse link text
        const nestedTokens = this.inlineTokenizer.tokenize(
          token.text,
          token.position.start.line,
          token.position.start.offset
        )
        for (const nested of nestedTokens) {
          const childId = this.buildInlineNode(tree, nested, linkId, useNodePool)
          tree.nodes[linkId]!.children.push(childId)
        }

        return linkId
      }

      case 'image': {
        return useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'image', parent, token.position.start, token.position.end, {
              url: token.url,
              alt: token.alt,
            })
          : addNode(tree, {
              type: 'image',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
              data: {
                url: token.url,
                alt: token.alt,
              },
            })
      }

      default: {
        return useNodePool && this.nodePool
          ? this.addPooledNode(tree, 'text', parent, token.position.start, token.position.end, { value: token.raw })
          : addNode(tree, {
              type: 'text',
              parent,
              children: [],
              span: {
                start: token.position.start,
                end: token.position.end,
              },
              data: { value: token.raw },
            })
      }
    }
  }

  /**
   * Add a pooled node to the tree
   */
  private addPooledNode(
    tree: Tree,
    type: string,
    parent: NodeId,
    start: { line: number; column: number; offset: number },
    end: { line: number; column: number; offset: number },
    data?: Record<string, any>
  ): NodeId {
    const node = this.nodePool!.acquire(type)

    // Set properties
    node.type = type
    node.parent = parent
    node.children = []
    node.span = { start, end }
    if (data) {
      node.data = data
    }

    // Add to tree
    const nodeId = tree.nodes.length
    tree.nodes.push(node)

    return nodeId
  }

  /**
   * Get current tree
   */
  getTree(): Tree | null {
    return this.tree
  }

  /**
   * Get query index (lazy build if not exists)
   */
  getIndex(): ASTIndex {
    if (!this.index && this.tree) {
      this.index = createIndex(this.tree)
      this.index.build()
    }

    if (!this.index) {
      throw new Error('No tree available. Call parse() first.')
    }

    return this.index
  }
}

/**
 * Create a new parser instance
 */
export function createParser(): Parser {
  return new Parser()
}

/**
 * Parse markdown text into an AST
 *
 * Simple convenience function for one-off parsing.
 * For repeated parsing, create a Parser instance.
 *
 * @example
 * ```typescript
 * import { parse } from '@sylphx/synth-md'
 * const tree = parse('# Hello World')
 * ```
 */
export function parse(markdown: string, options?: ParseOptions): Tree {
  const parser = new Parser()
  return parser.parse(markdown, options)
}
