/**
 * Inline Markdown Tokenizer
 *
 * Tokenizes inline Markdown elements (emphasis, strong, code, links, images).
 * Designed for high performance with incremental re-tokenization support.
 */

import type {
  InlineToken,
  TextToken,
  EmphasisToken,
  StrongToken,
  InlineCodeToken,
  LinkToken,
  ImageToken,
  LineBreakToken,
} from './tokens.js'
import { createPosition, createTokenPosition } from './tokens.js'

/**
 * Inline Tokenizer
 *
 * Parses inline Markdown syntax within a line or text block.
 */
export class InlineTokenizer {
  /**
   * Tokenize inline elements in text
   */
  tokenize(text: string, lineIndex: number, lineStart: number): InlineToken[] {
    const tokens: InlineToken[] = []
    let offset = 0

    while (offset < text.length) {
      // Try each inline pattern in order
      const token =
        this.tryInlineCode(text, offset, lineIndex, lineStart) ||
        this.tryStrong(text, offset, lineIndex, lineStart) ||
        this.tryEmphasis(text, offset, lineIndex, lineStart) ||
        this.tryImage(text, offset, lineIndex, lineStart) ||
        this.tryLink(text, offset, lineIndex, lineStart) ||
        this.tryLineBreak(text, offset, lineIndex, lineStart) ||
        this.readText(text, offset, lineIndex, lineStart)

      tokens.push(token.token)
      offset = token.newOffset
    }

    return tokens
  }

  /**
   * Try to match inline code (`code`)
   */
  private tryInlineCode(
    text: string,
    offset: number,
    lineIndex: number,
    lineStart: number
  ): { token: InlineCodeToken; newOffset: number } | null {
    if (text[offset] !== '`') return null

    // Find closing backtick
    const end = text.indexOf('`', offset + 1)
    if (end === -1) return null

    const code = text.slice(offset + 1, end)
    const raw = text.slice(offset, end + 1)

    return {
      token: {
        type: 'inlineCode',
        value: code,
        raw,
        position: createTokenPosition(
          createPosition(lineIndex, offset, lineStart + offset),
          createPosition(lineIndex, end + 1, lineStart + end + 1)
        ),
      },
      newOffset: end + 1,
    }
  }

  /**
   * Try to match strong (**text** or __text__)
   */
  private tryStrong(
    text: string,
    offset: number,
    lineIndex: number,
    lineStart: number
  ): { token: StrongToken; newOffset: number } | null {
    const marker = text.slice(offset, offset + 2)
    if (marker !== '**' && marker !== '__') return null

    // Find closing marker
    const end = text.indexOf(marker, offset + 2)
    if (end === -1) return null

    const content = text.slice(offset + 2, end)
    const raw = text.slice(offset, end + 2)

    return {
      token: {
        type: 'strong',
        marker: marker as '**' | '__',
        text: content,
        raw,
        position: createTokenPosition(
          createPosition(lineIndex, offset, lineStart + offset),
          createPosition(lineIndex, end + 2, lineStart + end + 2)
        ),
      },
      newOffset: end + 2,
    }
  }

  /**
   * Try to match emphasis (*text* or _text_)
   */
  private tryEmphasis(
    text: string,
    offset: number,
    lineIndex: number,
    lineStart: number
  ): { token: EmphasisToken; newOffset: number } | null {
    const char = text[offset]
    if (char !== '*' && char !== '_') return null

    // Check if it's strong (** or __)
    if (text[offset + 1] === char) return null

    // Find closing marker
    const end = text.indexOf(char, offset + 1)
    if (end === -1) return null

    const content = text.slice(offset + 1, end)
    const raw = text.slice(offset, end + 1)

    return {
      token: {
        type: 'emphasis',
        marker: char as '*' | '_',
        text: content,
        raw,
        position: createTokenPosition(
          createPosition(lineIndex, offset, lineStart + offset),
          createPosition(lineIndex, end + 1, lineStart + end + 1)
        ),
      },
      newOffset: end + 1,
    }
  }

