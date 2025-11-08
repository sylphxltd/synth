/**
 * Markdown AST node types
 */

import type { BaseNode } from '../../types/index.js'

export interface MarkdownHeading extends BaseNode {
  type: 'heading'
  depth: 1 | 2 | 3 | 4 | 5 | 6
}

export interface MarkdownParagraph extends BaseNode {
  type: 'paragraph'
}

export interface MarkdownText extends BaseNode {
  type: 'text'
  value: string
}

export interface MarkdownList extends BaseNode {
  type: 'list'
  ordered: boolean
  start?: number
}

export interface MarkdownListItem extends BaseNode {
  type: 'listItem'
}

export interface MarkdownCode extends BaseNode {
  type: 'code'
  lang?: string
  value: string
}

export interface MarkdownBlockquote extends BaseNode {
  type: 'blockquote'
}

export interface MarkdownEmphasis extends BaseNode {
  type: 'emphasis'
}

export interface MarkdownStrong extends BaseNode {
  type: 'strong'
}

export interface MarkdownLink extends BaseNode {
  type: 'link'
  url: string
  title?: string
}

export interface MarkdownImage extends BaseNode {
  type: 'image'
  url: string
  alt?: string
  title?: string
}

export type MarkdownNode =
  | MarkdownHeading
  | MarkdownParagraph
  | MarkdownText
  | MarkdownList
  | MarkdownListItem
  | MarkdownCode
  | MarkdownBlockquote
  | MarkdownEmphasis
  | MarkdownStrong
  | MarkdownLink
  | MarkdownImage
