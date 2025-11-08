/**
 * Detailed Profiling Benchmarks
 *
 * Comprehensive performance analysis suite for the Synth Markdown parser.
 *
 * Benchmarks:
 * 1. Parser phases (tokenization vs AST building)
 * 2. Memory efficiency
 * 3. Incremental parsing performance
 * 4. Query index performance
 * 5. Feature-specific benchmarks (tables, lists, code blocks)
 */

import { bench, describe } from 'vitest'
import { remark } from 'remark'
import { UltraOptimizedMarkdownParser } from '../src/parsers/markdown/ultra-optimized-parser.js'

// ============================================================================
// Test Documents
// ============================================================================

const simpleDoc = `# Hello World

This is a simple paragraph.
`

const tableheavyDoc = `# Tables

| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
| A1 | B1 | C1 | D1 |
| A2 | B2 | C2 | D2 |
| A3 | B3 | C3 | D3 |

| Left | Center | Right |
|:-----|:------:|------:|
| L1 | C1 | R1 |
| L2 | C2 | R2 |

| Name | Age | City |
|------|-----|------|
| John | 30 | NYC |
| Jane | 25 | LA |
`

const listheavyDoc = `# Lists

- Item 1
- Item 2
  - Nested 2.1
  - Nested 2.2
    - Deep 2.2.1
    - Deep 2.2.2
- Item 3

1. First
2. Second
3. Third
   1. Nested 3.1
   2. Nested 3.2
4. Fourth

- [ ] Todo 1
- [x] Todo 2 (done)
- [ ] Todo 3
`

const codeHeavyDoc = `# Code Examples

\`\`\`javascript
function example() {
  const x = 1
  const y = 2
  return x + y
}
\`\`\`

\`\`\`python
def hello():
    print("Hello, World!")
    return True
\`\`\`

\`\`\`rust
fn main() {
    println!("Hello, Rust!");
}
\`\`\`

\`\`\`typescript
interface User {
  name: string
  age: number
}

const user: User = {
  name: "Alice",
  age: 30
}
\`\`\`
`

const inlineHeavyDoc = `# Inline Formatting

This paragraph has **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

Here's a [link](https://example.com) and an ![image](image.jpg).

More text with **nested *emphasis* inside** and complex formatting.

Autolinks: https://example.com and user@example.com and www.github.com

Escape sequences: \\* \\[ \\] \\( \\) \\# \\+ \\- \\. \\! \\_ \\{ \\} \\~ \\|
`

const mixedDoc = `# Mixed Document

## Introduction

This document contains **all features** of CommonMark and GFM.

### Lists

- Item with **bold**
- Item with *italic*
- Item with \`code\`

1. First item
2. Second item
   - Nested unordered
   - Another nested

### Tables

| Feature | Status | Performance |
|---------|--------|-------------|
| Tables  | ✅     | Fast        |
| Lists   | ✅     | Fast        |
| Code    | ✅     | Fast        |

### Code Blocks

\`\`\`javascript
const parser = new MarkdownParser()
const tree = parser.parse(markdown)
\`\`\`

### Blockquotes

> This is a blockquote
> with **formatting** and *emphasis*

### Links and Images

Check out [GitHub](https://github.com) and ![logo](logo.png).

Autolinks: https://example.com

### Task Lists

- [x] Implement parser
- [x] Add tests
- [ ] Optimize performance

### Horizontal Rules

---

### Inline Code

Use \`npm install\` to install packages.

### HTML Blocks

<div>
  <p>HTML content</p>
</div>

<!-- Comment -->

### Reference Links

[ref1]: https://example.com "Example"
[ref2]: https://github.com "GitHub"
`

const realWorldDoc = Array(10).fill(mixedDoc).join('\n\n')

// ============================================================================
// Phase 1: Parser Phase Benchmarks
// ============================================================================

describe('Profiling: Parser Phases', () => {
  bench('Tokenization only', () => {
    const parser = new UltraOptimizedMarkdownParser()
    // @ts-ignore - accessing private for benchmark
    parser.tokenizer.tokenize(mixedDoc)
  })

  bench('Full parse (tokenization + AST building)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(mixedDoc)
  })

  bench('Parse with index building', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(mixedDoc, { buildIndex: true })
  })

  bench('Parse + getIndex (lazy)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(mixedDoc)
    parser.getIndex()
  })
})

