/**
 * Enhanced TypeScript Type Definitions for Markdown AST
 *
 * Provides full type safety with discriminated unions and type narrowing.
 *
 * Features:
 * - Discriminated union types for all Markdown nodes
 * - Type guards for runtime type narrowing
 * - Helper types for common operations
 * - Full IntelliSense support
 */

import type { BaseNode, NodeId } from '@sylphx/ast-core'

// ============================================================================
// Markdown-specific Node Types
// ============================================================================

/**
 * Heading node (# Title)
 */
export interface HeadingNode extends BaseNode {
  type: 'heading'
  depth: 1 | 2 | 3 | 4 | 5 | 6
  text: string
}

/**
 * Paragraph node
 */
export interface ParagraphNode extends BaseNode {
  type: 'paragraph'
  text: string
}

/**
 * Code block node
 */
export interface CodeBlockNode extends BaseNode {
  type: 'codeBlock'
  lang?: string
  meta?: string
  code: string
}

/**
 * List node (container)
 */
export interface ListNode extends BaseNode {
  type: 'list'
  ordered: boolean
  start?: number
  loose: boolean
}

/**
 * List item node
 */
export interface ListItemNode extends BaseNode {
  type: 'listItem'
  checked?: boolean
  indent: number
  text: string
}

/**
 * Blockquote node
 */
export interface BlockquoteNode extends BaseNode {
  type: 'blockquote'
  text: string
}

/**
 * Horizontal rule node
 */
export interface HorizontalRuleNode extends BaseNode {
  type: 'horizontalRule'
}

/**
 * Blank line node
 */
export interface BlankLineNode extends BaseNode {
  type: 'blankLine'
}

/**
 * Table node (GFM)
 */
export interface TableNode extends BaseNode {
  type: 'table'
  header: string[]
  align: Array<'left' | 'right' | 'center' | null>
  rows: string[][]
}

/**
 * HTML block node
 */
export interface HTMLBlockNode extends BaseNode {
  type: 'htmlBlock'
  content: string
}

/**
 * Link reference definition node
 */
export interface LinkReferenceNode extends BaseNode {
  type: 'linkReference'
  label: string
  url: string
  title?: string
}

/**
 * Text node (inline)
 */
export interface TextNode extends BaseNode {
  type: 'text'
  value: string
}

/**
 * Emphasis node (inline)
 */
export interface EmphasisNode extends BaseNode {
  type: 'emphasis'
  marker: '*' | '_'
  text: string
}

/**
 * Strong node (inline)
 */
export interface StrongNode extends BaseNode {
  type: 'strong'
  marker: '**' | '__'
  text: string
}

/**
 * Inline code node
 */
export interface InlineCodeNode extends BaseNode {
  type: 'inlineCode'
  value: string
}

/**
 * Link node (inline)
 */
export interface LinkNode extends BaseNode {
  type: 'link'
  text: string
  url: string
  title?: string
}

/**
 * Image node (inline)
 */
export interface ImageNode extends BaseNode {
  type: 'image'
  alt: string
  url: string
  title?: string
}

/**
 * Line break node (inline)
 */
export interface LineBreakNode extends BaseNode {
  type: 'lineBreak'
  hard: boolean
}

/**
 * Strikethrough node (GFM inline)
 */
export interface StrikethroughNode extends BaseNode {
  type: 'strikethrough'
  text: string
}

/**
 * Autolink node (GFM inline)
 */
export interface AutolinkNode extends BaseNode {
  type: 'autolink'
  url: string
}

// ============================================================================
// Discriminated Union Types
// ============================================================================

/**
 * All possible Markdown node types (discriminated union)
 */
export type MarkdownNode =
  // Block nodes
  | HeadingNode
  | ParagraphNode
  | CodeBlockNode
  | ListNode
  | ListItemNode
  | BlockquoteNode
  | HorizontalRuleNode
  | BlankLineNode
  | TableNode
  | HTMLBlockNode
  | LinkReferenceNode
  // Inline nodes
  | TextNode
  | EmphasisNode
  | StrongNode
  | InlineCodeNode
  | LinkNode
  | ImageNode
  | LineBreakNode
  | StrikethroughNode
  | AutolinkNode

