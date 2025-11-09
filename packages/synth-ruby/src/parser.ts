/**
 * Ruby Parser
 *
 * Converts Ruby source to Synth's universal AST
 * Uses tree-sitter-ruby for parsing, then converts to Synth format
 */

import type { Tree, NodeId, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import Parser from 'tree-sitter'
import Ruby from 'tree-sitter-ruby'
import type { RubyParseOptions } from './types.js'

export class RubyParser {
  private plugins: Plugin[] = []
  private tree: Tree | null = null
  private parser: Parser

  constructor() {
    this.parser = new Parser()
    this.parser.setLanguage(Ruby)
  }

  /**
   * Register a plugin
   */
  use(plugin: Plugin): this {
    this.plugins.push(plugin)
    return this
  }

  /**
   * Parse Ruby synchronously
   */
  parse(source: string, options: RubyParseOptions = {}): Tree {
    const tree = createTree('ruby', source)
    this.tree = tree

    try {
      // Parse with tree-sitter
      const tsTree = this.parser.parse(source)
      const rootNode = tsTree.rootNode

      // Convert tree-sitter AST to Synth AST
      this.convertNode(tree, rootNode, tree.root)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`Ruby parse error: ${error}`, 'PARSE_ERROR')
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
   * Parse Ruby asynchronously
   */
  async parseAsync(source: string, options: RubyParseOptions = {}): Promise<Tree> {
    const tree = createTree('ruby', source)
    this.tree = tree

    try {
      const tsTree = this.parser.parse(source)
      const rootNode = tsTree.rootNode

      this.convertNode(tree, rootNode, tree.root)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`Ruby parse error: ${error}`, 'PARSE_ERROR')
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

  private convertNode(tree: Tree, tsNode: Parser.SyntaxNode, parentId: NodeId): NodeId {
    // Create Synth node from tree-sitter node
    const nodeId = addNode(tree, {
      type: this.mapNodeType(tsNode.type),
      parent: parentId,
      children: [],
      span: {
        start: {
          offset: tsNode.startIndex,
          line: tsNode.startPosition.row + 1,
          column: tsNode.startPosition.column,
        },
        end: {
          offset: tsNode.endIndex,
          line: tsNode.endPosition.row + 1,
          column: tsNode.endPosition.column,
        },
      },
      data: {
        text: tsNode.text,
        isNamed: tsNode.isNamed,
        originalType: tsNode.type,
      },
    })

    // Add to parent's children
    tree.nodes[parentId]!.children.push(nodeId)

    // Recursively convert children
    for (let i = 0; i < tsNode.childCount; i++) {
      const child = tsNode.child(i)
      if (child) {
        this.convertNode(tree, child, nodeId)
      }
    }

    return nodeId
  }

  private mapNodeType(tsType: string): string {
    // Map tree-sitter node types to more readable names
    // Keep the tree-sitter types but make them PascalCase for consistency
    return tsType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }
}

// Factory and standalone functions
export function createParser(): RubyParser {
  return new RubyParser()
}

export function parse(source: string, options?: RubyParseOptions): Tree {
  const parser = new RubyParser()
  return parser.parse(source, options)
}

export async function parseAsync(
  source: string,
  options?: RubyParseOptions
): Promise<Tree> {
  const parser = new RubyParser()
  return parser.parseAsync(source, options)
}
