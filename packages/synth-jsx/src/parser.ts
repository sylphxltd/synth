/**
 * JSX/TSX Parser
 *
 * Converts JSX/TSX source to Synth's universal AST
 * Uses Acorn with acorn-jsx plugin for parsing, then converts to Synth format
 */

import type { Tree, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import * as acorn from 'acorn'
import jsx from 'acorn-jsx'
import type { NodeId } from '@sylphx/synth'

const AcornJSXParser = acorn.Parser.extend(jsx())

export interface JSXParseOptions {
  /** ECMAScript version (default: 'latest') */
  ecmaVersion?: 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 'latest'

  /** Source type (default: 'module') */
  sourceType?: 'script' | 'module'

  /** Allow return outside function */
  allowReturnOutsideFunction?: boolean

  /** Allow import/export outside module */
  allowImportExportEverywhere?: boolean

  /** Allow hash bang at start of file */
  allowHashBang?: boolean

  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]
}

export class JSXParser {
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
   * Parse JSX/TSX synchronously
   */
  parse(source: string, options: JSXParseOptions = {}): Tree {
    const tree = createTree('jsx', source)
    this.tree = tree

    try {
      // Parse with Acorn + JSX
      const ast = AcornJSXParser.parse(source, {
        ecmaVersion: options.ecmaVersion || 'latest',
        sourceType: options.sourceType || 'module',
        allowReturnOutsideFunction: options.allowReturnOutsideFunction,
        allowImportExportEverywhere: options.allowImportExportEverywhere,
        allowHashBang: options.allowHashBang,
        locations: true,
      })

      // Convert Acorn AST to Synth AST
      this.convertNode(tree, ast, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`JSX parse error: ${error}`, 'PARSE_ERROR')
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
   * Parse JSX/TSX asynchronously
   */
  async parseAsync(source: string, options: JSXParseOptions = {}): Promise<Tree> {
    const tree = createTree('jsx', source)
    this.tree = tree

    try {
      const ast = AcornJSXParser.parse(source, {
        ecmaVersion: options.ecmaVersion || 'latest',
        sourceType: options.sourceType || 'module',
        allowReturnOutsideFunction: options.allowReturnOutsideFunction,
        allowImportExportEverywhere: options.allowImportExportEverywhere,
        allowHashBang: options.allowHashBang,
        locations: true,
      })

      this.convertNode(tree, ast, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`JSX parse error: ${error}`, 'PARSE_ERROR')
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

  private convertNode(tree: Tree, acornNode: any, parentId: NodeId, source: string): NodeId {
    // Handle null/undefined
    if (acornNode === null || acornNode === undefined) {
      return parentId
    }

    // Handle arrays
    if (Array.isArray(acornNode)) {
      let lastId = parentId
      for (const node of acornNode) {
        lastId = this.convertNode(tree, node, parentId, source)
      }
      return lastId
    }

    // Skip non-object values
    if (typeof acornNode !== 'object') {
      return parentId
    }

    // Get node type
    const nodeType = acornNode.type || 'Unknown'

    // Extract location
    const loc = acornNode.loc
    const span = loc
      ? {
          start: {
            offset: acornNode.start || 0,
            line: loc.start.line,
            column: loc.start.column,
          },
          end: {
            offset: acornNode.end || source.length,
            line: loc.end.line,
            column: loc.end.column,
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
        acornNode: acornNode,
        text: this.getNodeText(acornNode, source),
      },
    })

    // Add to parent's children
    tree.nodes[parentId]!.children.push(nodeId)

    // Recursively convert children
    for (const key of Object.keys(acornNode)) {
      // Skip metadata fields
      if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue

      const value = acornNode[key]

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && item.type) {
            this.convertNode(tree, item, nodeId, source)
          }
        }
      } else if (value && typeof value === 'object' && value.type) {
        this.convertNode(tree, value, nodeId, source)
      }
    }

    return nodeId
  }

  private getNodeText(node: any, source: string): string {
    // Try to extract text from source positions
    if (node.start !== undefined && node.end !== undefined) {
      return source.slice(node.start, node.end)
    }

    // Try to extract from specific fields
    if (node.name) {
      return node.name
    }

    if (node.value !== undefined) {
      return String(node.value)
    }

    if (node.raw) {
      return node.raw
    }

    return ''
  }
}

// Factory and standalone functions
export function createParser(): JSXParser {
  return new JSXParser()
}

export function parse(source: string, options?: JSXParseOptions): Tree {
  const parser = new JSXParser()
  return parser.parse(source, options)
}

export async function parseAsync(
  source: string,
  options?: JSXParseOptions
): Promise<Tree> {
  const parser = new JSXParser()
  return parser.parseAsync(source, options)
}
