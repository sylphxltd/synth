/**
 * SQL Parser
 *
 * Converts SQL source to Synth's universal AST
 * Uses node-sql-parser for parsing, then converts to Synth format
 */

import type { Tree, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import { Parser as NodeSQLParser } from 'node-sql-parser'
import type { NodeId } from '@sylphx/synth'

export interface SQLParseOptions {
  /** SQL dialect (mysql, postgresql, sqlite, etc.) */
  dialect?: 'mysql' | 'postgresql' | 'sqlite' | 'transactsql' | 'mariadb'

  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]
}

export class SQLParser {
  private plugins: Plugin[] = []
  private tree: Tree | null = null
  private parser: NodeSQLParser

  constructor() {
    this.parser = new NodeSQLParser()
  }

  /**
   * Register a plugin
   */
  use(plugin: Plugin): this {
    this.plugins.push(plugin)
    return this
  }

  /**
   * Parse SQL synchronously
   */
  parse(source: string, options: SQLParseOptions = {}): Tree {
    const tree = createTree('sql', source)
    this.tree = tree

    try {
      // Parse with node-sql-parser
      const dialect = options.dialect || 'mysql'
      const ast = this.parser.astify(source, { database: dialect })

      // Convert node-sql-parser AST to Synth AST
      this.convertNode(tree, ast, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`SQL parse error: ${error}`, 'PARSE_ERROR')
    }

    // Apply plugins
    const allPlugins = [...this.plugins, ...(options.plugins || [])]

    const hasAsyncPlugin = allPlugins.some(
      (p) => 'transform' in p && p.transform.constructor.name === 'AsyncFunction'
    )

    if (hasAsyncPlugin) {
      throw new SynthError(
        'Detected async plugins. Use parseAsync() instead of parse()',
        'ASYNC_PLUGIN_IN_SYNC_PARSE'
      )
    }

    let result = tree
    for (const plugin of allPlugins) {
      if ('transform' in plugin) {
        result = plugin.transform(result) as Tree
      }
    }

    this.tree = result
    return result
  }

  /**
   * Parse SQL asynchronously
   */
  async parseAsync(source: string, options: SQLParseOptions = {}): Promise<Tree> {
    const tree = createTree('sql', source)
    this.tree = tree

    try {
      const dialect = options.dialect || 'mysql'
      const ast = this.parser.astify(source, { database: dialect })

      this.convertNode(tree, ast, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`SQL parse error: ${error}`, 'PARSE_ERROR')
    }

    // Apply plugins
    const allPlugins = [...this.plugins, ...(options.plugins || [])]
    let result = tree

    for (const plugin of allPlugins) {
      if ('transform' in plugin) {
        result = await plugin.transform(result)
      }
    }

    this.tree = result
    return result
  }

  /**
   * Get the last parsed tree
   */
  getTree(): Tree | null {
    return this.tree
  }

  private convertNode(
    tree: Tree,
    sqlNode: any,
    parentId: NodeId,
    source: string
  ): NodeId {
    // Handle array of nodes (multiple statements)
    if (Array.isArray(sqlNode)) {
      let lastId = parentId
      for (const node of sqlNode) {
        lastId = this.convertNode(tree, node, parentId, source)
      }
      return lastId
    }

    // Handle null/undefined nodes
    if (sqlNode === null || sqlNode === undefined) {
      return parentId
    }

    // Determine node type
    const nodeType = this.getNodeType(sqlNode)

    // Create Synth node
    const nodeId = addNode(tree, {
      type: nodeType,
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        sqlNode: sqlNode,
        text: this.getNodeText(sqlNode),
      },
    })

    // Add to parent's children
    tree.nodes[parentId]!.children.push(nodeId)

    // Recursively convert children
    if (typeof sqlNode === 'object' && sqlNode !== null) {
      for (const key of Object.keys(sqlNode)) {
        const value = sqlNode[key]

        // Skip metadata fields
        if (key === '_next') continue

        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object' && item !== null) {
              this.convertNode(tree, item, nodeId, source)
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          this.convertNode(tree, value, nodeId, source)
        }
      }
    }

    return nodeId
  }

  private getNodeType(node: any): string {
    if (!node || typeof node !== 'object') {
      return 'Unknown'
    }

    // node-sql-parser uses 'type' field
    if (node.type) {
      return this.mapNodeType(node.type)
    }

    // For column references
    if (node.column) {
      return 'ColumnRef'
    }

    // For table references
    if (node.table) {
      return 'TableRef'
    }

    // For expressions
    if (node.expr) {
      return 'Expression'
    }

    return 'Unknown'
  }

  private mapNodeType(type: string): string {
    // Map node-sql-parser types to PascalCase
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }

  private getNodeText(node: any): string {
    if (typeof node === 'string') {
      return node
    }

    if (typeof node === 'number') {
      return String(node)
    }

    if (node && typeof node === 'object') {
      // Try to extract meaningful text
      if (node.column) return node.column
      if (node.table) return node.table
      if (node.name) return node.name
      if (node.value !== undefined) return String(node.value)
    }

    return ''
  }
}

// Factory and standalone functions
export function createParser(): SQLParser {
  return new SQLParser()
}

export function parse(source: string, options?: SQLParseOptions): Tree {
  const parser = new SQLParser()
  return parser.parse(source, options)
}

export async function parseAsync(
  source: string,
  options?: SQLParseOptions
): Promise<Tree> {
  const parser = new SQLParser()
  return parser.parseAsync(source, options)
}
