/**
 * Incremental Markdown Tokenizer
 *
 * Tokenizes Markdown text with support for incremental re-tokenization.
 * Key design: Position-aware tokens allow efficient partial re-tokenization.
 */

import type { Edit } from '@sylphx/ast-core'
import type {
  BlockToken,
  HeadingToken,
  ParagraphToken,
  CodeBlockToken,
  ListItemToken,
  BlockquoteToken,
  HorizontalRuleToken,
  BlankLineToken,
} from './tokens.js'
import { createPosition, createTokenPosition } from './tokens.js'

/**
 * Token range for incremental re-tokenization
 */
interface TokenRange {
  start: number // Start token index
  end: number // End token index (inclusive)
}

/**
 * Incremental Markdown Tokenizer
 *
 * Provides efficient tokenization with incremental re-tokenization support.
 */
export class IncrementalTokenizer {
  private tokens: BlockToken[] = []
  private source: string = ''

  /**
   * Full tokenization of Markdown text
   */
  tokenize(text: string): BlockToken[] {
    this.source = text
    this.tokens = []

    const lines = text.split('\n')
    let offset = 0
    let lineIndex = 0

    while (lineIndex < lines.length) {
      const line = lines[lineIndex]!
      const lineStart = offset

      // Check for multi-line blocks first
      if (line.trimStart().startsWith('```')) {
        // Code block - collect all lines until closing ```
        const codeBlockResult = this.tokenizeCodeBlock(lines, lineIndex, offset)
        if (codeBlockResult) {
          this.tokens.push(codeBlockResult.token)
          lineIndex = codeBlockResult.endLine
          offset = codeBlockResult.endOffset
          continue
        }
      }

      // Single-line tokens
      const token = this.tokenizeLine(line, lineIndex, lineStart)
      if (token) {
        this.tokens.push(token)
      }

      offset += line.length + 1 // +1 for \n
      lineIndex++
    }

    return this.tokens
  }

  /**
   * Incremental re-tokenization after edit
   *
   * Strategy:
   * 1. Find affected token range based on edit position
   * 2. Extract affected text region
   * 3. Re-tokenize only affected region
   * 4. Merge: reused tokens + new tokens + reused tokens
   */
  retokenize(text: string, edit: Edit, oldTokens: BlockToken[]): BlockToken[] {
    this.source = text

    // 1. Find affected token range
    const affectedRange = this.findAffectedTokenRange(edit, oldTokens)

    // 2. Extract affected text region
    const { affectedText, startOffset } = this.extractAffectedText(
      text,
      affectedRange,
      oldTokens,
      edit
    )

    // 3. Re-tokenize affected region
    const newTokens = this.retokenizeRegion(affectedText, startOffset)

    // 4. Merge tokens
    const result = [
      ...oldTokens.slice(0, affectedRange.start),
      ...newTokens,
      ...this.adjustTokenPositions(
        oldTokens.slice(affectedRange.end + 1),
        edit
      ),
    ]

    this.tokens = result
    return result
  }

  /**
   * Tokenize a multi-line code block
   */
  private tokenizeCodeBlock(
    lines: string[],
    startLine: number,
    startOffset: number
  ): { token: CodeBlockToken; endLine: number; endOffset: number } | null {
    const firstLine = lines[startLine]!
    const match = firstLine.match(/^(\s*)```(\w+)?\s*(.*)$/)

    if (!match) return null

    const lang = match[2]
    const meta = match[3]

    // Collect code lines
    const codeLines: string[] = []
    let currentLine = startLine + 1
    let endLine = startLine
    let endOffset = startOffset + firstLine.length + 1

    // Find closing ```
    while (currentLine < lines.length) {
      const line = lines[currentLine]!

      if (line.trimStart().startsWith('```')) {
        // Found closing fence
        endLine = currentLine
        endOffset += line.length + 1
        break
      }

      codeLines.push(line)
      endOffset += line.length + 1
      currentLine++
    }

    const code = codeLines.join('\n')
    const raw = lines.slice(startLine, endLine + 1).join('\n')

    return {
      token: {
        type: 'codeBlock',
        lang,
        meta,
        code,
        raw,
        position: createTokenPosition(
          createPosition(startLine, 0, startOffset),
          createPosition(endLine, lines[endLine]?.length || 0, endOffset)
        ),
      },
      endLine: endLine + 1, // Next line to process
      endOffset,
    }
  }

  /**
   * Tokenize a single line
   */
  private tokenizeLine(
    line: string,
    lineIndex: number,
    lineStart: number
  ): BlockToken | null {
    const trimmed = line.trim()

    // Blank line
    if (!trimmed) {
      return this.createBlankLineToken(line, lineIndex, lineStart)
    }

    // Heading (ATX style: # Heading)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      return this.createHeadingToken(line, lineIndex, lineStart, headingMatch)
    }

    // Horizontal rule (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(trimmed)) {
      return this.createHorizontalRuleToken(line, lineIndex, lineStart)
    }

    // List item (-, *, +, 1., 2., etc.)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/)
    if (listMatch) {
      return this.createListItemToken(line, lineIndex, lineStart, listMatch)
    }

    // Blockquote (> text)
    if (trimmed.startsWith('>')) {
      return this.createBlockquoteToken(line, lineIndex, lineStart)
    }

