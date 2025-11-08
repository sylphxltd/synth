/**
 * GFM (GitHub Flavored Markdown) Extensions Tokenizer
 *
 * Adds support for:
 * - Tables
 * - Strikethrough
 * - Autolinks
 * - Task lists (already supported in base tokenizer)
 */

import type {
  TableToken,
  StrikethroughToken,
  AutolinkToken,
} from './tokens.js'
import { createPosition, createTokenPosition } from './tokens.js'

/**
 * Table alignment type
 */
type Alignment = 'left' | 'right' | 'center' | null

/**
 * Detect if a line is a table separator (|---|---|)
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false

  // Remove outer pipes and split
  const content = trimmed.slice(1, -1)
  const cells = content.split('|')

  // Each cell must be a valid alignment marker
  for (const cell of cells) {
    const c = cell.trim()
    if (!c.match(/^:?-+:?$/)) return false
  }

  return cells.length > 0
}

/**
 * Parse table alignment from separator line
 */
function parseAlignment(separatorLine: string): Alignment[] {
  const trimmed = separatorLine.trim()
  const content = trimmed.slice(1, -1) // Remove outer pipes
  const cells = content.split('|')

  return cells.map(cell => {
    const c = cell.trim()
    const hasLeft = c.startsWith(':')
    const hasRight = c.endsWith(':')

    if (hasLeft && hasRight) return 'center'
    if (hasRight) return 'right'
    if (hasLeft) return 'left'
    return null
  })
}

/**
 * Parse table row into cells
 */
function parseTableRow(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return []
  }

  const content = trimmed.slice(1, -1) // Remove outer pipes
  return content.split('|').map(cell => cell.trim())
}

/**
 * Try to tokenize a table starting at the given line
 *
 * Table format:
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 */
export function tryTokenizeTable(
  lines: string[],
  lineIndex: number,
  offset: number
): { token: TableToken; nextLine: number } | null {
  // Need at least 2 lines (header + separator)
  if (lineIndex + 1 >= lines.length) return null

  const headerLine = lines[lineIndex]!
  const separatorLine = lines[lineIndex + 1]!

  // Check if it's a table header
  if (!headerLine.trim().startsWith('|') || !headerLine.trim().endsWith('|')) {
    return null
  }

  // Check if next line is separator
  if (!isTableSeparator(separatorLine)) {
    return null
  }

  // Parse header
  const header = parseTableRow(headerLine)
  if (header.length === 0) return null

  // Parse alignment
  const align = parseAlignment(separatorLine)

  // Ensure same number of columns
  if (align.length !== header.length) return null

  // Parse rows
  const rows: string[][] = []
  let currentLine = lineIndex + 2

  while (currentLine < lines.length) {
    const line = lines[currentLine]!
    const trimmed = line.trim()

    // End of table
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
      break
    }

    const row = parseTableRow(line)
    if (row.length === 0) break

    rows.push(row)
    currentLine++
  }

  // Calculate raw text and position
  const startLine = lineIndex
  const endLine = currentLine - 1
  const raw = lines.slice(startLine, currentLine).join('\n')

  // Count characters to get end offset
  let endOffset = offset
  for (let i = startLine; i < currentLine; i++) {
    endOffset += lines[i]!.length + 1 // +1 for \n
  }

  return {
    token: {
      type: 'table',
      header,
      align,
      rows,
      raw,
      position: createTokenPosition(
        createPosition(startLine, 0, offset),
        createPosition(endLine, lines[endLine]!.length, endOffset - 1)
      ),
    },
    nextLine: currentLine,
  }
}

/**
 * Check if text contains a URL (for autolinks)
 */
function isURL(text: string): boolean {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}

/**
 * Check if text is an email address
 */
function isEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(text)
}

/**
 * Try to tokenize an autolink
 *
 * Formats:
 * - https://example.com
 * - www.example.com
 * - user@example.com
 */
export function tryTokenizeAutolink(
  text: string,
  offset: number,
  lineIndex: number,
  lineStart: number
): { token: AutolinkToken; newOffset: number } | null {
  // Try URL starting with protocol
  const urlMatch = text.slice(offset).match(/^(https?:\/\/[^\s<>]+)/)
  if (urlMatch) {
    const url = urlMatch[1]!
    if (isURL(url)) {
      return {
        token: {
          type: 'autolink',
          url,
          raw: url,
          position: createTokenPosition(
            createPosition(lineIndex, offset - lineStart, lineStart + offset),
            createPosition(lineIndex, offset - lineStart + url.length, lineStart + offset + url.length)
          ),
        },
        newOffset: offset + url.length,
      }
    }
  }

  // Try www. prefix
  const wwwMatch = text.slice(offset).match(/^(www\.[^\s<>]+)/)
  if (wwwMatch) {
    const url = wwwMatch[1]!
    const fullUrl = 'https://' + url

    return {
      token: {
        type: 'autolink',
        url: fullUrl,
        raw: url,
        position: createTokenPosition(
          createPosition(lineIndex, offset - lineStart, lineStart + offset),
          createPosition(lineIndex, offset - lineStart + url.length, lineStart + offset + url.length)
        ),
      },
      newOffset: offset + url.length,
    }
  }

  // Try email
  const emailMatch = text.slice(offset).match(/^([^\s@]+@[^\s@]+\.[^\s@]+)/)
  if (emailMatch) {
    const email = emailMatch[1]!
    if (isEmail(email)) {
      return {
        token: {
          type: 'autolink',
          url: 'mailto:' + email,
          raw: email,
          position: createTokenPosition(
            createPosition(lineIndex, offset - lineStart, lineStart + offset),
            createPosition(lineIndex, offset - lineStart + email.length, lineStart + offset + email.length)
          ),
        },
        newOffset: offset + email.length,
      }
    }
  }

  return null
}

/**
 * Try to tokenize strikethrough
 *
 * Format: ~~deleted text~~
 */
export function tryTokenizeStrikethrough(
  text: string,
  offset: number,
  lineIndex: number,
  lineStart: number
): { token: StrikethroughToken; newOffset: number } | null {
  // Must start with ~~
  if (offset + 1 >= text.length || text[offset] !== '~' || text[offset + 1] !== '~') {
    return null
  }

  // Find closing ~~
  let end = offset + 2
  while (end < text.length - 1) {
    if (text[end] === '~' && text[end + 1] === '~') {
      // Found closing marker
      const content = text.slice(offset + 2, end)
      const raw = text.slice(offset, end + 2)

      return {
        token: {
          type: 'strikethrough',
          text: content,
          raw,
          position: createTokenPosition(
            createPosition(lineIndex, offset - lineStart, lineStart + offset),
            createPosition(lineIndex, end + 2 - lineStart, lineStart + end + 2)
          ),
        },
        newOffset: end + 2,
      }
    }
    end++
  }

  return null
}
