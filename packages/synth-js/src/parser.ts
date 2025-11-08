/**
 * JavaScript/TypeScript Parser
 *
 * Converts JavaScript/TypeScript into Synth AST using language-agnostic BaseNode
 * Uses Acorn for parsing and converts ESTree to our universal format
 */

import type { Tree, NodeId, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import * as acorn from 'acorn'
import tsPlugin from 'acorn-typescript'

// @ts-expect-error - acorn.Parser.extend type definition issue
const acornTS = acorn.Parser.extend(tsPlugin())

export interface JSParseOptions {
  /** ECMAScript version to parse (default: 'latest') */
  ecmaVersion?: acorn.ecmaVersion

  /** Source type ('script' or 'module', default: 'module') */
  sourceType?: 'script' | 'module'

  /** Enable TypeScript parsing (default: false) */
  typescript?: boolean

  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]

  /** Allow return outside functions */
  allowReturnOutsideFunction?: boolean

  /** Allow await at top level (implies module) */
  allowAwaitOutsideFunction?: boolean

  /** Allow hash bang (#!) at start */
  allowHashBang?: boolean
}

export class JSParser {
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
   * Parse JavaScript/TypeScript synchronously
   */
  parse(code: string, options: JSParseOptions = {}): Tree {
    const {
      ecmaVersion = 'latest',
      sourceType = 'module',
      typescript = false,
      allowReturnOutsideFunction = false,
      allowAwaitOutsideFunction = false,
      allowHashBang = true,
    } = options

    let ast: acorn.Node

    try {
      const parseOptions: acorn.Options = {
        ecmaVersion,
        sourceType,
        allowReturnOutsideFunction,
        allowAwaitOutsideFunction,
        allowHashBang,
        locations: true,
        ranges: true,
      }

      if (typescript) {
        ast = acornTS.parse(code, parseOptions)
      } else {
        ast = acorn.parse(code, parseOptions)
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SynthError(`JavaScript parse error: ${error.message}`, 'PARSE_ERROR')
      }
      throw error
    }

    const tree = this.buildTree(ast, code)

    // Apply plugins
    const allPlugins = [...this.plugins, ...(options.plugins || [])]

    // Check for async plugins
    const hasAsyncPlugin = allPlugins.some(p =>
      'transform' in p && p.transform.constructor.name === 'AsyncFunction'
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
   * Parse JavaScript/TypeScript asynchronously
   */
  async parseAsync(code: string, options: JSParseOptions = {}): Promise<Tree> {
    const {
      ecmaVersion = 'latest',
      sourceType = 'module',
      typescript = false,
      allowReturnOutsideFunction = false,
      allowAwaitOutsideFunction = false,
      allowHashBang = true,
    } = options

    let ast: acorn.Node

    try {
      const parseOptions: acorn.Options = {
        ecmaVersion,
        sourceType,
        allowReturnOutsideFunction,
        allowAwaitOutsideFunction,
        allowHashBang,
        locations: true,
        ranges: true,
      }

      if (typescript) {
        ast = acornTS.parse(code, parseOptions)
      } else {
        ast = acorn.parse(code, parseOptions)
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SynthError(`JavaScript parse error: ${error.message}`, 'PARSE_ERROR')
      }
      throw error
    }

    const tree = this.buildTree(ast, code)

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

  private buildTree(ast: acorn.Node, source: string): Tree {
    const tree = createTree('javascript', source)

    // Convert Acorn AST to our format
    this.convertNode(tree, ast, tree.root)

    return tree
  }

  private convertNode(tree: Tree, node: any, parentId: NodeId): NodeId {
    // Extract common properties
    const { type, loc, range, start, end, ...data } = node

    // Create node with our format
    const id = addNode(tree, {
      type,
      parent: parentId,
      children: [],
      span: range ? {
        start: { offset: range[0], line: loc?.start.line || 0, column: loc?.start.column || 0 },
        end: { offset: range[1], line: loc?.end.line || 0, column: loc?.end.column || 0 },
      } : undefined,
      data: this.cleanData(data),
    })

    // Add to parent's children
    tree.nodes[parentId]!.children.push(id)

    // Recursively convert child nodes
    this.processChildren(tree, node, id)

    return id
  }

  private processChildren(tree: Tree, node: any, nodeId: NodeId): void {
    // Handle different node structures
    for (const [key, value] of Object.entries(node)) {
      if (key === 'type' || key === 'loc' || key === 'range' || key === 'start' || key === 'end') {
        continue
      }

      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Array of nodes
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item && item.type) {
              this.convertNode(tree, item, nodeId)
            }
          }
        } else if ('type' in value && value.type) {
          // Single node
          this.convertNode(tree, value, nodeId)
        }
      }
    }
  }

  private cleanData(data: any): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      // Skip node references (they're in children)
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Keep primitive arrays, skip node arrays
          const firstItem = value[0]
          if (!firstItem || typeof firstItem !== 'object' || !('type' in firstItem) || !firstItem.type) {
            cleaned[key] = value
          }
        } else if ('type' in value && value.type === 'Identifier' && 'name' in value) {
          // Special case: Identifier nodes with names (like function id)
          // Extract just the name instead of creating a separate node
          cleaned[key] = value.name
        } else if (!('type' in value) || !value.type) {
          // Keep non-node objects
          cleaned[key] = value
        }
      } else {
        // Keep primitive values
        cleaned[key] = value
      }
    }

    return cleaned
  }
}

// Factory and standalone functions
export function createParser(): JSParser {
  return new JSParser()
}

export function parse(code: string, options?: JSParseOptions): Tree {
  const parser = new JSParser()
  return parser.parse(code, options)
}

export async function parseAsync(code: string, options?: JSParseOptions): Promise<Tree> {
  const parser = new JSParser()
  return parser.parseAsync(code, options)
}
