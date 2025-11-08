/**
 * Multi-line Block Tests
 */

import { describe, it, expect } from 'vitest'
import { IncrementalMarkdownParser } from './parser.js'

describe('Multi-line Code Blocks', () => {
  it('should parse multi-line code block', () => {
    const markdown = `\`\`\`js
const x = 1
const y = 2
console.log(x + y)
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(1)

    const codeBlock = codeBlocks[0]!
    expect(codeBlock.data?.value).toContain('const x = 1')
    expect(codeBlock.data?.value).toContain('const y = 2')
    expect(codeBlock.data?.value).toContain('console.log(x + y)')
    expect(codeBlock.data?.lang).toBe('js')
  })

  it('should parse code block with language', () => {
    const markdown = `\`\`\`typescript
function hello(name: string): void {
  console.log(\`Hello, \${name}!\`)
}
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(1)
    expect(codeBlocks[0]?.data?.lang).toBe('typescript')
    expect(codeBlocks[0]?.data?.value).toContain('function hello')
  })

  it('should parse code block without language', () => {
    const markdown = `\`\`\`
plain code
no language specified
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(1)
    expect(codeBlocks[0]?.data?.lang).toBeUndefined()
    expect(codeBlocks[0]?.data?.value).toContain('plain code')
  })

  it('should parse code block with meta', () => {
    const markdown = `\`\`\`js title="example.js"
const x = 1
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(1)
    expect(codeBlocks[0]?.data?.lang).toBe('js')
    expect(codeBlocks[0]?.data?.meta).toBe('title="example.js"')
  })

  it('should parse empty code block', () => {
    const markdown = `\`\`\`js
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(1)
    expect(codeBlocks[0]?.data?.value).toBe('')
  })

  it('should parse multiple code blocks', () => {
    const markdown = `# Example

\`\`\`js
const x = 1
\`\`\`

Some text

\`\`\`python
x = 1
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(2)
    expect(codeBlocks[0]?.data?.lang).toBe('js')
    expect(codeBlocks[1]?.data?.lang).toBe('python')
  })

  it('should handle code block with backticks inside', () => {
    const markdown = `\`\`\`js
const template = \`Hello \${name}\`
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(1)
    expect(codeBlocks[0]?.data?.value).toContain('`Hello ${name}`')
  })

  it('should handle unclosed code block', () => {
    const markdown = `\`\`\`js
const x = 1
const y = 2`

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    // Should still create a code block even if not properly closed
    expect(codeBlocks.length).toBe(1)
  })

  it('should parse code block with mixed content', () => {
    const markdown = `# Code Examples

Here is some JavaScript:

\`\`\`js
function add(a, b) {
  return a + b
}
\`\`\`

And here is some Python:

\`\`\`python
def add(a, b):
    return a + b
\`\`\`

Done!`

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const headings = tree.nodes.filter((n) => n && n.type === 'heading')
    const paragraphs = tree.nodes.filter((n) => n && n.type === 'paragraph')
    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')

    expect(headings.length).toBe(1)
    expect(paragraphs.length).toBeGreaterThan(0)
    expect(codeBlocks.length).toBe(2)
  })

  it('should preserve indentation in code blocks', () => {
    const markdown = `\`\`\`js
function example() {
  if (true) {
    console.log('indented')
  }
}
\`\`\``

    const parser = new IncrementalMarkdownParser()
    const tree = parser.parse(markdown)

    const codeBlocks = tree.nodes.filter((n) => n && n.type === 'code')
    expect(codeBlocks.length).toBe(1)
    expect(codeBlocks[0]?.data?.value).toContain('  if (true)')
    expect(codeBlocks[0]?.data?.value).toContain('    console.log')
  })
})
