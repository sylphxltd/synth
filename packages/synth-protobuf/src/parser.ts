/**
 * Protocol Buffers Parser
 *
 * Converts .proto files to Synth's universal AST
 * Uses protobufjs for parsing, then converts to Synth format
 */

import type { Tree, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import { parse as parseProto } from 'protobufjs'
import type { NodeId } from '@sylphx/synth'

export interface ProtobufParseOptions {
  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]
}

export class ProtobufParser {
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
   * Parse Protocol Buffers synchronously
   */
  parse(source: string, options: ProtobufParseOptions = {}): Tree {
    const tree = createTree('protobuf', source)
    this.tree = tree

    try {
      // Parse with protobufjs
      const result = parseProto(source)

      // Convert protobuf AST to Synth AST
      this.convertRoot(tree, result.root, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`Protobuf parse error: ${error}`, 'PARSE_ERROR')
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
   * Parse Protocol Buffers asynchronously
   */
  async parseAsync(source: string, options: ProtobufParseOptions = {}): Promise<Tree> {
    const tree = createTree('protobuf', source)
    this.tree = tree

    try {
      const result = parseProto(source)

      this.convertRoot(tree, result.root, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`Protobuf parse error: ${error}`, 'PARSE_ERROR')
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

  private convertRoot(tree: Tree, root: any, parentId: NodeId, source: string): void {
    // Detect syntax from source (protobufjs doesn't expose it)
    const syntaxMatch = source.match(/syntax\s*=\s*"(proto[23])"/)
    const syntax = syntaxMatch ? syntaxMatch[1] : 'proto3'

    // Create proto root node
    const protoId = addNode(tree, {
      type: 'ProtoRoot',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: source.split('\n').length, column: 0 },
      },
      data: {
        syntax,
      },
    })

    tree.nodes[parentId]!.children.push(protoId)

    // Convert nested types
    if (root.nested) {
      this.convertNested(tree, root.nested, protoId, source)
    }
  }

  private convertNested(tree: Tree, nested: any, parentId: NodeId, source: string): void {
    for (const [name, value] of Object.entries(nested)) {
      if (!value || typeof value !== 'object') continue

      // Determine node type
      if ((value as any).fields) {
        // Message type
        this.convertMessage(tree, name, value, parentId, source)
      } else if ((value as any).values) {
        // Enum type
        this.convertEnum(tree, name, value, parentId, source)
      } else if ((value as any).methods) {
        // Service type
        this.convertService(tree, name, value, parentId, source)
      } else if ((value as any).nested) {
        // Namespace
        this.convertNamespace(tree, name, value, parentId, source)
      }
    }
  }

  private convertMessage(
    tree: Tree,
    name: string,
    message: any,
    parentId: NodeId,
    source: string
  ): void {
    const messageId = addNode(tree, {
      type: 'ProtoMessage',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
        options: message.options || {},
      },
    })

    tree.nodes[parentId]!.children.push(messageId)

    // Convert fields
    if (message.fields) {
      for (const [fieldName, field] of Object.entries(message.fields)) {
        this.convertField(tree, fieldName, field, messageId, source)
      }
    }

    // Convert nested messages/enums
    if (message.nested) {
      this.convertNested(tree, message.nested, messageId, source)
    }

    // Convert oneofs
    if (message.oneofs) {
      for (const [oneofName, oneof] of Object.entries(message.oneofs)) {
        this.convertOneof(tree, oneofName, oneof, messageId, source)
      }
    }
  }

  private convertField(
    tree: Tree,
    name: string,
    field: any,
    parentId: NodeId,
    source: string
  ): void {
    const fieldId = addNode(tree, {
      type: 'ProtoField',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
        type: field.type,
        id: field.id,
        rule: field.rule,
        repeated: field.repeated || false,
        optional: field.optional || false,
        required: field.required || false,
        options: field.options || {},
      },
    })

    tree.nodes[parentId]!.children.push(fieldId)
  }

  private convertEnum(
    tree: Tree,
    name: string,
    enumType: any,
    parentId: NodeId,
    source: string
  ): void {
    const enumId = addNode(tree, {
      type: 'ProtoEnum',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
        options: enumType.options || {},
      },
    })

    tree.nodes[parentId]!.children.push(enumId)

    // Convert enum values
    if (enumType.values) {
      for (const [valueName, valueId] of Object.entries(enumType.values)) {
        this.convertEnumValue(tree, valueName, valueId as number, enumId, source)
      }
    }
  }

  private convertEnumValue(
    tree: Tree,
    name: string,
    value: number,
    parentId: NodeId,
    source: string
  ): void {
    const valueId = addNode(tree, {
      type: 'ProtoEnumValue',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
        value,
      },
    })

    tree.nodes[parentId]!.children.push(valueId)
  }

  private convertService(
    tree: Tree,
    name: string,
    service: any,
    parentId: NodeId,
    source: string
  ): void {
    const serviceId = addNode(tree, {
      type: 'ProtoService',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
        options: service.options || {},
      },
    })

    tree.nodes[parentId]!.children.push(serviceId)

    // Convert methods
    if (service.methods) {
      for (const [methodName, method] of Object.entries(service.methods)) {
        this.convertMethod(tree, methodName, method, serviceId, source)
      }
    }
  }

  private convertMethod(
    tree: Tree,
    name: string,
    method: any,
    parentId: NodeId,
    source: string
  ): void {
    const methodId = addNode(tree, {
      type: 'ProtoMethod',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
        requestType: method.requestType,
        responseType: method.responseType,
        requestStream: method.requestStream || false,
        responseStream: method.responseStream || false,
        options: method.options || {},
      },
    })

    tree.nodes[parentId]!.children.push(methodId)
  }

  private convertOneof(
    tree: Tree,
    name: string,
    oneof: any,
    parentId: NodeId,
    source: string
  ): void {
    const oneofId = addNode(tree, {
      type: 'ProtoOneof',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
        oneof: oneof.oneof || [],
      },
    })

    tree.nodes[parentId]!.children.push(oneofId)
  }

  private convertNamespace(
    tree: Tree,
    name: string,
    namespace: any,
    parentId: NodeId,
    source: string
  ): void {
    const namespaceId = addNode(tree, {
      type: 'ProtoNamespace',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        name,
      },
    })

    tree.nodes[parentId]!.children.push(namespaceId)

    // Convert nested types
    if (namespace.nested) {
      this.convertNested(tree, namespace.nested, namespaceId, source)
    }
  }
}

// Factory and standalone functions
export function createParser(): ProtobufParser {
  return new ProtobufParser()
}

export function parse(source: string, options?: ProtobufParseOptions): Tree {
  const parser = new ProtobufParser()
  return parser.parse(source, options)
}

export async function parseAsync(
  source: string,
  options?: ProtobufParseOptions
): Promise<Tree> {
  const parser = new ProtobufParser()
  return parser.parseAsync(source, options)
}