  /**
   * Try to match image (![alt](url "title"))
   */
  private tryImage(
    text: string,
    offset: number,
    lineIndex: number,
    lineStart: number
  ): { token: ImageToken; newOffset: number } | null {
    if (text.slice(offset, offset + 2) !== '![') return null

    // Find closing ]
    const altEnd = text.indexOf(']', offset + 2)
    if (altEnd === -1) return null

    // Check for (url)
    if (text[altEnd + 1] !== '(') return null

    const urlEnd = text.indexOf(')', altEnd + 2)
    if (urlEnd === -1) return null

    const alt = text.slice(offset + 2, altEnd)
    const urlPart = text.slice(altEnd + 2, urlEnd)

    // Parse url and optional title
    const urlMatch = urlPart.match(/^([^\s]+)(?:\s+"([^"]+)")?$/)
    if (!urlMatch) return null

    const url = urlMatch[1]!
    const title = urlMatch[2]

    const raw = text.slice(offset, urlEnd + 1)

    return {
      token: {
        type: 'image',
        alt,
        url,
        title,
        raw,
        position: createTokenPosition(
          createPosition(lineIndex, offset, lineStart + offset),
          createPosition(lineIndex, urlEnd + 1, lineStart + urlEnd + 1)
        ),
      },
      newOffset: urlEnd + 1,
    }
  }

  /**
   * Try to match link ([text](url "title"))
   */
  private tryLink(
    text: string,
    offset: number,
    lineIndex: number,
    lineStart: number
  ): { token: LinkToken; newOffset: number } | null {
    if (text[offset] !== '[') return null

    // Find closing ]
    const textEnd = text.indexOf(']', offset + 1)
    if (textEnd === -1) return null

    // Check for (url)
    if (text[textEnd + 1] !== '(') return null

    const urlEnd = text.indexOf(')', textEnd + 2)
    if (urlEnd === -1) return null

    const linkText = text.slice(offset + 1, textEnd)
    const urlPart = text.slice(textEnd + 2, urlEnd)

    // Parse url and optional title
    const urlMatch = urlPart.match(/^([^\s]+)(?:\s+"([^"]+)")?$/)
    if (!urlMatch) return null

    const url = urlMatch[1]!
    const title = urlMatch[2]

    const raw = text.slice(offset, urlEnd + 1)

    return {
      token: {
        type: 'link',
        text: linkText,
        url,
        title,
        raw,
        position: createTokenPosition(
          createPosition(lineIndex, offset, lineStart + offset),
          createPosition(lineIndex, urlEnd + 1, lineStart + urlEnd + 1)
        ),
      },
      newOffset: urlEnd + 1,
    }
  }

  /**
   * Try to match line break (two spaces + newline, or backslash + newline)
   */
  private tryLineBreak(
    text: string,
    offset: number,
    lineIndex: number,
    lineStart: number
  ): { token: LineBreakToken; newOffset: number } | null {
    // Check for hard break (two spaces or backslash before newline)
    if (text[offset] === '\n') {
      const prevTwo = text.slice(Math.max(0, offset - 2), offset)
      const hard = prevTwo === '  ' || prevTwo.endsWith('\\')

      return {
        token: {
          type: 'lineBreak',
          hard,
          raw: '\n',
          position: createTokenPosition(
            createPosition(lineIndex, offset, lineStart + offset),
            createPosition(lineIndex, offset + 1, lineStart + offset + 1)
          ),
        },
        newOffset: offset + 1,
      }
    }

    return null
  }

  /**
   * Read plain text until next special character
   */
  private readText(
    text: string,
    offset: number,
    lineIndex: number,
    lineStart: number
  ): { token: TextToken; newOffset: number } {
    // Special characters that start inline elements
    const specialChars = ['*', '_', '`', '[', '!', '\n']

    let end = offset
    while (end < text.length && !specialChars.includes(text[end]!)) {
      end++
    }

    // If we didn't advance, read at least one character
    if (end === offset) {
      end = offset + 1
    }

    const value = text.slice(offset, end)

    return {
      token: {
        type: 'text',
        value,
        raw: value,
        position: createTokenPosition(
          createPosition(lineIndex, offset, lineStart + offset),
          createPosition(lineIndex, end, lineStart + end)
        ),
      },
      newOffset: end,
    }
  }
}

/**
 * Create an inline tokenizer
 */
export function createInlineTokenizer(): InlineTokenizer {
  return new InlineTokenizer()
}
