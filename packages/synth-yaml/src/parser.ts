/**
 * YAML Parser
 *
 * Converts YAML into Synth AST using language-agnostic BaseNode
 * Uses the 'yaml' library for parsing and converts to universal format
 */

import type { Tree, NodeId, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import * as YAML from 'yaml'

export interface YAMLParseOptions {
  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]

  /** Merge keys (default: false) */
  merge?: boolean

  /** Schema to use (default: 'core') */
  schema?: 'core' | 'failsafe' | 'json' | 'yaml-1.1'
}

export class YAMLParser {
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
   * Parse YAML synchronously
   */
  parse(source: string, options: YAMLParseOptions = {}): Tree {
    const tree = createTree('yaml', source)
    this.tree = tree

    try {
      // Parse YAML to JS value
      const doc = YAML.parseDocument(source, {
        merge: options.merge,
        schema: options.schema,
      })

      if (doc.errors.length > 0) {
        const error = doc.errors[0]!
        throw new SynthError(
          `YAML parse error: ${error.message}`,
          'PARSE_ERROR'
        )
      }

      // Convert to Synth AST
      if (doc.contents !== null) {
        const valueId = this.convertNode(tree, doc.contents, tree.root)
        tree.nodes[tree.root]!.children.push(valueId)
      }
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`YAML parse error: ${error}`, 'PARSE_ERROR')
    }

    // Apply plugins
    const allPlugins = [...this.plugins, ...(options.plugins || [])]

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
   * Parse YAML asynchronously
   */
  async parseAsync(source: string, options: YAMLParseOptions = {}): Promise<Tree> {
    const tree = createTree('yaml', source)
    this.tree = tree

    try {
      const doc = YAML.parseDocument(source, {
        merge: options.merge,
        schema: options.schema,
      })

      if (doc.errors.length > 0) {
        const error = doc.errors[0]!
        throw new SynthError(
          `YAML parse error: ${error.message}`,
          'PARSE_ERROR'
        )
      }

      if (doc.contents !== null) {
        const valueId = this.convertNode(tree, doc.contents, tree.root)
        tree.nodes[tree.root]!.children.push(valueId)
      }
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`YAML parse error: ${error}`, 'PARSE_ERROR')
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

  private convertNode(tree: Tree, node: any, parentId: NodeId): NodeId {
    // Handle different YAML node types
    if (YAML.isScalar(node)) {
      return this.convertScalar(tree, node, parentId)
    }

    if (YAML.isMap(node)) {
      return this.convertMap(tree, node, parentId)
    }

    if (YAML.isSeq(node)) {
      return this.convertSeq(tree, node, parentId)
    }

    // Fallback for unknown types
    return addNode(tree, {
      type: 'Unknown',
      parent: parentId,
      children: [],
      data: { value: node },
    })
  }

  private convertScalar(tree: Tree, node: YAML.Scalar, parentId: NodeId): NodeId {
    const value = node.value
    let type: string
    let data: Record<string, unknown>

    if (typeof value === 'string') {
      type = 'String'
      data = { value }
    } else if (typeof value === 'number') {
      type = 'Number'
      data = { value }
    } else if (typeof value === 'boolean') {
      type = 'Boolean'
      data = { value }
    } else if (value === null) {
      type = 'Null'
      data = { value: null }
    } else {
      type = 'Scalar'
      data = { value }
    }

    return addNode(tree, {
      type,
      parent: parentId,
      children: [],
      span: this.getSpan(node),
      data,
    })
  }

  private convertMap(tree: Tree, node: YAML.YAMLMap, parentId: NodeId): NodeId {
    const mapId = addNode(tree, {
      type: 'Map',
      parent: parentId,
      children: [],
      span: this.getSpan(node),
      data: {},
    })

    // Convert each key-value pair
    for (const pair of node.items) {
      const pairId = this.convertPair(tree, pair, mapId)
      tree.nodes[mapId]!.children.push(pairId)
    }

    return mapId
  }

  private convertPair(tree: Tree, pair: YAML.Pair, parentId: NodeId): NodeId {
    // Extract key as string
    let key: string
    if (YAML.isScalar(pair.key)) {
      key = String(pair.key.value)
    } else {
      key = String(pair.key)
    }

    const pairId = addNode(tree, {
      type: 'Pair',
      parent: parentId,
      children: [],
      data: { key },
    })

    // Convert value
    if (pair.value !== null && pair.value !== undefined) {
      const valueId = this.convertNode(tree, pair.value, pairId)
      tree.nodes[pairId]!.children.push(valueId)
    } else {
      // Null value
      const nullId = addNode(tree, {
        type: 'Null',
        parent: pairId,
        children: [],
        data: { value: null },
      })
      tree.nodes[pairId]!.children.push(nullId)
    }

    return pairId
  }

  private convertSeq(tree: Tree, node: YAML.YAMLSeq, parentId: NodeId): NodeId {
    const seqId = addNode(tree, {
      type: 'Sequence',
      parent: parentId,
      children: [],
      span: this.getSpan(node),
      data: {},
    })

    // Convert each item
    for (const item of node.items) {
      if (item !== null && item !== undefined) {
        const itemId = this.convertNode(tree, item, seqId)
        tree.nodes[seqId]!.children.push(itemId)
      }
    }

    return seqId
  }

  private getSpan(node: any): { start: { offset: number; line: number; column: number }; end: { offset: number; line: number; column: number } } | undefined {
    if (node.range) {
      const [start, , end] = node.range
      return {
        start: { offset: start, line: 0, column: 0 },
        end: { offset: end, line: 0, column: 0 },
      }
    }
    return undefined
  }
}

// Factory and standalone functions
export function createParser(): YAMLParser {
  return new YAMLParser()
}

export function parse(source: string, options?: YAMLParseOptions): Tree {
  const parser = new YAMLParser()
  return parser.parse(source, options)
}

export async function parseAsync(source: string, options?: YAMLParseOptions): Promise<Tree> {
  const parser = new YAMLParser()
  return parser.parseAsync(source, options)
}
