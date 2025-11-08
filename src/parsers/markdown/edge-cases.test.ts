import { describe, it, expect } from 'vitest'
import { createUltraOptimizedTokenizer } from './ultra-optimized-tokenizer.js'

const tokenizer = createUltraOptimizedTokenizer()

describe('CommonMark Edge Cases', () => {
  describe('ATX Headings', () => {
    it('should require space after #', () => {
      const tokens = tokenizer.tokenize('#NoSpace')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should support up to 6 # symbols', () => {
      const tokens = tokenizer.tokenize('# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6')
      expect(tokens[0]?.type).toBe('heading')
      expect((tokens[0] as any).depth).toBe(1)
      expect(tokens[1]?.type).toBe('heading')
      expect((tokens[1] as any).depth).toBe(2)
      expect(tokens[5]?.type).toBe('heading')
      expect((tokens[5] as any).depth).toBe(6)
    })

    it('should treat 7+ # symbols as paragraph', () => {
      const tokens = tokenizer.tokenize('####### Not a heading')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle headings with only #', () => {
      const tokens = tokenizer.tokenize('#')
      // No space after # = paragraph
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Setext Headings', () => {
    it('should support === for H1', () => {
      const tokens = tokenizer.tokenize('Heading 1\n===')
      expect(tokens[0]?.type).toBe('heading')
      expect((tokens[0] as any).depth).toBe(1)
      expect((tokens[0] as any).text).toBe('Heading 1')
    })

    it('should support --- for H2', () => {
      const tokens = tokenizer.tokenize('Heading 2\n---')
      expect(tokens[0]?.type).toBe('heading')
      expect((tokens[0] as any).depth).toBe(2)
      expect((tokens[0] as any).text).toBe('Heading 2')
    })

    it('should allow spaces in setext underline', () => {
      const tokens = tokenizer.tokenize('Title\n= = =')
      expect(tokens[0]?.type).toBe('heading')
      expect((tokens[0] as any).depth).toBe(1)
    })

    it('should not treat mixed underlines as heading', () => {
      const tokens = tokenizer.tokenize('Text\n=-=')
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Code Blocks', () => {
    it('should handle code blocks with blank lines', () => {
      const tokens = tokenizer.tokenize('    line 1\n\n    line 2')
      expect(tokens[0]?.type).toBe('codeBlock')
      expect((tokens[0] as any).code).toBe('line 1\n\nline 2')
    })

    it('should handle fenced code blocks with language', () => {
      const tokens = tokenizer.tokenize('```javascript\nconst x = 1\n```')
      expect(tokens[0]?.type).toBe('codeBlock')
      expect((tokens[0] as any).lang).toBe('javascript')
      expect((tokens[0] as any).code).toBe('const x = 1')
    })

    it('should handle unclosed fenced code blocks', () => {
      const tokens = tokenizer.tokenize('```\ncode without closing fence')
      expect(tokens[0]?.type).toBe('codeBlock')
      expect((tokens[0] as any).code).toBe('code without closing fence')
    })

    it('should not treat < 4 spaces as code block', () => {
      const tokens = tokenizer.tokenize('   not code')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle tab as 4 spaces for indented code', () => {
      const tokens = tokenizer.tokenize('\tcode with tab')
      expect(tokens[0]?.type).toBe('codeBlock')
      expect((tokens[0] as any).code).toBe('code with tab')
    })
  })

  describe('Lists', () => {
    it('should handle empty list items', () => {
      const tokens = tokenizer.tokenize('- \n- item')
      expect(tokens[0]?.type).toBe('listItem')
      expect((tokens[0] as any).text).toBe('')
      expect(tokens[1]?.type).toBe('listItem')
      expect((tokens[1] as any).text).toBe('item')
    })

    it('should handle ordered lists with different numbers', () => {
      const tokens = tokenizer.tokenize('1. First\n5. Second\n999. Third')
      expect(tokens[0]?.type).toBe('listItem')
      expect(tokens[1]?.type).toBe('listItem')
      expect(tokens[2]?.type).toBe('listItem')
    })

    it('should require space after list marker', () => {
      const tokens = tokenizer.tokenize('-no space')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle different bullet markers', () => {
      const tokens = tokenizer.tokenize('- dash\n* asterisk\n+ plus')
      expect(tokens[0]?.type).toBe('listItem')
      expect(tokens[1]?.type).toBe('listItem')
      expect(tokens[2]?.type).toBe('listItem')
    })
  })

  describe('Blockquotes', () => {
    it('should handle blockquote with optional space', () => {
      const tokens = tokenizer.tokenize('> quote')
      expect(tokens[0]?.type).toBe('blockquote')
      expect((tokens[0] as any).text).toBe('quote')
    })

    it('should handle blockquote without space after >', () => {
      const tokens = tokenizer.tokenize('>quote')
      expect(tokens[0]?.type).toBe('blockquote')
      expect((tokens[0] as any).text).toBe('quote')
    })

    it('should handle empty blockquote', () => {
      const tokens = tokenizer.tokenize('>')
      expect(tokens[0]?.type).toBe('blockquote')
      expect((tokens[0] as any).text).toBe('')
    })
  })

  describe('Horizontal Rules', () => {
    it('should require at least 3 characters', () => {
      const tokens = tokenizer.tokenize('--')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should allow spaces between characters', () => {
      const tokens = tokenizer.tokenize('- - -')
      expect(tokens[0]?.type).toBe('horizontalRule')
    })

    it('should support -, *, and _', () => {
      const tokens = tokenizer.tokenize('---\n***\n___')
      expect(tokens[0]?.type).toBe('horizontalRule')
      expect(tokens[1]?.type).toBe('horizontalRule')
      expect(tokens[2]?.type).toBe('horizontalRule')
    })

    it('should not mix different characters', () => {
      const tokens = tokenizer.tokenize('-*-')
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Inline Code', () => {
    it('should handle unclosed inline code as text', () => {
      const tokens = tokenizer.tokenize('`unclosed')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle empty inline code', () => {
      const markdown = 'Text with `` empty'
      const tokens = tokenizer.tokenize(markdown)
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle multiple backticks', () => {
      const markdown = 'Use ` backtick in code'
      const tokens = tokenizer.tokenize(markdown)
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Emphasis and Strong', () => {
    it('should handle unclosed emphasis', () => {
      const tokens = tokenizer.tokenize('*unclosed')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle unclosed strong', () => {
      const tokens = tokenizer.tokenize('**unclosed')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle empty emphasis', () => {
      const tokens = tokenizer.tokenize('**')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle mixed markers', () => {
      const tokens = tokenizer.tokenize('*emphasis* and _also emphasis_')
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Links', () => {
    it('should handle links with empty text', () => {
      const tokens = tokenizer.tokenize('[](https://example.com)')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle links with empty URL', () => {
      const tokens = tokenizer.tokenize('[text]()')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle unclosed link text', () => {
      const tokens = tokenizer.tokenize('[unclosed')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle missing URL', () => {
      const tokens = tokenizer.tokenize('[text]')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle link without opening paren', () => {
      const tokens = tokenizer.tokenize('[text]url')
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Images', () => {
    it('should handle images with empty alt', () => {
      const tokens = tokenizer.tokenize('![](image.png)')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle images with empty URL', () => {
      const tokens = tokenizer.tokenize('![alt]()')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle ! without [', () => {
      const tokens = tokenizer.tokenize('!not an image')
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Escape Sequences', () => {
    it('should escape asterisks', () => {
      const tokens = tokenizer.tokenize('\\*not emphasis\\*')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should escape underscores', () => {
      const tokens = tokenizer.tokenize('\\_not emphasis\\_')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should escape brackets', () => {
      const tokens = tokenizer.tokenize('\\[not a link\\]')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should escape backticks', () => {
      const tokens = tokenizer.tokenize('\\`not code\\`')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should not escape non-punctuation', () => {
      const tokens = tokenizer.tokenize('\\a not escaped')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle backslash at end of line', () => {
      const tokens = tokenizer.tokenize('text\\')
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('Line Breaks', () => {
    it('should handle hard line break with backslash', () => {
      const tokens = tokenizer.tokenize('line1\\\nline2')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle hard line break with two spaces', () => {
      const tokens = tokenizer.tokenize('line1  \nline2')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle soft line break', () => {
      const tokens = tokenizer.tokenize('line1\nline2')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should not treat single space + newline as hard break', () => {
      const tokens = tokenizer.tokenize('line1 \nline2')
      expect(tokens[0]?.type).toBe('paragraph')
    })
  })

  describe('HTML Blocks', () => {
    it('should handle script tags', () => {
      const tokens = tokenizer.tokenize('<script>\nalert("hi")\n</script>')
      expect(tokens[0]?.type).toBe('htmlBlock')
    })

    it('should handle comments', () => {
      const tokens = tokenizer.tokenize('<!-- comment -->')
      expect(tokens[0]?.type).toBe('htmlBlock')
    })

    it('should handle processing instructions', () => {
      const tokens = tokenizer.tokenize('<?xml version="1.0"?>')
      expect(tokens[0]?.type).toBe('htmlBlock')
    })

    it('should handle CDATA', () => {
      const tokens = tokenizer.tokenize('<![CDATA[data]]>')
      expect(tokens[0]?.type).toBe('htmlBlock')
    })

    it('should handle div tags', () => {
      const tokens = tokenizer.tokenize('<div>\ncontent\n</div>')
      expect(tokens[0]?.type).toBe('htmlBlock')
    })

    it('should handle unclosed comments', () => {
      const tokens = tokenizer.tokenize('<!-- unclosed comment')
      expect(tokens[0]?.type).toBe('htmlBlock')
    })
  })

  describe('Link Reference Definitions', () => {
    it('should parse basic reference', () => {
      const tokens = tokenizer.tokenize('[ref]: https://example.com')
      expect(tokens[0]?.type).toBe('linkReference')
      expect((tokens[0] as any).label).toBe('ref')
      expect((tokens[0] as any).url).toBe('https://example.com')
    })

    it('should parse reference with title', () => {
      const tokens = tokenizer.tokenize('[ref]: https://example.com "Title"')
      expect(tokens[0]?.type).toBe('linkReference')
      expect((tokens[0] as any).title).toBe('Title')
    })

    it('should parse reference with angle brackets', () => {
      const tokens = tokenizer.tokenize('[ref]: <https://example.com>')
      expect(tokens[0]?.type).toBe('linkReference')
      expect((tokens[0] as any).url).toBe('https://example.com')
    })

    it('should handle reference with empty label', () => {
      const tokens = tokenizer.tokenize('[]: url')
      expect(tokens[0]?.type).toBe('paragraph')
    })

    it('should handle case-insensitive labels', () => {
      const tokens = tokenizer.tokenize('[REF]: url\n[ref]: url2')
      expect(tokens[0]?.type).toBe('linkReference')
      expect((tokens[0] as any).label).toBe('ref')
      expect(tokens[1]?.type).toBe('linkReference')
      expect((tokens[1] as any).label).toBe('ref')
    })

    it('should handle title with single quotes', () => {
      const tokens = tokenizer.tokenize("[ref]: url 'Title'")
      expect(tokens[0]?.type).toBe('linkReference')
      expect((tokens[0] as any).title).toBe('Title')
    })

    it('should handle title with parentheses', () => {
      const tokens = tokenizer.tokenize('[ref]: url (Title)')
      expect(tokens[0]?.type).toBe('linkReference')
      expect((tokens[0] as any).title).toBe('Title')
    })
  })

  describe('Blank Lines', () => {
    it('should tokenize blank lines', () => {
      const tokens = tokenizer.tokenize('\n\n')
      expect(tokens[0]?.type).toBe('blankLine')
      expect(tokens[1]?.type).toBe('blankLine')
    })

    it('should handle lines with only whitespace', () => {
      const tokens = tokenizer.tokenize('   \n\t\n')
      expect(tokens[0]?.type).toBe('blankLine')
      expect(tokens[1]?.type).toBe('blankLine')
    })
  })

  describe('Mixed Content', () => {
    it('should handle document with multiple element types', () => {
      const markdown = `# Heading

Paragraph with **bold** and *italic*.

- List item 1
- List item 2

> Blockquote

\`\`\`javascript
code block
\`\`\`

---

[ref]: https://example.com`

      const tokens = tokenizer.tokenize(markdown)
      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens[0]?.type).toBe('heading')
      expect(tokens.some(t => t.type === 'paragraph')).toBe(true)
      expect(tokens.some(t => t.type === 'listItem')).toBe(true)
      expect(tokens.some(t => t.type === 'blockquote')).toBe(true)
      expect(tokens.some(t => t.type === 'codeBlock')).toBe(true)
      expect(tokens.some(t => t.type === 'horizontalRule')).toBe(true)
      expect(tokens.some(t => t.type === 'linkReference')).toBe(true)
    })
  })
})