    // Default: paragraph
    return this.createParagraphToken(line, lineIndex, lineStart)
  }

  /**
   * Create heading token
   */
  private createHeadingToken(
    line: string,
    lineIndex: number,
    lineStart: number,
    match: RegExpMatchArray
  ): HeadingToken {
    const depth = match[1]!.length as 1 | 2 | 3 | 4 | 5 | 6
    const text = match[2]!

    return {
      type: 'heading',
      depth,
      text,
      raw: line,
      position: createTokenPosition(
        createPosition(lineIndex, 0, lineStart),
        createPosition(lineIndex, line.length, lineStart + line.length)
      ),
    }
  }

  /**
   * Create paragraph token
   */
  private createParagraphToken(
    line: string,
    lineIndex: number,
    lineStart: number
  ): ParagraphToken {
    return {
      type: 'paragraph',
      text: line,
      raw: line,
      position: createTokenPosition(
        createPosition(lineIndex, 0, lineStart),
        createPosition(lineIndex, line.length, lineStart + line.length)
      ),
    }
  }

  /**
   * Create list item token
   */
  private createListItemToken(
    line: string,
    lineIndex: number,
    lineStart: number,
    match: RegExpMatchArray
  ): ListItemToken {
    const indent = match[1]!.length
    const text = match[3]!

    // Check for task list ([x] or [ ])
    const taskMatch = text.match(/^\[([x ])\]\s+(.*)$/)
    const checked = taskMatch
      ? taskMatch[1] === 'x'
      : undefined

    return {
      type: 'listItem',
      indent,
      text: taskMatch ? taskMatch[2]! : text,
      checked,
      raw: line,
      position: createTokenPosition(
        createPosition(lineIndex, 0, lineStart),
        createPosition(lineIndex, line.length, lineStart + line.length)
      ),
    }
  }

  /**
   * Create blockquote token
   */
  private createBlockquoteToken(
    line: string,
    lineIndex: number,
    lineStart: number
  ): BlockquoteToken {
    const text = line.replace(/^>\s?/, '')

    return {
      type: 'blockquote',
      text,
      raw: line,
      position: createTokenPosition(
        createPosition(lineIndex, 0, lineStart),
        createPosition(lineIndex, line.length, lineStart + line.length)
      ),
    }
  }

  /**
   * Create horizontal rule token
   */
  private createHorizontalRuleToken(
    line: string,
    lineIndex: number,
    lineStart: number
  ): HorizontalRuleToken {
    return {
      type: 'horizontalRule',
      raw: line,
      position: createTokenPosition(
        createPosition(lineIndex, 0, lineStart),
        createPosition(lineIndex, line.length, lineStart + line.length)
      ),
    }
  }

  /**
   * Create blank line token
   */
  private createBlankLineToken(
    line: string,
    lineIndex: number,
    lineStart: number
  ): BlankLineToken {
    return {
      type: 'blankLine',
      raw: line,
      position: createTokenPosition(
        createPosition(lineIndex, 0, lineStart),
        createPosition(lineIndex, line.length, lineStart + line.length)
      ),
    }
  }

  /**
   * Find affected token range based on edit
   */
  private findAffectedTokenRange(edit: Edit, oldTokens: BlockToken[]): TokenRange {
    const startByte = edit.startByte
    const endByte = edit.oldEndByte

    let start = 0
    let end = oldTokens.length - 1

    // Find first affected token
    for (let i = 0; i < oldTokens.length; i++) {
      const token = oldTokens[i]!
      if (token.position.end.offset >= startByte) {
        start = i
        break
      }
    }

    // Find last affected token
    for (let i = oldTokens.length - 1; i >= 0; i--) {
      const token = oldTokens[i]!
      if (token.position.start.offset <= endByte) {
        end = i
        break
      }
    }

    // Expand range to include surrounding context (for safety)
    start = Math.max(0, start - 1)
    end = Math.min(oldTokens.length - 1, end + 1)

    return { start, end }
  }

  /**
   * Extract affected text region
   */
  private extractAffectedText(
    text: string,
    range: TokenRange,
    oldTokens: BlockToken[],
    edit: Edit
  ): { affectedText: string; startOffset: number } {
    const startToken = oldTokens[range.start]
    const endToken = oldTokens[range.end]

    if (!startToken || !endToken) {
      // If no tokens, tokenize entire text
      return { affectedText: text, startOffset: 0 }
    }

    const startOffset = startToken.position.start.offset
    const endOffset = endToken.position.end.offset + (edit.newEndByte - edit.oldEndByte)

    const affectedText = text.slice(startOffset, endOffset)

    return { affectedText, startOffset }
  }

  /**
   * Re-tokenize a specific region
   */
  private retokenizeRegion(text: string, startOffset: number): BlockToken[] {
    const lines = text.split('\n')
    const tokens: BlockToken[] = []
    let offset = startOffset

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      const lineIndex = Math.floor(offset / 100) // Approximate line number
      const token = this.tokenizeLine(line, lineIndex, offset)

      if (token) {
        tokens.push(token)
      }

      offset += line.length + 1
    }

    return tokens
  }

  /**
   * Adjust token positions after edit
   */
  private adjustTokenPositions(tokens: BlockToken[], edit: Edit): BlockToken[] {
    const offset = edit.newEndByte - edit.oldEndByte

    return tokens.map((token) => ({
      ...token,
      position: {
        start: {
          ...token.position.start,
          offset: token.position.start.offset + offset,
        },
        end: {
          ...token.position.end,
          offset: token.position.end.offset + offset,
        },
      },
    }))
  }

  /**
   * Get current tokens
   */
  getTokens(): BlockToken[] {
    return this.tokens
  }

  /**
   * Get source text
   */
  getSource(): string {
    return this.source
  }
}

/**
 * Create an incremental tokenizer
 */
export function createTokenizer(): IncrementalTokenizer {
  return new IncrementalTokenizer()
}
