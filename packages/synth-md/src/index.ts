/**
 * @sylphx/synth-md
 *
 * High-performance Markdown parser - 26-42x faster than remark
 *
 * Features:
 * - Ultra-fast parsing (26-42x faster than remark)
 * - Batch processing (4-5x faster tokenization)
 * - Object pooling (10-13x faster for repeated parses)
 * - Incremental parsing (10-100x faster for edits)
 * - Streaming support
 * - Full GFM support
 * - Plugin system
 */

// Export types
export * from './types.js'
export * from './tokens.js'

// Export main parser
export { Parser, createParser, parse } from './parser.js'
export type { ParseOptions } from './parser.js'

// Export incremental parser
export { IncrementalMarkdownParser, detectEdit, calculateEditDistance, shouldUseIncremental } from './incremental-parser.js'
export type { Edit } from './incremental-parser.js'

// Export streaming parser
export { StreamingMarkdownParser } from './streaming-parser.js'

// Export plugin system
export * from './plugin.js'

// Export tokenizers (for advanced use)
export { Tokenizer } from './tokenizer.js'
export { InlineTokenizer } from './inline-tokenizer.js'
export { BatchTokenizer } from './batch-tokenizer.js'

// Export node pool
export { NodePool, MarkdownNodePool, getGlobalNodePool, createNodePool } from './node-pool.js'