/**
 * Block-level nodes only
 */
export type MarkdownBlockNode =
  | HeadingNode
  | ParagraphNode
  | CodeBlockNode
  | ListNode
  | ListItemNode
  | BlockquoteNode
  | HorizontalRuleNode
  | BlankLineNode
  | TableNode
  | HTMLBlockNode
  | LinkReferenceNode

/**
 * Inline-level nodes only
 */
export type MarkdownInlineNode =
  | TextNode
  | EmphasisNode
  | StrongNode
  | InlineCodeNode
  | LinkNode
  | ImageNode
  | LineBreakNode
  | StrikethroughNode
  | AutolinkNode

/**
 * Extract node type from type string
 *
 * @example
 * ```typescript
 * type HeadingType = NodeByType<'heading'> // HeadingNode
 * ```
 */
export type NodeByType<T extends MarkdownNode['type']> = Extract<MarkdownNode, { type: T }>

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for heading nodes
 */
export function isHeadingNode(node: BaseNode): node is HeadingNode {
  return node.type === 'heading'
}

/**
 * Type guard for paragraph nodes
 */
export function isParagraphNode(node: BaseNode): node is ParagraphNode {
  return node.type === 'paragraph'
}

/**
 * Type guard for code block nodes
 */
export function isCodeBlockNode(node: BaseNode): node is CodeBlockNode {
  return node.type === 'codeBlock'
}

/**
 * Type guard for list nodes
 */
export function isListNode(node: BaseNode): node is ListNode {
  return node.type === 'list'
}

/**
 * Type guard for list item nodes
 */
export function isListItemNode(node: BaseNode): node is ListItemNode {
  return node.type === 'listItem'
}

/**
 * Type guard for blockquote nodes
 */
export function isBlockquoteNode(node: BaseNode): node is BlockquoteNode {
  return node.type === 'blockquote'
}

/**
 * Type guard for table nodes
 */
export function isTableNode(node: BaseNode): node is TableNode {
  return node.type === 'table'
}

/**
 * Type guard for link nodes
 */
export function isLinkNode(node: BaseNode): node is LinkNode {
  return node.type === 'link'
}

/**
 * Type guard for image nodes
 */
export function isImageNode(node: BaseNode): node is ImageNode {
  return node.type === 'image'
}

/**
 * Type guard for emphasis nodes
 */
export function isEmphasisNode(node: BaseNode): node is EmphasisNode {
  return node.type === 'emphasis'
}

/**
 * Type guard for strong nodes
 */
export function isStrongNode(node: BaseNode): node is StrongNode {
  return node.type === 'strong'
}

/**
 * Type guard for inline code nodes
 */
export function isInlineCodeNode(node: BaseNode): node is InlineCodeNode {
  return node.type === 'inlineCode'
}

/**
 * Type guard for block-level nodes
 */
export function isBlockNode(node: BaseNode): node is MarkdownBlockNode {
  return [
    'heading',
    'paragraph',
    'codeBlock',
    'list',
    'listItem',
    'blockquote',
    'horizontalRule',
    'blankLine',
    'table',
    'htmlBlock',
    'linkReference',
  ].includes(node.type)
}

/**
 * Type guard for inline-level nodes
 */
