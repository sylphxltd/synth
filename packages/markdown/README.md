# @sylphx/ast-markdown

High-performance Markdown parser - 26-42x faster than remark.

## Features

- **Ultra-Fast Parsing**: 26-42x faster than remark/unified
- **GFM Support**: GitHub Flavored Markdown (tables, strikethrough, task lists)
- **Streaming**: Process Markdown incrementally
- **Incremental**: Re-parse only changed regions
- **Plugin System**: Extensible with transforms and visitors
- **Zero Dependencies**: Self-contained implementation with no external parser dependencies

## Performance

```
Benchmark Results (Complex Document - 10KB):
─────────────────────────────────────────────
remark (unified)           238 Hz    4.20 ms
@sylphx/ast-markdown     10,045 Hz    0.10 ms

🚀 42.2x faster than remark
```

## Installation

```bash
npm install @sylphx/ast-markdown
```

## Usage

### Basic Parsing

```typescript
import { UltraOptimizedMarkdownParser } from '@sylphx/ast-markdown'

const parser = new UltraOptimizedMarkdownParser()
const tree = parser.parse('# Hello **World**')
```

### With Optimizations

```typescript
const tree = parser.parse(largeDocument, {
  useBatchTokenizer: true,  // 4-5x faster on large docs
  useNodePool: true,        // 10-13x faster for repeated parses
  batchSize: 32            // Optimal batch size
})
```

### Incremental Parsing

```typescript
import { IncrementalMarkdownParser, detectEdit } from '@sylphx/ast-markdown'

const incParser = new IncrementalMarkdownParser()
incParser.parse(originalText)

// After edit
const edit = detectEdit(originalText, newText)
const updated = incParser.update(newText, edit)  // 10-100x faster
```

### Streaming

```typescript
import { StreamingMarkdownParser } from '@sylphx/ast-markdown'

const stream = new StreamingMarkdownParser()

for (const chunk of chunks) {
  stream.feed(chunk)
}

const tree = stream.end()
```

### Plugins

```typescript
import { addHeadingIds, tableOfContents } from '@sylphx/ast-markdown'

const tree = parser.parse(text, {
  plugins: [addHeadingIds, tableOfContents]
})

// Access TOC
console.log(tree.meta.data.toc)
```

## API

### Parsers
- `UltraOptimizedMarkdownParser` - Main parser (fastest)
- `IncrementalMarkdownParser` - Incremental updates
- `StreamingMarkdownParser` - Streaming parsing

### Options
- `useBatchTokenizer` - Enable batch processing (4-5x faster)
- `useNodePool` - Enable object pooling (10-13x faster)
- `batchSize` - Batch size (default: 16, optimal: 32)
- `plugins` - Array of plugins to apply

### Built-in Plugins
- `addHeadingIds` - Add slugified IDs to headings
- `tableOfContents` - Generate table of contents
- `uppercaseHeadings` - Uppercase all heading text
- `addCodeLineNumbers` - Add line numbers to code blocks
- `removeComments` - Remove HTML comments
- `wrapParagraphs` - Wrap paragraphs with metadata

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
   parser.parse(text, { useBatchTokenizer: true, batchSize: 32 })
   ```

2. **For Repeated Parses**: Enable node pooling
   ```typescript
   parser.parse(text, { useNodePool: true })
   ```

3. **For Edits**: Use incremental parser
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

## License

MIT
