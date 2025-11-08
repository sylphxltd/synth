/**
 * Core AST Node types
 *
 * Design principles:
 * - Minimal memory footprint
 * - WASM-compatible data structures
 * - Type-safe and composable
 */

/**
 * Source position in the original text
 * Using numbers for WASM compatibility
 */
export interface Position {
  line: number
  column: number
  offset: number
}

/**
 * Source range (span)
 */
export interface Span {
  start: Position
  end: Position
}

/**
 * Node ID for efficient referencing
 * Using number instead of object references for performance
 */
export type NodeId = number

/**
 * Base node interface
 * All AST nodes extend this
 */
export interface BaseNode {
  /** Unique node ID within the tree */
  id: NodeId

  /** Node type discriminator */
  type: string

  /** Source location */
  span?: Span

  /** Parent node ID (null for root) */
  parent: NodeId | null

  /** Child node IDs */
  children: NodeId[]

  /** Arbitrary metadata */
  data?: Record<string, unknown>
}

/**
 * Generic node type with custom properties
 */
export interface Node<T extends string = string, P = unknown> extends BaseNode {
  type: T
  props: P
}

/**
 * Text node (leaf node)
 */
export interface TextNode extends BaseNode {
  type: 'text'
  value: string
}

/**
 * Generic parent node
 */
export interface ParentNode extends BaseNode {
  children: NodeId[]
}

/**
 * Root node
 */
export interface RootNode extends ParentNode {
  type: 'root'
}

/**
 * Type guard for text nodes
 */
export function isTextNode(node: BaseNode): node is TextNode {
  return node.type === 'text'
}

/**
 * Type guard for parent nodes
 */
export function isParentNode(node: BaseNode): node is ParentNode {
  return Array.isArray(node.children) && node.children.length > 0
}