export function isInlineNode(node: BaseNode): node is MarkdownInlineNode {
  return [
    'text',
    'emphasis',
    'strong',
    'inlineCode',
    'link',
    'image',
    'lineBreak',
    'strikethrough',
    'autolink',
  ].includes(node.type)
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract props from a Markdown node type
 *
 * @example
 * ```typescript
 * type HeadingProps = NodeProps<HeadingNode>
 * // { depth: 1 | 2 | 3 | 4 | 5 | 6, text: string }
 * ```
 */
export type NodeProps<T extends MarkdownNode> = Omit<T, keyof BaseNode>

/**
 * Visitor function type for Markdown nodes
 */
export type MarkdownVisitor<T extends MarkdownNode = MarkdownNode> = (node: T) => T | void

/**
 * Visitor map for specific node types
 *
 * @example
 * ```typescript
 * const visitors: MarkdownVisitorMap = {
 *   heading: (node) => {
 *     // node is typed as HeadingNode
 *     console.log(node.depth)
 *     return node
 *   },
 *   paragraph: (node) => {
 *     // node is typed as ParagraphNode
 *     console.log(node.text)
 *     return node
 *   }
 * }
 * ```
 */
export type MarkdownVisitorMap = {
  [K in MarkdownNode['type']]?: MarkdownVisitor<NodeByType<K>>
}

/**
 * Predicate function for filtering nodes
 */
export type MarkdownPredicate<T extends MarkdownNode = MarkdownNode> = (node: T) => boolean

/**
 * Transform function for mapping nodes
 */
export type MarkdownTransform<T extends MarkdownNode = MarkdownNode, R = T> = (node: T) => R

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Assert node type and narrow type
 *
 * @example
 * ```typescript
 * const node: BaseNode = getNode()
 * assertNodeType(node, 'heading')
 * // node is now typed as HeadingNode
 * console.log(node.depth)
 * ```
 */
export function assertNodeType<T extends MarkdownNode['type']>(
  node: BaseNode,
  type: T
): asserts node is NodeByType<T> {
  if (node.type !== type) {
    throw new Error(`Expected node type '${type}', got '${node.type}'`)
  }
}

/**
 * Check if node matches one of the given types
 *
 * @example
 * ```typescript
 * if (isNodeType(node, 'heading', 'paragraph')) {
 *   // node is HeadingNode | ParagraphNode
 * }
 * ```
 */
export function isNodeType<T extends MarkdownNode['type']>(
  node: BaseNode,
  ...types: T[]
): node is NodeByType<T> {
  return types.includes(node.type as T)
}

/**
 * Cast node to specific type (unsafe - use with caution)
 */
export function asNodeType<T extends MarkdownNode['type']>(
  node: BaseNode,
  _type: T
): NodeByType<T> {
  return node as NodeByType<T>
}

/**
 * Filter nodes by type
 */
export function filterByType<T extends MarkdownNode['type']>(
  nodes: BaseNode[],
  type: T
): NodeByType<T>[] {
  return nodes.filter((node): node is NodeByType<T> => node.type === type)
}

/**
 * Find first node matching type
 */
export function findByType<T extends MarkdownNode['type']>(
  nodes: BaseNode[],
  type: T
): NodeByType<T> | undefined {
  return nodes.find((node): node is NodeByType<T> => node.type === type)
}

/**
 * Map nodes with type safety
 */
export function mapNodes<T extends MarkdownNode, R>(
  nodes: BaseNode[],
  fn: MarkdownTransform<T, R>
): R[] {
  return nodes.map((node) => fn(node as T))
}

// ============================================================================
// Builder Functions (Factory Pattern)
// ============================================================================

/**
 * Create a heading node
 */
export function createHeadingNode(
  depth: 1 | 2 | 3 | 4 | 5 | 6,
  text: string,
  id: NodeId,
  parent: NodeId | null = null
): HeadingNode {
  return {
    id,
    type: 'heading',
    depth,
    text,
    parent,
    children: [],
  }
}

/**
 * Create a paragraph node
 */
export function createParagraphNode(
  text: string,
  id: NodeId,
  parent: NodeId | null = null
): ParagraphNode {
  return {
    id,
    type: 'paragraph',
    text,
    parent,
    children: [],
  }
}

/**
 * Create a code block node
 */
export function createCodeBlockNode(
  code: string,
  lang: string | undefined,
  id: NodeId,
  parent: NodeId | null = null
): CodeBlockNode {
  return {
    id,
    type: 'codeBlock',
    code,
    lang,
    parent,
    children: [],
  }
}

/**
 * Create a link node
 */
export function createLinkNode(
  text: string,
  url: string,
  title: string | undefined,
  id: NodeId,
  parent: NodeId | null = null
): LinkNode {
  return {
    id,
    type: 'link',
    text,
    url,
    title,
    parent,
    children: [],
  }
}
