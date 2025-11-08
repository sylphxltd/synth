/**
 * Plugin System for Markdown Parser
 *
 * Provides extensibility through a clean plugin architecture.
 *
 * Features:
 * - Transform plugins for AST manipulation
 * - Visitor plugins for node traversal
 * - Type-safe plugin API
 * - Composition and chaining
 */

import type { BaseNode, Tree } from '@sylphx/ast-core'
import type { MarkdownNode, MarkdownVisitorMap } from './types.js'

// ============================================================================
// Plugin Types
// ============================================================================

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin name */
  name: string

  /** Plugin version */
  version?: string

  /** Plugin description */
  description?: string

  /** Plugin author */
  author?: string
}

/**
 * Transform plugin - receives and returns the entire tree
 */
export interface TransformPlugin {
  /** Plugin metadata */
  meta: PluginMetadata

  /** Transform function */
  transform: (tree: Tree) => Tree | Promise<Tree>
}

/**
 * Visitor plugin - processes individual nodes
 */
export interface VisitorPlugin {
  /** Plugin metadata */
  meta: PluginMetadata

  /** Visitor functions for specific node types */
  visitors: MarkdownVisitorMap

  /** Optional setup hook */
  setup?: (tree: Tree) => void | Promise<void>

  /** Optional teardown hook */
  teardown?: (tree: Tree) => void | Promise<void>
}

/**
 * Parser plugin - can modify parser behavior
 */
export interface ParserPlugin {
  /** Plugin metadata */
  meta: PluginMetadata

  /** Custom tokenizer extensions */
  tokenizers?: {
    block?: BlockTokenizer[]
    inline?: InlineTokenizer[]
  }

  /** Parser hooks */
  hooks?: {
    beforeParse?: (text: string) => string
    afterParse?: (tree: Tree) => Tree
  }
}

/**
 * Custom block tokenizer
 */
export interface BlockTokenizer {
  name: string
  test: (line: string) => boolean
  parse: (lines: string[], startIndex: number) => { token: any; consumed: number } | null
}

/**
 * Custom inline tokenizer
 */
export interface InlineTokenizer {
  name: string
  test: (text: string, offset: number) => boolean
  parse: (text: string, offset: number) => { token: any; consumed: number } | null
}

/**
 * Union of all plugin types
 */
export type Plugin = TransformPlugin | VisitorPlugin | ParserPlugin

/**
 * Type guard for transform plugins
 */
export function isTransformPlugin(plugin: Plugin): plugin is TransformPlugin {
  return 'transform' in plugin && typeof plugin.transform === 'function'
}

/**
 * Type guard for visitor plugins
 */
export function isVisitorPlugin(plugin: Plugin): plugin is VisitorPlugin {
  return 'visitors' in plugin && typeof plugin.visitors === 'object'
}

/**
 * Type guard for parser plugins
 */
export function isParserPlugin(plugin: Plugin): plugin is ParserPlugin {
  return 'tokenizers' in plugin || 'hooks' in plugin
}

// ============================================================================
// Plugin Manager
// ============================================================================

/**
 * Plugin manager for composing and executing plugins
 */
export class PluginManager {
  private plugins: Plugin[] = []

  /**
   * Register a plugin
   */
  use(plugin: Plugin): this {
    this.plugins.push(plugin)
    return this
  }

  /**
   * Register multiple plugins
   */
  useAll(plugins: Plugin[]): this {
    this.plugins.push(...plugins)
    return this
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins]
  }

  /**
   * Get plugins by type
   */
  getPluginsByType<T extends Plugin>(predicate: (plugin: Plugin) => plugin is T): T[] {
    return this.plugins.filter(predicate)
  }

  /**
   * Apply all plugins to a tree
   */
  async apply(tree: Tree): Promise<Tree> {
    let result = tree

    // Apply transform plugins
    const transformPlugins = this.getPluginsByType(isTransformPlugin)
    for (const plugin of transformPlugins) {
      result = await plugin.transform(result)
    }

    // Apply visitor plugins
    const visitorPlugins = this.getPluginsByType(isVisitorPlugin)
    for (const plugin of visitorPlugins) {
      // Setup hook
      if (plugin.setup) {
        await plugin.setup(result)
      }

      // Visit nodes
      result = this.applyVisitors(result, plugin.visitors)

      // Teardown hook
      if (plugin.teardown) {
        await plugin.teardown(result)
      }
    }

    return result
  }

  /**
   * Apply visitor functions to all nodes in the tree
   */
  private applyVisitors(tree: Tree, visitors: MarkdownVisitorMap): Tree {
    const visitNode = (node: BaseNode): BaseNode => {
      const visitor = visitors[node.type as MarkdownNode['type']]
      if (visitor) {
        const result = visitor(node as any)
        if (result) {
          node = result
        }
      }

      // Visit children
      if (node.children.length > 0) {
        for (let i = 0; i < node.children.length; i++) {
          const childId = node.children[i]!
          const child = tree.nodes[childId]
          if (child) {
            const visited = visitNode(child)
            tree.nodes[childId] = visited
          }
        }
      }

      return node
    }

    const root = tree.nodes[0]
    if (root) {
      tree.nodes[0] = visitNode(root)
    }

    return tree
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins = []
  }

  /**
   * Remove a plugin by name
   */
  remove(name: string): boolean {
    const index = this.plugins.findIndex((p) => p.meta.name === name)
    if (index !== -1) {
      this.plugins.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.some((p) => p.meta.name === name)
  }
}

