/**
 * GFM (GitHub Flavored Markdown) Tests
 *
 * Tests for GFM extensions:
 * - Tables
 * - Strikethrough
 * - Autolinks
 */

import { describe, it, expect } from 'vitest'
import { tryTokenizeTable, tryTokenizeStrikethrough, tryTokenizeAutolink } from './gfm-tokenizer.js'

describe('GFM: Tables', () => {
  it('should tokenize basic table', () => {
    const lines = [
      '| Header 1 | Header 2 |',
      '|----------|----------|',
      '| Cell 1   | Cell 2   |',
    ]

    const result = tryTokenizeTable(lines, 0, 0)

    expect(result).toBeTruthy()
    expect(result!.token.type).toBe('table')
    expect(result!.token.header).toEqual(['Header 1', 'Header 2'])
    expect(result!.token.rows).toEqual([['Cell 1', 'Cell 2']])
    expect(result!.nextLine).toBe(3)
  })

  it('should parse table alignment', () => {
    const lines = [
      '| Left | Center | Right |',
      '|:-----|:------:|------:|',
      '| L    | C      | R     |',
    ]

    const result = tryTokenizeTable(lines, 0, 0)

    expect(result).toBeTruthy()
    expect(result!.token.align).toEqual(['left', 'center', 'right'])
  })

  it('should handle multiple rows', () => {
    const lines = [
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
      '| 3 | 4 |',
      '| 5 | 6 |',
    ]

    const result = tryTokenizeTable(lines, 0, 0)

    expect(result).toBeTruthy()
    expect(result!.token.rows.length).toBe(3)
    expect(result!.token.rows[0]).toEqual(['1', '2'])
    expect(result!.token.rows[1]).toEqual(['3', '4'])
    expect(result!.token.rows[2]).toEqual(['5', '6'])
  })

  it('should handle table without rows', () => {
    const lines = [
      '| Header 1 | Header 2 |',
      '|----------|----------|',
    ]

    const result = tryTokenizeTable(lines, 0, 0)

    expect(result).toBeTruthy()
    expect(result!.token.rows.length).toBe(0)
  })

  it('should reject invalid tables', () => {
    // Missing separator
    const lines1 = [
      '| Header 1 | Header 2 |',
      '| Cell 1   | Cell 2   |',
    ]

    const result1 = tryTokenizeTable(lines1, 0, 0)
    expect(result1).toBeNull()

    // Mismatched columns
    const lines2 = [
      '| Header 1 | Header 2 |',
      '|----------|',
      '| Cell 1   | Cell 2   |',
    ]

    const result2 = tryTokenizeTable(lines2, 0, 0)
    expect(result2).toBeNull()
  })
})

describe('GFM: Strikethrough', () => {
  it('should tokenize strikethrough text', () => {
    const text = '~~deleted text~~'
    const result = tryTokenizeStrikethrough(text, 0, 0, 0)

    expect(result).toBeTruthy()
    expect(result!.token.type).toBe('strikethrough')
    expect(result!.token.text).toBe('deleted text')
    expect(result!.token.raw).toBe('~~deleted text~~')
  })

  it('should handle strikethrough in middle of text', () => {
    const text = 'This is ~~deleted~~ text'
    const result = tryTokenizeStrikethrough(text, 8, 0, 0)

    expect(result).toBeTruthy()
    expect(result!.token.text).toBe('deleted')
    expect(result!.newOffset).toBe(19) // After ~~
  })

  it('should reject invalid strikethrough', () => {
    // Single tilde
    expect(tryTokenizeStrikethrough('~text~', 0, 0, 0)).toBeNull()

    // No closing
    expect(tryTokenizeStrikethrough('~~text', 0, 0, 0)).toBeNull()
  })
})

describe('GFM: Autolinks', () => {
  describe('Full URLs', () => {
    it('should tokenize https URLs', () => {
      const text = 'https://example.com'
      const result = tryTokenizeAutolink(text, 0, 0, 0)

      expect(result).toBeTruthy()
      expect(result!.token.type).toBe('autolink')
      expect(result!.token.url).toBe('https://example.com')
      expect(result!.token.raw).toBe('https://example.com')
    })

    it('should tokenize http URLs', () => {
      const text = 'http://example.com/path?query=1'
      const result = tryTokenizeAutolink(text, 0, 0, 0)

      expect(result).toBeTruthy()
      expect(result!.token.url).toBe('http://example.com/path?query=1')
    })
  })

  describe('www. prefix', () => {
    it('should tokenize www. URLs', () => {
      const text = 'www.example.com'
      const result = tryTokenizeAutolink(text, 0, 0, 0)

      expect(result).toBeTruthy()
      expect(result!.token.type).toBe('autolink')
      expect(result!.token.url).toBe('https://www.example.com')
      expect(result!.token.raw).toBe('www.example.com')
    })

    it('should handle www. with path', () => {
      const text = 'www.example.com/path'
      const result = tryTokenizeAutolink(text, 0, 0, 0)

      expect(result).toBeTruthy()
      expect(result!.token.url).toBe('https://www.example.com/path')
    })
  })

  describe('Email addresses', () => {
    it('should tokenize email addresses', () => {
      const text = 'user@example.com'
      const result = tryTokenizeAutolink(text, 0, 0, 0)

      expect(result).toBeTruthy()
      expect(result!.token.type).toBe('autolink')
      expect(result!.token.url).toBe('mailto:user@example.com')
      expect(result!.token.raw).toBe('user@example.com')
    })

    it('should handle complex email addresses', () => {
      const text = 'first.last+tag@subdomain.example.co.uk'
      const result = tryTokenizeAutolink(text, 0, 0, 0)

      expect(result).toBeTruthy()
      expect(result!.token.url).toBe('mailto:first.last+tag@subdomain.example.co.uk')
    })
  })

  describe('Autolinks in context', () => {
    it('should detect URL in middle of text', () => {
      const text = 'Check out https://github.com for code'
      const result = tryTokenizeAutolink(text, 10, 0, 0)

      expect(result).toBeTruthy()
      expect(result!.token.url).toBe('https://github.com')
    })

    it('should not match invalid URLs', () => {
      expect(tryTokenizeAutolink('not a url', 0, 0, 0)).toBeNull()
      expect(tryTokenizeAutolink('example', 0, 0, 0)).toBeNull()
    })
  })
})

describe('GFM: Integration', () => {
  it('should handle multiple GFM features together', () => {
    const lines = [
      '| Feature | Status |',
      '|---------|--------|',
      '| ~~Old~~ | Done |',
      '| New | https://example.com |',
    ]

    const result = tryTokenizeTable(lines, 0, 0)

    expect(result).toBeTruthy()
    expect(result!.token.rows.length).toBe(2)

    // First row has strikethrough (would need inline parsing)
    expect(result!.token.rows[0]).toEqual(['~~Old~~', 'Done'])

    // Second row has URL (would need inline parsing)
    expect(result!.token.rows[1]).toEqual(['New', 'https://example.com'])
  })
})
