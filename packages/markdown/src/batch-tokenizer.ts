/**
 * SIMD-Style Batch Tokenizer
 *
 * Processes multiple lines simultaneously for better performance
 * Expected gain: 2-3x on large documents
 */

import type { BlockToken } from './tokens.js'
import { UltraOptimizedTokenizer } from './ultra-optimized-tokenizer.js'

/**
 * Batch size for SIMD-style processing
 */
const DEFAULT_BATCH_SIZE = 8

/**
 * Line metadata for batch processing
 */
interface LineMetadata {
  index: number
  offset: number
  length: number
  indent: number
  firstChar: string
  startsWithHash: boolean
  startsWithDash: boolean
  startsWithStar: boolean
  startsWithPlus: boolean
  startsWithDigit: boolean
  startsWithBacktick: boolean
  startsWithGreater: boolean
  isEmpty: boolean
}

/**
 * Batch Tokenizer that processes multiple lines at once
 */
export class BatchTokenizer {
  private fallbackTokenizer: UltraOptimizedTokenizer
  private batchSize: number

  constructor(batchSize: number = DEFAULT_BATCH_SIZE) {
    this.fallbackTokenizer = new UltraOptimizedTokenizer()
    this.batchSize = batchSize
  }

  /**
   * Tokenize text using batch processing
   */
  tokenize(text: string): BlockToken[] {
    // Split into lines (but reuse the same array for efficiency)
    const lines = this.extractLines(text)

    if (lines.length < this.batchSize) {
      // Too few lines for batching, use fallback
      return this.fallbackTokenizer.tokenize(text)
    }

    // Extract metadata for all lines in parallel
    const metadata = this.extractLineMetadata(lines)

    // Process in batches
    const tokens: BlockToken[] = []
    let i = 0

    while (i < lines.length) {
      const batchEnd = Math.min(i + this.batchSize, lines.length)
      const batchTokens = this.processBatch(lines, metadata, i, batchEnd)
      tokens.push(...batchTokens)
      i = batchEnd
    }

    return tokens
  }