// ============================================================================
// Plugin Factory Helpers
// ============================================================================

/**
 * Create a transform plugin
 */
export function createTransformPlugin(
  meta: PluginMetadata,
  transform: (tree: Tree) => Tree | Promise<Tree>
): TransformPlugin {
  return { meta, transform }
}

/**
 * Create a visitor plugin
 */
export function createVisitorPlugin(
  meta: PluginMetadata,
  visitors: MarkdownVisitorMap,
  hooks?: {
    setup?: (tree: Tree) => void | Promise<void>
    teardown?: (tree: Tree) => void | Promise<void>
  }
): VisitorPlugin {
  return {
    meta,
    visitors,
    setup: hooks?.setup,
    teardown: hooks?.teardown,
  }
}

/**
 * Create a parser plugin
 */
export function createParserPlugin(
  meta: PluginMetadata,
  config: {
    tokenizers?: {
      block?: BlockTokenizer[]
      inline?: InlineTokenizer[]
    }
    hooks?: {
      beforeParse?: (text: string) => string
      afterParse?: (tree: Tree) => Tree
    }
  }
): ParserPlugin {
  return {
    meta,
    tokenizers: config.tokenizers,
    hooks: config.hooks,
  }
}

// ============================================================================
// Built-in Plugins
// ============================================================================

/**
 * Plugin to remove all comments from the tree
 */
export const remarkRemoveComments = createVisitorPlugin(
  {
    name: 'remark-remove-comments',
    version: '1.0.0',
    description: 'Remove HTML comment nodes from the tree',
  },
  {
    htmlBlock: (node) => {
      if (node.content.trim().startsWith('<!--')) {
        // Return undefined to remove the node
        return undefined as any
      }
      return node
    },
  }
)

/**
 * Plugin to add heading IDs (slug generation)
 */
export const remarkHeadingId = createVisitorPlugin(
  {
    name: 'remark-heading-id',
    version: '1.0.0',
    description: 'Add slugified IDs to headings',
  },
  {
    heading: (node) => {
      // Simple slugification
      const slug = node.text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')

      return {
        ...node,
        data: {
          ...node.data,
          id: slug,
        },
      }
    },
  }
)

/**
 * Plugin to collect all headings for a table of contents
 */
export const remarkToc = createVisitorPlugin(
  {
    name: 'remark-toc',
    version: '1.0.0',
    description: 'Collect headings for table of contents',
  },
  {
    heading: (node) => {
      // Store in tree metadata
      return node
    },
  },
  {
    setup: (tree) => {
      if (!tree.meta.data) {
        tree.meta.data = {}
      }
      tree.meta.data.toc = []
    },
    teardown: (tree) => {
      // Collect all headings
      const headings: any[] = []
      const collectHeadings = (node: BaseNode) => {
        if (node.type === 'heading') {
          headings.push({
            depth: (node as any).depth,
            text: (node as any).text,
            id: node.data?.id,
          })
        }
        for (const childId of node.children) {
          const child = tree.nodes[childId]
          if (child) {
            collectHeadings(child)
          }
        }
      }
      const root = tree.nodes[0]
      if (root) {
        collectHeadings(root)
      }
      if (tree.meta.data) {
        tree.meta.data.toc = headings
      }
    },
  }
)

/**
 * Plugin to uppercase all heading text
 */
export const remarkUppercaseHeadings = createVisitorPlugin(
  {
    name: 'remark-uppercase-headings',
    version: '1.0.0',
    description: 'Convert all heading text to uppercase',
  },
  {
    heading: (node) => ({
      ...node,
      text: node.text.toUpperCase(),
    }),
  }
)

/**
 * Plugin to add line numbers to code blocks
 */
export const remarkCodeLineNumbers = createVisitorPlugin(
  {
    name: 'remark-code-line-numbers',
    version: '1.0.0',
    description: 'Add line numbers to code blocks',
  },
  {
    codeBlock: (node) => {
      const lines = node.code.split('\n')
      const numbered = lines
        .map((line, i) => `${String(i + 1).padStart(3, ' ')} | ${line}`)
        .join('\n')

      return {
        ...node,
        data: {
          ...node.data,
          hasLineNumbers: true,
          originalCode: node.code,
        },
        code: numbered,
      }
    },
  }
)

/**
 * Plugin to wrap all paragraphs in a custom container
 */
export const remarkWrapParagraphs = createTransformPlugin(
  {
    name: 'remark-wrap-paragraphs',
    version: '1.0.0',
    description: 'Wrap paragraphs with metadata',
  },
  (tree) => {
    // Example transform: add metadata to all paragraphs
    for (const node of tree.nodes) {
      if (node.type === 'paragraph') {
        node.data = {
          ...node.data,
          wrapped: true,
          timestamp: Date.now(),
        }
      }
    }
    return tree
  }
)