// ============================================================================
// Phase 2: Feature-Specific Benchmarks
// ============================================================================

describe('Profiling: Tables', () => {
  bench('Remark - table heavy', () => {
    remark().parse(tableheavyDoc)
  })

  bench('Synth - table heavy', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(tableheavyDoc)
  })
})

describe('Profiling: Lists', () => {
  bench('Remark - list heavy', () => {
    remark().parse(listheavyDoc)
  })

  bench('Synth - list heavy', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(listheavyDoc)
  })
})

describe('Profiling: Code Blocks', () => {
  bench('Remark - code heavy', () => {
    remark().parse(codeHeavyDoc)
  })

  bench('Synth - code heavy', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(codeHeavyDoc)
  })
})

describe('Profiling: Inline Formatting', () => {
  bench('Remark - inline heavy', () => {
    remark().parse(inlineHeavyDoc)
  })

  bench('Synth - inline heavy', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(inlineHeavyDoc)
  })
})

// ============================================================================
// Phase 3: Document Size Scaling
// ============================================================================

describe('Profiling: Document Size Scaling', () => {
  const sizes = [
    { name: '100B', doc: simpleDoc },
    { name: '500B', doc: mixedDoc },
    { name: '5KB', doc: Array(10).fill(mixedDoc).join('\n\n') },
    { name: '50KB', doc: Array(100).fill(mixedDoc).join('\n\n') },
    { name: '500KB', doc: Array(1000).fill(mixedDoc).join('\n\n') },
  ]

  for (const { name, doc } of sizes) {
    bench(`Remark - ${name}`, () => {
      remark().parse(doc)
    })

    bench(`Synth - ${name}`, () => {
      const parser = new UltraOptimizedMarkdownParser()
      parser.parse(doc)
    })
  }
})

// ============================================================================
// Phase 4: Query Index Performance
// ============================================================================

describe('Profiling: Query Index', () => {
  bench('Parse without index', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(realWorldDoc, { buildIndex: false })
  })

  bench('Parse with index', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(realWorldDoc, { buildIndex: true })
  })

  bench('Query after parse (index exists)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    const tree = parser.parse(realWorldDoc, { buildIndex: true })
    const index = parser.getIndex()
    // @ts-ignore - accessing for benchmark
    index.query('heading')
    // @ts-ignore
    index.query('codeBlock')
    // @ts-ignore
    index.query('table')
  })

  bench('Query with lazy index', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(realWorldDoc)
    const index = parser.getIndex() // Build on demand
    // @ts-ignore
    index.query('heading')
  })
})

// ============================================================================
// Phase 5: Parser Reuse
// ============================================================================

describe('Profiling: Parser Reuse', () => {
  bench('Create new parser each time', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(mixedDoc)
  })

  const reusedParser = new UltraOptimizedMarkdownParser()
  bench('Reuse same parser', () => {
    reusedParser.parse(mixedDoc)
  })
})

// ============================================================================
// Phase 6: Comparison vs Remark (Real-World)
// ============================================================================

describe('Profiling: Real-World Document', () => {
  bench('Remark - README-sized (10KB)', () => {
    remark().parse(realWorldDoc)
  })

  bench('Synth - README-sized (10KB)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(realWorldDoc)
  })

  bench('Synth with index - README-sized', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(realWorldDoc, { buildIndex: true })
  })
})

// ============================================================================
// Phase 7: Edge Case Performance
// ============================================================================

describe('Profiling: Edge Cases', () => {
  const deeplyNested = `
${Array(100).fill(0).map((_, i) => '  '.repeat(i) + `- Item at depth ${i}`).join('\n')}
`

  const manyHeadings = Array(500).fill(0).map((_, i) => `# Heading ${i}\n\nParagraph ${i}\n`).join('\n')

  const manyCodeBlocks = Array(100).fill(0).map((_, i) => `\`\`\`javascript\nconst x${i} = ${i}\n\`\`\`\n`).join('\n')

  bench('Deeply nested lists', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(deeplyNested)
  })

  bench('Many headings (500)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(manyHeadings)
  })

  bench('Many code blocks (100)', () => {
    const parser = new UltraOptimizedMarkdownParser()
    parser.parse(manyCodeBlocks)
  })
})