  /**
   * Extract lines from text (character-based, no split)
   */
  private extractLines(text: string): string[] {
    const lines: string[] = []
    let lineStart = 0

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        lines.push(text.slice(lineStart, i + 1))
        lineStart = i + 1
      }
    }

    // Last line (if no trailing newline)
    if (lineStart < text.length) {
      lines.push(text.slice(lineStart))
    }

    return lines
  }

  /**
   * Extract metadata for all lines in parallel
   */
  private extractLineMetadata(lines: string[]): LineMetadata[] {
    const metadata: LineMetadata[] = new Array(lines.length)
    let currentOffset = 0

    // Process all lines to extract metadata
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      const trimmed = line.trimStart()
      const indent = line.length - trimmed.length
      const firstChar = trimmed[0] || ''

      metadata[i] = {
        index: i,
        offset: currentOffset,
        length: line.length,
        indent,
        firstChar,
        startsWithHash: firstChar === '#',
        startsWithDash: firstChar === '-',
        startsWithStar: firstChar === '*',
        startsWithPlus: firstChar === '+',
        startsWithDigit: firstChar >= '0' && firstChar <= '9',
        startsWithBacktick: firstChar === '`',
        startsWithGreater: firstChar === '>',
        isEmpty: trimmed.length === 0,
      }

      currentOffset += line.length
    }

    return metadata
  }

  /**
   * Process a batch of lines
   */
  private processBatch(
    lines: string[],
    metadata: LineMetadata[],
    start: number,
    end: number
  ): BlockToken[] {
    const tokens: BlockToken[] = []
    let i = start

    while (i < end) {
      const meta = metadata[i]!

      // Quick pattern matching using metadata
      if (meta.isEmpty) {
        // Blank line
        tokens.push(this.createBlankLineToken(meta))
        i++
      } else if (meta.startsWithHash) {
        // Likely heading
        const token = this.parseHeading(lines[i]!, meta)
        if (token) {
          tokens.push(token)
          i++
        } else {
          // Not a heading, parse as paragraph
          const { token: paraToken, consumed } = this.parseParagraph(lines, metadata, i, end)
          tokens.push(paraToken)
          i += consumed
        }
      } else if (meta.startsWithBacktick) {
        // Code block
        const { token, consumed } = this.parseCodeBlock(lines, metadata, i, end)
        if (token) {
          tokens.push(token)
          i += consumed
        } else {
          // Not a code block, parse as paragraph
          const { token: paraToken, consumed: paraConsumed } = this.parseParagraph(lines, metadata, i, end)
          tokens.push(paraToken)
          i += paraConsumed
        }
      } else if (meta.startsWithDash || meta.startsWithStar || meta.startsWithPlus) {
        // List item or horizontal rule
        const token = this.parseListOrHR(lines[i]!, meta)
        tokens.push(token)
        i++
      } else if (meta.startsWithDigit) {
        // Ordered list
        const token = this.parseOrderedList(lines[i]!, meta)
        tokens.push(token)
        i++
      } else if (meta.startsWithGreater) {
        // Blockquote
        const token = this.parseBlockquote(lines[i]!, meta)
        tokens.push(token)
        i++
      } else {
        // Paragraph (may span multiple lines)
        const { token, consumed } = this.parseParagraph(lines, metadata, i, end)
        tokens.push(token)
        i += consumed
      }
    }

    return tokens
  }

  /**
   * Create blank line token
   */
  private createBlankLineToken(meta: LineMetadata): BlockToken {
    return {
      type: 'blankLine',
      raw: '',
      position: {
        start: { line: meta.index, column: 0, offset: meta.offset },
        end: { line: meta.index, column: meta.length, offset: meta.offset + meta.length },
      },
    }
  }

  /**
   * Parse heading
   */
  private parseHeading(line: string, meta: LineMetadata): BlockToken | null {
    const trimmed = line.trimStart()
    let depth = 0

    while (depth < trimmed.length && trimmed[depth] === '#') {
      depth++
    }

    if (depth > 6 || depth === 0) return null
    if (trimmed[depth] !== ' ') return null

    const text = trimmed.slice(depth + 1).trim()

    return {
      type: 'heading',
      depth: depth as 1 | 2 | 3 | 4 | 5 | 6,
      text,
      raw: line,
      position: {
        start: { line: meta.index, column: 0, offset: meta.offset },
        end: { line: meta.index, column: meta.length, offset: meta.offset + meta.length },
      },
    }
  }

  /**
   * Parse code block
   */
  private parseCodeBlock(
    lines: string[],
    metadata: LineMetadata[],
    start: number,
    end: number
  ): { token: BlockToken | null; consumed: number } {
    const firstLine = lines[start]!
    const trimmed = firstLine.trimStart()

    if (!trimmed.startsWith('```')) {
      return { token: null, consumed: 1 }
    }

    const lang = trimmed.slice(3).trim()
    const codeLines: string[] = []
    let i = start + 1

    // Find closing fence
    while (i < end) {
      const line = lines[i]!
      if (line.trimStart().startsWith('```')) {
        // Found closing fence
        const code = codeLines.join('')
        const allLines = [firstLine, ...codeLines, line]
        const raw = allLines.join('')

        return {
          token: {
            type: 'codeBlock',
            lang,
            meta: '',
            code,
            raw,
            position: {
              start: { line: metadata[start]!.index, column: 0, offset: metadata[start]!.offset },
              end: {
                line: metadata[i]!.index,
                column: metadata[i]!.length,
                offset: metadata[i]!.offset + metadata[i]!.length,
              },
            },
          },
          consumed: i - start + 1,
        }
      }

      codeLines.push(line)
      i++
    }

    // No closing fence found
    const code = codeLines.join('')
    const allLines = [firstLine, ...codeLines]
    const raw = allLines.join('')
    return {
      token: {
        type: 'codeBlock',
        lang,
        meta: '',
        code,
        raw,
        position: {
          start: { line: metadata[start]!.index, column: 0, offset: metadata[start]!.offset },
          end: {
            line: metadata[end - 1]!.index,
            column: metadata[end - 1]!.length,
            offset: metadata[end - 1]!.offset + metadata[end - 1]!.length,
          },
        },
      },
      consumed: end - start,
    }
  }

  /**
   * Parse list or horizontal rule
   */
  private parseListOrHR(line: string, meta: LineMetadata): BlockToken {
    const trimmed = line.trimStart()

    // Check for horizontal rule (--- or *** or ___)
    if (trimmed.match(/^([-*_])\1{2,}\s*$/)) {
      return {
        type: 'horizontalRule',
        raw: line,
        position: {
          start: { line: meta.index, column: 0, offset: meta.offset },
          end: { line: meta.index, column: meta.length, offset: meta.offset + meta.length },
        },
      }
    }

    // List item
    let text = trimmed.slice(1).trim()
    let checked: boolean | undefined

    // Check for task list
    if (text.startsWith('[ ]')) {
      checked = false
      text = text.slice(3).trim()
    } else if (text.startsWith('[x]') || text.startsWith('[X]')) {
      checked = true
      text = text.slice(3).trim()
    }

    return {
      type: 'listItem',
      text,
      checked,
      indent: meta.indent,
      raw: line,
      position: {
        start: { line: meta.index, column: 0, offset: meta.offset },
        end: { line: meta.index, column: meta.length, offset: meta.offset + meta.length },
      },
    }
  }

  /**
   * Parse ordered list
   */
  private parseOrderedList(line: string, meta: LineMetadata): BlockToken {
    const trimmed = line.trimStart()
    const match = trimmed.match(/^(\d+)\.\s+(.*)/)

    if (match) {
      return {
        type: 'listItem',
        text: match[2]!.trim(),
        indent: meta.indent,
        raw: line,
        position: {
          start: { line: meta.index, column: 0, offset: meta.offset },
          end: { line: meta.index, column: meta.length, offset: meta.offset + meta.length },
        },
      }
    }

    // Fallback to paragraph
    return {
      type: 'paragraph',
      text: trimmed,
      raw: line,
      position: {
        start: { line: meta.index, column: 0, offset: meta.offset },
        end: { line: meta.index, column: meta.length, offset: meta.offset + meta.length },
      },
    }
  }

  /**
   * Parse blockquote
   */
  private parseBlockquote(line: string, meta: LineMetadata): BlockToken {
    const trimmed = line.trimStart()
    const text = trimmed.slice(1).trim()

    return {
      type: 'blockquote',
      text,
      raw: line,
      position: {
        start: { line: meta.index, column: 0, offset: meta.offset },
        end: { line: meta.index, column: meta.length, offset: meta.offset + meta.length },
      },
    }
  }

  /**
   * Parse paragraph (may span multiple lines)
   */
  private parseParagraph(
    lines: string[],
    metadata: LineMetadata[],
    start: number,
    end: number
  ): { token: BlockToken; consumed: number } {
    const textLines: string[] = []
    const rawLines: string[] = []
    let i = start

    // Consume consecutive non-empty lines
    while (i < end && !metadata[i]!.isEmpty) {
      textLines.push(lines[i]!.trim())
      rawLines.push(lines[i]!)
      i++
    }

    const text = textLines.join(' ')
    const raw = rawLines.join('')

    return {
      token: {
        type: 'paragraph',
        text,
        raw,
        position: {
          start: { line: metadata[start]!.index, column: 0, offset: metadata[start]!.offset },
          end: {
            line: metadata[i - 1]!.index,
            column: metadata[i - 1]!.length,
            offset: metadata[i - 1]!.offset + metadata[i - 1]!.length,
          },
        },
      },
      consumed: i - start,
    }
  }
}

/**
 * Create batch tokenizer with custom batch size
 */
export function createBatchTokenizer(batchSize?: number): BatchTokenizer {
  return new BatchTokenizer(batchSize)
}
