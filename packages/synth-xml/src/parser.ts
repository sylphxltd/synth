/**
 * XML Parser
 *
 * Converts XML source to Synth's universal AST
 * Uses fast-xml-parser for parsing, then converts to Synth format
 */

import type { Tree, Plugin } from '@sylphx/synth'
import { createTree, addNode } from '@sylphx/synth'
import { SynthError } from '@sylphx/synth'
import { XMLParser as FastXMLParser, XMLBuilder } from 'fast-xml-parser'
import type { NodeId } from '@sylphx/synth'

export interface XMLParseOptions {
  /** Ignore attributes */
  ignoreAttributes?: boolean

  /** Remove namespace from tag and attribute names */
  removeNSPrefix?: boolean

  /** Parse attribute value */
  parseAttributeValue?: boolean

  /** Parse tag value */
  parseTagValue?: boolean

  /** Trim tag values */
  trimValues?: boolean

  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]
}

export class XMLParser {
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
   * Parse XML synchronously
   */
  parse(source: string, options: XMLParseOptions = {}): Tree {
    const tree = createTree('xml', source)
    this.tree = tree

    try {
      // Parse with fast-xml-parser
      const parser = new FastXMLParser({
        ignoreAttributes: options.ignoreAttributes ?? false,
        removeNSPrefix: options.removeNSPrefix ?? false,
        parseAttributeValue: options.parseAttributeValue ?? false,
        parseTagValue: options.parseTagValue ?? true,
        trimValues: options.trimValues ?? true,
        preserveOrder: true,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        commentPropName: '#comment',
        cdataPropName: '#cdata',
      })

      const xmlAST = parser.parse(source)

      // Convert fast-xml-parser AST to Synth AST
      this.convertNode(tree, xmlAST, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`XML parse error: ${error}`, 'PARSE_ERROR')
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
   * Parse XML asynchronously
   */
  async parseAsync(source: string, options: XMLParseOptions = {}): Promise<Tree> {
    const tree = createTree('xml', source)
    this.tree = tree

    try {
      const parser = new FastXMLParser({
        ignoreAttributes: options.ignoreAttributes ?? false,
        removeNSPrefix: options.removeNSPrefix ?? false,
        parseAttributeValue: options.parseAttributeValue ?? false,
        parseTagValue: options.parseTagValue ?? true,
        trimValues: options.trimValues ?? true,
        preserveOrder: true,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        commentPropName: '#comment',
        cdataPropName: '#cdata',
      })

      const xmlAST = parser.parse(source)

      this.convertNode(tree, xmlAST, tree.root, source)
    } catch (error) {
      if (error instanceof SynthError) {
        throw error
      }
      throw new SynthError(`XML parse error: ${error}`, 'PARSE_ERROR')
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

  private convertNode(tree: Tree, xmlNode: any, parentId: NodeId, source: string): NodeId {
    // Handle null/undefined
    if (xmlNode === null || xmlNode === undefined) {
      return parentId
    }

    // Handle arrays (preserveOrder returns array)
    if (Array.isArray(xmlNode)) {
      let lastId = parentId
      for (const node of xmlNode) {
        lastId = this.convertNode(tree, node, parentId, source)
      }
      return lastId
    }

    // Handle primitive values
    if (typeof xmlNode !== 'object') {
      // Create text node
      const nodeId = addNode(tree, {
        type: 'Text',
        parent: parentId,
        children: [],
        span: {
          start: { offset: 0, line: 1, column: 0 },
          end: { offset: source.length, line: 1, column: source.length },
        },
        data: {
          text: String(xmlNode),
        },
      })
      tree.nodes[parentId]!.children.push(nodeId)
      return nodeId
    }

    // Get element tag name (first key that's not an attribute or special field)
    let tagName = 'Element'
    let attributes: any = {}
    let children: any[] = []
    let textContent = ''

    for (const key of Object.keys(xmlNode)) {
      if (key.startsWith('@_')) {
        // Attribute
        attributes[key.slice(2)] = xmlNode[key]
      } else if (key === '#text') {
        textContent = xmlNode[key]
      } else if (key === '#comment') {
        // Comment node
        const commentId = addNode(tree, {
          type: 'Comment',
          parent: parentId,
          children: [],
          span: {
            start: { offset: 0, line: 1, column: 0 },
            end: { offset: source.length, line: 1, column: source.length },
          },
          data: {
            text: xmlNode[key],
          },
        })
        tree.nodes[parentId]!.children.push(commentId)
        return commentId
      } else if (key === '#cdata') {
        // CDATA node
        const cdataId = addNode(tree, {
          type: 'CDATA',
          parent: parentId,
          children: [],
          span: {
            start: { offset: 0, line: 1, column: 0 },
            end: { offset: source.length, line: 1, column: source.length },
          },
          data: {
            text: xmlNode[key],
          },
        })
        tree.nodes[parentId]!.children.push(cdataId)
        return cdataId
      } else {
        // Element tag name
        tagName = key
        children = Array.isArray(xmlNode[key]) ? xmlNode[key] : [xmlNode[key]]
      }
    }

    // Create element node
    const nodeId = addNode(tree, {
      type: 'Element',
      parent: parentId,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: source.length, line: 1, column: source.length },
      },
      data: {
        tagName,
        attributes,
        text: textContent,
      },
    })

    tree.nodes[parentId]!.children.push(nodeId)

    // Add text content if present
    if (textContent) {
      const textId = addNode(tree, {
        type: 'Text',
        parent: nodeId,
        children: [],
        span: {
          start: { offset: 0, line: 1, column: 0 },
          end: { offset: source.length, line: 1, column: source.length },
        },
        data: {
          text: textContent,
        },
      })
      tree.nodes[nodeId]!.children.push(textId)
    }

    // Recursively convert children
    for (const child of children) {
      this.convertNode(tree, child, nodeId, source)
    }

    return nodeId
  }
}

// Factory and standalone functions
export function createParser(): XMLParser {
  return new XMLParser()
}

export function parse(source: string, options?: XMLParseOptions): Tree {
  const parser = new XMLParser()
  return parser.parse(source, options)
}

export async function parseAsync(
  source: string,
  options?: XMLParseOptions
): Promise<Tree> {
  const parser = new XMLParser()
  return parser.parseAsync(source, options)
}
