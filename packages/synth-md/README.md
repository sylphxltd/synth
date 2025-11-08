# @sylphx/synth-md

High-performance CommonMark parser - 26-42x faster than remark.

## Features

- **Ultra-Fast Parsing**: 26-42x faster than remark/unified
- **CommonMark Compliant**: Full CommonMark specification support
- **Streaming**: Process Markdown incrementally
- **Incremental**: Re-parse only changed regions
- **Plugin System**: Extensible with transforms and visitors
- **Zero Dependencies**: Self-contained implementation with no external parser dependencies

## Performance

```
Benchmark Results (Complex Document - 10KB):
─────────────────────────────────────────────
remark (unified)           238 Hz    4.20 ms
@sylphx/synth-md         10,045 Hz    0.10 ms

🚀 42.2x faster than remark
```

## Installation

```bash
npm install @sylphx/synth @sylphx/synth-md
```

### Optional Extensions

```bash
# GitHub Flavored Markdown (tables, strikethrough, autolinks, task lists)
npm install @sylphx/synth-md-gfm

# Mermaid diagrams
npm install @sylphx/synth-md-mermaid

# KaTeX math rendering
npm install @sylphx/synth-md-katex
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-md'

const tree = parse('# Hello **World**')
```

### With Plugins

```typescript
import { parse, addHeadingIds, tableOfContents } from '@sylphx/synth-md'

// Sync plugins
const tree = parse(text, {
  plugins: [addHeadingIds, tableOfContents]
})

// Access plugin data
console.log(tree.meta.data.toc)
```

### Async Plugins

```typescript
import { parseAsync } from '@sylphx/synth-md'

// Async plugins or prefer async/await
const tree = await parseAsync(text, {
  plugins: [asyncPlugin1, asyncPlugin2]
})
```

### Reusable Parser with Plugin Registration

```typescript
import { createParser } from '@sylphx/synth-md'

const parser = createParser()
  .use(addHeadingIds)
  .use(tableOfContents)

// Plugins automatically applied
const tree1 = parser.parse(doc1)
const tree2 = parser.parse(doc2)

// Or add one-off plugins
const tree3 = parser.parse(doc3, {
  plugins: [extraPlugin]  // Merged with registered plugins
})
```

### Performance Optimizations

```typescript
import { parse } from '@sylphx/synth-md'

const tree = parse(largeDocument, {
  useBatchTokenizer: true,  // 4-5x faster on large docs
  useNodePool: true,        // 10-13x faster for repeated parses (default: true)
  batchSize: 32,            // Optimal batch size
  buildIndex: false         // Skip index for 4x speedup (default)
})
```

### Incremental Parsing

```typescript
import { IncrementalMarkdownParser, detectEdit } from '@sylphx/synth-md'

const incParser = new IncrementalMarkdownParser()
incParser.parse(originalText)

// After edit
const edit = detectEdit(originalText, newText)
const updated = incParser.update(newText, edit)  // 10-100x faster
```

### Streaming

```typescript
import { StreamingMarkdownParser } from '@sylphx/synth-md'

const stream = new StreamingMarkdownParser()

for (const chunk of chunks) {
  stream.feed(chunk)
}

const tree = stream.end()
```

## API

### Functions

#### `parse(text: string, options?: ParseOptions): Tree`

Synchronous parsing with optional plugins (sync only).

```typescript
const tree = parse('# Hello', { plugins: [addHeadingIds] })
```

#### `parseAsync(text: string, options?: ParseOptions): Promise<Tree>`

Async parsing with support for async plugins.

```typescript
const tree = await parseAsync(text, { plugins: [asyncPlugin] })
```

#### `createParser(): Parser`

Create reusable parser instance with plugin registration.

```typescript
const parser = createParser()
  .use(plugin1)
  .use(plugin2)

const tree = parser.parse(text)
```

### Parser Class

- `parse(text, options)` - Sync parse (auto-applies registered plugins)
- `parseAsync(text, options)` - Async parse (auto-applies registered plugins)
- `use(plugin)` - Register plugin (chainable)
- `getIndex()` - Get query index (if built)

### ParseOptions

```typescript
interface ParseOptions {
  buildIndex?: boolean        // Build query index (default: false)
  plugins?: Plugin[]          // Plugins to apply
  useNodePool?: boolean       // Object pooling (default: true)
  useBatchTokenizer?: boolean // Batch processing (default: false)
  batchSize?: number          // Batch size (default: 16, range: 1-128)
}
```

### Built-in Plugins

- `addHeadingIds` - Add slugified IDs to headings
- `tableOfContents` - Generate table of contents
- `uppercaseHeadings` - Uppercase all heading text
- `addCodeLineNumbers` - Add line numbers to code blocks
- `removeComments` - Remove HTML comments
- `wrapParagraphs` - Wrap paragraphs with metadata

### Other Parsers

- `IncrementalMarkdownParser` - Incremental updates (10-100x faster for edits)
- `StreamingMarkdownParser` - Streaming parsing

## Supported Markdown

### CommonMark
- Headings (ATX and Setext)
- Paragraphs
- Block quotes
- Lists (ordered and unordered)
- Code blocks (fenced and indented)
- Horizontal rules
- Links and images
- Emphasis and strong
- Inline code
- HTML blocks

### GFM (GitHub Flavored Markdown)
- Tables
- Strikethrough
- Task lists
- Autolinks

## Performance Tips

1. **For Large Documents (>10KB)**: Enable batch tokenizer
   ```typescript
   parse(text, { useBatchTokenizer: true, batchSize: 32 })
   ```

2. **For Repeated Parses**: Node pooling is ON by default (1.5-2x faster)
   ```typescript
   parse(text, { useNodePool: true })  // Already default!
   ```

3. **For Edits**: Use incremental parser (10-100x faster)
   ```typescript
   const incParser = new IncrementalMarkdownParser()
   // ... later
   incParser.update(newText, edit)
   ```

4. **For Live Preview**: Use streaming parser
   ```typescript
   const stream = new StreamingMarkdownParser()
   stream.feed(chunk1)
   stream.feed(chunk2)
   const tree = stream.end()
   ```

5. **For Queries**: Only enable index when needed
   ```typescript
   parse(text, { buildIndex: true })  // 4x slower, but enables queries
   ```

6. **Reuse Parser Instances**: Amortize initialization cost
   ```typescript
   const parser = createParser().use(myPlugin)
   docs.forEach(doc => parser.parse(doc))  // Reuse same parser
   ```

## License

MIT
