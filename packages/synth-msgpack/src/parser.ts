/**
 * MessagePack Parser
 *
 * Converts MessagePack binary data to Synth's universal AST
 * Uses @msgpack/msgpack for decoding
 */

import type { Tree, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import { decode } from '@msgpack/msgpack'
import type { NodeId } from '@sylphx/synth'

export interface MsgPackParseOptions {
  /** Plugins to apply during parsing */
  plugins?: Plugin[]
}

export class MsgPackParser {
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
   * Parse MessagePack synchronously
   */
  parse(data: Uint8Array | ArrayBuffer, options: MsgPackParseOptions = {}): Tree {
    const buffer = data instanceof ArrayBuffer ? new Uint8Array(data) : data
    const tree = createTree('msgpack', '')
    this.tree = tree

    try {
      // Decode MessagePack
      const decoded = decode(buffer)

      // Convert to Synth AST
      this.convertValue(tree, decoded, tree.root, 'root')
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`MessagePack parse error: ${error}`, 'PARSE_ERROR')
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
   * Parse MessagePack asynchronously
   */
  async parseAsync(
    data: Uint8Array | ArrayBuffer,
    options: MsgPackParseOptions = {}
  ): Promise<Tree> {
    const buffer = data instanceof ArrayBuffer ? new Uint8Array(data) : data
    const tree = createTree('msgpack', '')
    this.tree = tree

    try {
      const decoded = decode(buffer)
      this.convertValue(tree, decoded, tree.root, 'root')
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`MessagePack parse error: ${error}`, 'PARSE_ERROR')
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

  private convertValue(tree: Tree, value: unknown, parentId: NodeId, key?: string): NodeId {
    // Null
    if (value === null) {
      return this.createNode(tree, 'MsgPackNull', parentId, { key, value: null })
    }

    // Boolean
    if (typeof value === 'boolean') {
      return this.createNode(tree, 'MsgPackBoolean', parentId, { key, value })
    }

    // Number
    if (typeof value === 'number') {
      return this.createNode(tree, 'MsgPackNumber', parentId, { key, value })
    }

    // String
    if (typeof value === 'string') {
      return this.createNode(tree, 'MsgPackString', parentId, { key, value })
    }

    // Binary (Uint8Array)
    if (value instanceof Uint8Array) {
      return this.createNode(tree, 'MsgPackBinary', parentId, {
        key,
        length: value.length,
        // Store as hex string for readability
        value: Array.from(value)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      })
    }

    // Array
    if (Array.isArray(value)) {
      return this.convertArray(tree, value, parentId, key)
    }

    // Map/Object
    if (typeof value === 'object' && value !== null) {
      if (value instanceof Map) {
        return this.convertMap(tree, value, parentId, key)
      }
      return this.convertObject(tree, value as Record<string, unknown>, parentId, key)
    }

    // Extension types
    if (value && typeof value === 'object' && 'type' in value && 'data' in value) {
      return this.createNode(tree, 'MsgPackExtension', parentId, {
        key,
        extType: (value as any).type,
        data: (value as any).data,
      })
    }

    // Fallback
    return this.createNode(tree, 'MsgPackUnknown', parentId, { key, value })
  }

  private createNode(
    tree: Tree,
    type: string,
    parentId: NodeId,
    data: Record<string, unknown>
  ): NodeId {
    const nodeId = addNode(tree, {
      type,
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: 0, line: 1, column: 0 },
      },
      data,
    })

    tree.nodes[parentId]!.children.push(nodeId)
    return nodeId
  }

  private convertArray(
    tree: Tree,
    array: unknown[],
    parentId: NodeId,
    key?: string
  ): NodeId {
    const arrayId = this.createNode(tree, 'MsgPackArray', parentId, {
      key,
      length: array.length,
    })

    for (let i = 0; i < array.length; i++) {
      this.convertValue(tree, array[i], arrayId, String(i))
    }

    return arrayId
  }

  private convertObject(
    tree: Tree,
    obj: Record<string, unknown>,
    parentId: NodeId,
    key?: string
  ): NodeId {
    const objId = this.createNode(tree, 'MsgPackMap', parentId, {
      key,
      size: Object.keys(obj).length,
    })

    for (const [k, v] of Object.entries(obj)) {
      this.convertValue(tree, v, objId, k)
    }

    return objId
  }

  private convertMap(tree: Tree, map: Map<unknown, unknown>, parentId: NodeId, key?: string): NodeId {
    const mapId = this.createNode(tree, 'MsgPackMap', parentId, {
      key,
      size: map.size,
    })

    for (const [k, v] of map.entries()) {
      // Convert key to string for AST representation
      const keyStr = typeof k === 'string' ? k : JSON.stringify(k)
      this.convertValue(tree, v, mapId, keyStr)
    }

    return mapId
  }
}

// Factory and standalone functions
export function createParser(): MsgPackParser {
  return new MsgPackParser()
}

export function parse(data: Uint8Array | ArrayBuffer, options?: MsgPackParseOptions): Tree {
  const parser = new MsgPackParser()
  return parser.parse(data, options)
}

export async function parseAsync(
  data: Uint8Array | ArrayBuffer,
  options?: MsgPackParseOptions
): Promise<Tree> {
  const parser = new MsgPackParser()
  return parser.parseAsync(data, options)
}
