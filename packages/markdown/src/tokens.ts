/**
 * Markdown Token Types
 *
 * Defines all token types for incremental Markdown tokenization.
 * Each token records its position for efficient incremental re-tokenization.
 */

import type { Position } from '@sylphx/ast-core'

/**
 * Token position range
 */
export interface TokenPosition {
  start: Position
  end: Position
}

/**
 * Base token interface
 */
export interface BaseToken {
  type: string
  position: TokenPosition
  raw: string // Original text
}

// ============================================================================
// Block-level Tokens
// ============================================================================

/**
 * Heading token (ATX style: # Heading)
 */
export interface HeadingToken extends BaseToken {
  type: 'heading'
  depth: 1 | 2 | 3 | 4 | 5 | 6
  text: string // Heading text (without #)
}

/**
 * Paragraph token
 */
export interface ParagraphToken extends BaseToken {
  type: 'paragraph'
  text: string
}

/**
 * Code block token (fenced: ```lang)
 */
export interface CodeBlockToken extends BaseToken {
  type: 'codeBlock'
  lang?: string
  meta?: string
  code: string
}

/**
 * List token (container for list items)
 */
export interface ListToken extends BaseToken {
  type: 'list'
  ordered: boolean
  start?: number // Starting number for ordered lists
  loose: boolean // Contains blank lines between items
}

/**
 * List item token
 */
export interface ListItemToken extends BaseToken {
  type: 'listItem'
  checked?: boolean // For task lists: [x] or [ ]
  indent: number // Indentation level
  text: string
}

/**
 * Blockquote token (> quoted text)
 */
export interface BlockquoteToken extends BaseToken {
  type: 'blockquote'
  text: string
}

/**
 * Horizontal rule token (---, ***, ___)
 */
export interface HorizontalRuleToken extends BaseToken {
  type: 'horizontalRule'
}

/**
 * Blank line token (for tracking loose lists)
 */
export interface BlankLineToken extends BaseToken {
  type: 'blankLine'
}

// ============================================================================
// Inline-level Tokens
// ============================================================================

/**
 * Text token (plain text)
 */
export interface TextToken extends BaseToken {
  type: 'text'
  value: string
}

/**
 * Emphasis token (*text* or _text_)
 */
export interface EmphasisToken extends BaseToken {
  type: 'emphasis'
  marker: '*' | '_'
  text: string
}

/**
 * Strong token (**text** or __text__)
 */
export interface StrongToken extends BaseToken {
  type: 'strong'
  marker: '**' | '__'
  text: string
}

/**
 * Inline code token (`code`)
 */
export interface InlineCodeToken extends BaseToken {
  type: 'inlineCode'
  value: string
}

/**
 * Link token ([text](url "title"))
 */
export interface LinkToken extends BaseToken {
  type: 'link'
  text: string
  url: string
  title?: string
}

/**
 * Image token (![alt](url "title"))
 */
export interface ImageToken extends BaseToken {
  type: 'image'
  alt: string
  url: string
  title?: string
}

/**
 * Line break token (soft: \n, hard: two spaces + \n)
 */
export interface LineBreakToken extends BaseToken {
  type: 'lineBreak'
  hard: boolean
}

// ============================================================================
// GFM Extension Tokens (for future)
// ============================================================================

/**
 * Table token
 */
export interface TableToken extends BaseToken {
  type: 'table'
  header: string[]
  align: Array<'left' | 'right' | 'center' | null>
  rows: string[][]
}

/**
 * Strikethrough token (~~text~~)
 */
export interface StrikethroughToken extends BaseToken {
  type: 'strikethrough'
  text: string
}

/**
 * Autolink token (https://example.com)
 */
export interface AutolinkToken extends BaseToken {
  type: 'autolink'
  url: string
}

/**
 * HTML block token
 */
export interface HTMLBlockToken extends BaseToken {
  type: 'htmlBlock'
  content: string
}

/**
 * Link reference definition token ([ref]: url "title")
 */
export interface LinkReferenceToken extends BaseToken {
  type: 'linkReference'
  label: string
  url: string
  title?: string
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * All possible token types
 */
export type Token =
  // Block tokens
  | HeadingToken
  | ParagraphToken
  | CodeBlockToken
  | ListToken
  | ListItemToken
  | BlockquoteToken
  | HorizontalRuleToken
  | BlankLineToken
  | LinkReferenceToken
  // Inline tokens
  | TextToken
  | EmphasisToken
  | StrongToken
  | InlineCodeToken
  | LinkToken
  | ImageToken
  | LineBreakToken
  // GFM tokens
  | TableToken
  | StrikethroughToken
  | AutolinkToken
  | HTMLBlockToken

/**
 * Block-level tokens only
 */
export type BlockToken =
  | HeadingToken
  | ParagraphToken
  | CodeBlockToken
  | ListToken
  | ListItemToken
  | BlockquoteToken
  | HorizontalRuleToken
  | BlankLineToken
  | TableToken
  | HTMLBlockToken
  | LinkReferenceToken

/**
 * Inline-level tokens only
 */
export type InlineToken =
  | TextToken
  | EmphasisToken
  | StrongToken
  | InlineCodeToken
  | LinkToken
  | ImageToken
  | LineBreakToken
  | StrikethroughToken
  | AutolinkToken

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if token is block-level
 */
export function isBlockToken(token: Token): token is BlockToken {
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
  ].includes(token.type)
}

/**
 * Check if token is inline-level
 */
export function isInlineToken(token: Token): token is InlineToken {
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
  ].includes(token.type)
}

/**
 * Create position from line/column/offset
 */
export function createPosition(line: number, column: number, offset: number): Position {
  return { line, column, offset }
}

/**
 * Create token position range
 */
export function createTokenPosition(start: Position, end: Position): TokenPosition {
  return { start, end }
}
