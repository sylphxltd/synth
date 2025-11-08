/**
 * GraphQL Parser
 *
 * Converts GraphQL source to Synth's universal AST
 * Uses graphql-js (reference implementation) for parsing, then converts to Synth format
 */

import type { Tree, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import { parse as gqlParse, type ASTNode } from 'graphql'
import type { NodeId } from '@sylphx/synth'

export interface GraphQLParseOptions {
  /** Allow legacy SDL syntax */
  allowLegacySDLImplementsInterfaces?: boolean

  /** Allow legacy SDL empty fields */
  allowLegacySDLEmptyFields?: boolean

  /** Experimental fragment variables */
  experimentalFragmentVariables?: boolean

  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]
}

export class GraphQLParser {
  private plugins: Plugin[] = []
  private tree: Tree | null = null

  /**
   * Register a plugin
   */
  use(plugin: Plugin): this {
    this.plugins.push(plugin)
    return this
  }

  /**
   * Parse GraphQL synchronously
   */
  parse(source: string, options: GraphQLParseOptions = {}): Tree {
    const tree = createTree('graphql', source)
    this.tree = tree

    try {
      // Parse with graphql-js
      const gqlAST = gqlParse(source, {
        allowLegacySDLImplementsInterfaces: options.allowLegacySDLImplementsInterfaces,
        allowLegacySDLEmptyFields: options.allowLegacySDLEmptyFields,
        experimentalFragmentVariables: options.experimentalFragmentVariables,
      })

      // Convert GraphQL AST to Synth AST
      this.convertNode(tree, gqlAST, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`GraphQL parse error: ${error}`, 'PARSE_ERROR')
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
   * Parse GraphQL asynchronously
   */
  async parseAsync(source: string, options: GraphQLParseOptions = {}): Promise<Tree> {
    const tree = createTree('graphql', source)
    this.tree = tree

    try {
      const gqlAST = gqlParse(source, {
        allowLegacySDLImplementsInterfaces: options.allowLegacySDLImplementsInterfaces,
        allowLegacySDLEmptyFields: options.allowLegacySDLEmptyFields,
        experimentalFragmentVariables: options.experimentalFragmentVariables,
      })

      this.convertNode(tree, gqlAST, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`GraphQL parse error: ${error}`, 'PARSE_ERROR')
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

  private convertNode(tree: Tree, gqlNode: any, parentId: NodeId, source: string): NodeId {
    // Handle null/undefined nodes
    if (gqlNode === null || gqlNode === undefined) {
      return parentId
    }

    // Handle arrays
    if (Array.isArray(gqlNode)) {
      let lastId = parentId
      for (const node of gqlNode) {
        lastId = this.convertNode(tree, node, parentId, source)
      }
      return lastId
    }

    // Skip non-object values
    if (typeof gqlNode !== 'object') {
      return parentId
    }

    // Get node type
    const nodeType = gqlNode.kind || 'Unknown'

    // Extract location info
    const loc = gqlNode.loc
    const span = loc
      ? {
          start: {
            offset: loc.start,
            line: source.slice(0, loc.start).split('\n').length,
            column: loc.start - source.lastIndexOf('\n', loc.start - 1) - 1,
          },
          end: {
            offset: loc.end,
            line: source.slice(0, loc.end).split('\n').length,
            column: loc.end - source.lastIndexOf('\n', loc.end - 1) - 1,
          },
        }
      : {
          start: { offset: 0, line: 1, column: 0 },
          end: { offset: source.length, line: 1, column: source.length },
        }

    // Create Synth node
    const nodeId = addNode(tree, {
      type: nodeType,
      parent: parentId,
      children: [],
      span,
      data: {
        gqlNode: gqlNode,
        text: this.getNodeText(gqlNode, source),
      },
    })

    // Add to parent's children
    tree.nodes[parentId]!.children.push(nodeId)

    // Recursively convert children
    for (const key of Object.keys(gqlNode)) {
      // Skip metadata fields
      if (key === 'kind' || key === 'loc') continue

      const value = gqlNode[key]

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object') {
            this.convertNode(tree, item, nodeId, source)
          }
        }
      } else if (value && typeof value === 'object') {
        this.convertNode(tree, value, nodeId, source)
      }
    }

    return nodeId
  }

  private getNodeText(node: any, source: string): string {
    // Try to extract text from location
    if (node.loc) {
      return source.slice(node.loc.start, node.loc.end)
    }

    // Try to extract from specific fields
    if (node.name && typeof node.name === 'object' && node.name.value) {
      return node.name.value
    }

    if (node.value !== undefined) {
      return String(node.value)
    }

    return ''
  }
}

// Factory and standalone functions
export function createParser(): GraphQLParser {
  return new GraphQLParser()
}

export function parse(source: string, options?: GraphQLParseOptions): Tree {
  const parser = new GraphQLParser()
  return parser.parse(source, options)
}

export async function parseAsync(
  source: string,
  options?: GraphQLParseOptions
): Promise<Tree> {
  const parser = new GraphQLParser()
  return parser.parseAsync(source, options)
}
