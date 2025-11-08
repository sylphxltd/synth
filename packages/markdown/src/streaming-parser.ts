/**
 * Streaming Markdown Parser
 *
 * Enables processing of large Markdown documents in chunks without loading
 * the entire file into memory.
 *
 * Features:
 * - Event-driven API for incremental processing
 * - Memory-efficient chunk-based parsing
 * - Support for Node.js streams and AsyncIterables
 * - Configurable chunk size and backpressure handling
 */

import { EventEmitter } from 'events'
import type { Tree, BaseNode } from '@sylphx/ast-core'
import { UltraOptimizedMarkdownParser, type ParseOptions } from './ultra-optimized-parser.js'

/**
 * Streaming parser options
 */
export interface StreamingOptions {
  /**
   * Chunk size for processing (in characters)
   * @default 4096
   */
  chunkSize?: number

  /**
   * Parse options passed to underlying parser
   */
  parseOptions?: ParseOptions

  /**
   * Emit nodes as soon as they're parsed
   * @default true
   */
  emitNodes?: boolean

  /**
   * High water mark for backpressure
   * @default 16
   */
  highWaterMark?: number
}

/**
 * Events emitted by streaming parser
 */
export interface StreamingParserEvents {
  /** Emitted when a node is parsed */
  node: (node: BaseNode) => void

  /** Emitted when parsing is complete */
  end: (tree: Tree) => void

  /** Emitted on error */
  error: (error: Error) => void

  /** Emitted when parser is ready for more data */
  drain: () => void

  /** Emitted on each chunk processed */
  chunk: (text: string, index: number) => void
}

/**
 * Streaming Markdown Parser
 *
 * Usage:
 * ```typescript
 * const stream = new StreamingMarkdownParser()
 *
 * stream.on('node', (node) => {
 *   console.log('Parsed node:', node.type)
 * })
 *
 * stream.on('end', (tree) => {
 *   console.log('Parsing complete:', tree)
 * })
 *
 * stream.write('# Hello\n')
 * stream.write('\n')
 * stream.write('World\n')
 * stream.end()
 * ```
 */
export class StreamingMarkdownParser extends EventEmitter {
  private buffer: string = ''
  private parser: UltraOptimizedMarkdownParser
  private options: Required<StreamingOptions>
  private ended = false
  private nodeQueue: BaseNode[] = []
  private processing = false
  private chunkIndex = 0

  constructor(options: StreamingOptions = {}) {
    super()

    this.options = {
      chunkSize: options.chunkSize ?? 4096,
      parseOptions: options.parseOptions ?? {},
      emitNodes: options.emitNodes ?? true,
      highWaterMark: options.highWaterMark ?? 16,
    }

    this.parser = new UltraOptimizedMarkdownParser()
  }

  /**
   * Write data to the parser
   */
  write(chunk: string): boolean {
    if (this.ended) {
      this.emit('error', new Error('Cannot write after end'))
      return false
    }

    this.buffer += chunk

    // Process chunks if buffer exceeds chunk size
    if (this.buffer.length >= this.options.chunkSize) {
      this.processChunks()
    }

    // Apply backpressure if queue is too large
    return this.nodeQueue.length < this.options.highWaterMark
  }

  /**
   * Signal end of input and flush remaining buffer
   */
  async end(): Promise<void> {
    if (this.ended) {
      return
    }

    this.ended = true

    try {
      let tree: Tree

      // Process any remaining data in buffer
      if (this.buffer.length > 0) {
        // Emit final chunk event for progress tracking
        this.emit('chunk', this.buffer, this.chunkIndex++)

        tree = await this.parser.parseAsync(this.buffer, this.options.parseOptions)

        if (this.options.emitNodes) {
          this.visitNodes(tree.nodes[0]!, tree)
        }

        // Clear the buffer after processing
        this.buffer = ''
      } else {
        // Empty document - create empty tree
        tree = this.parser.parse('', this.options.parseOptions)
      }

      // Emit any remaining nodes
      this.flushQueue()

      // Always emit 'end' event with final tree
      this.emit('end', tree)
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Process chunks from buffer
   */
  private processChunks(): void {
    if (this.processing) {
      return
    }

    this.processing = true

    try {
      // Find natural break points (double newlines for blocks)
      const chunks = this.findChunks()

      for (const chunk of chunks) {
        this.emit('chunk', chunk, this.chunkIndex++)
        this.parseChunk(chunk)
      }
    } finally {
      this.processing = false
    }

    // Emit drain if backpressure was applied
    if (this.nodeQueue.length < this.options.highWaterMark) {
      this.emit('drain')
    }
  }

  /**
   * Find natural chunk boundaries (paragraph breaks)
   */
  private findChunks(): string[] {
    const chunks: string[] = []
    let lastBreak = 0

    // Find double newlines (paragraph boundaries)
    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i] === '\n' && this.buffer[i + 1] === '\n') {
        const chunk = this.buffer.slice(lastBreak, i + 2)
        if (chunk.trim().length > 0) {
          chunks.push(chunk)
        }
        lastBreak = i + 2
      }
    }

    // Keep remaining data in buffer
    this.buffer = this.buffer.slice(lastBreak)

    return chunks
  }

  /**
   * Parse a single chunk
   */
  private parseChunk(text: string): void {
    try {
      const tree = this.parser.parse(text, this.options.parseOptions)

      if (this.options.emitNodes) {
        // Emit each node individually
        this.visitNodes(tree.nodes[0]!, tree)
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Visit nodes and emit them
   */
  private visitNodes(node: BaseNode, tree: Tree): void {
    // Emit this node
    this.nodeQueue.push(node)

    if (this.nodeQueue.length >= this.options.highWaterMark) {
      this.flushQueue()
    }

    // Visit children
    for (const childId of node.children) {
      const child = tree.nodes[childId]
      if (child) {
        this.visitNodes(child, tree)
      }
    }
  }

  /**
   * Flush node queue
   */
  private flushQueue(): void {
    while (this.nodeQueue.length > 0) {
      const node = this.nodeQueue.shift()!
      this.emit('node', node)
    }
  }

  /**
   * Pipe from an async iterable (e.g., file stream)
   */
  static async fromIterable(
    iterable: AsyncIterable<string> | Iterable<string>,
    options?: StreamingOptions
  ): Promise<Tree> {
    const parser = new StreamingMarkdownParser(options)

    return new Promise((resolve, reject) => {
      parser.on('error', reject)
      parser.on('end', resolve)

      ;(async () => {
        try {
          for await (const chunk of iterable) {
            const canWrite = parser.write(chunk)
            if (!canWrite) {
              // Wait for drain event if backpressure applied
              await new Promise<void>((resolveDrain) => {
                parser.once('drain', resolveDrain)
              })
            }
          }
          await parser.end()
        } catch (error) {
          parser.emit('error', error instanceof Error ? error : new Error(String(error)))
        }
      })()
    })
  }

  /**
   * Parse a string in streaming mode
   */
  static async fromString(text: string, options?: StreamingOptions): Promise<Tree> {
    const parser = new StreamingMarkdownParser(options)

    return new Promise((resolve, reject) => {
      parser.on('error', reject)
      parser.on('end', resolve)

      const chunkSize = options?.chunkSize ?? 4096
      let offset = 0

      const writeNext = () => {
        if (offset >= text.length) {
          parser.end()
          return
        }

        const chunk = text.slice(offset, offset + chunkSize)
        offset += chunkSize

        const canWrite = parser.write(chunk)
        if (canWrite) {
          // Use setImmediate to allow event loop to process
          setImmediate(writeNext)
        } else {
          // Wait for drain
          parser.once('drain', writeNext)
        }
      }

      writeNext()
    })
  }

  /**
   * Create a transform stream for Node.js streams
   */
  static createTransform(options?: StreamingOptions): NodeJS.ReadWriteStream {
    const parser = new StreamingMarkdownParser(options)
    let outputTree: Tree | null = null

    const stream = new (require('stream').Transform)({
      objectMode: true,
      transform(chunk: Buffer, _encoding: string, callback: (error?: Error) => void) {
        try {
          parser.write(chunk.toString())
          callback()
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)))
        }
      },
      async flush(callback: (error?: Error, data?: Tree) => void) {
        try {
          await parser.end()
          callback(undefined, outputTree || undefined)
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)))
        }
      },
    })

    // Forward events
    parser.on('node', (node) => stream.emit('node', node))
    parser.on('error', (error) => stream.emit('error', error))
    parser.on('end', (tree) => {
      outputTree = tree
      stream.emit('tree', tree)
    })

    return stream
  }
}

/**
 * Helper function to parse large files in streaming mode
 *
 * @example
 * ```typescript
 * import { createReadStream } from 'fs'
 * import { parseStream } from './streaming-parser.js'
 *
 * const fileStream = createReadStream('large-file.md', { encoding: 'utf8' })
 * const tree = await parseStream(fileStream)
 * console.log('Parsed large file:', tree)
 * ```
 */
export async function parseStream(
  stream: AsyncIterable<string> | NodeJS.ReadableStream,
  options?: StreamingOptions
): Promise<Tree> {
  // Convert Node.js stream to async iterable if needed
  const iterable = Symbol.asyncIterator in stream
    ? (stream as AsyncIterable<string>)
    : streamToAsyncIterable(stream as NodeJS.ReadableStream)

  return StreamingMarkdownParser.fromIterable(iterable, options)
}

/**
 * Convert Node.js readable stream to async iterable
 */
async function* streamToAsyncIterable(stream: NodeJS.ReadableStream): AsyncIterable<string> {
  const reader = stream as any

  for await (const chunk of reader) {
    yield chunk.toString()
  }
}

/**
 * Parse with progress callback
 *
 * @example
 * ```typescript
 * const tree = await parseWithProgress(largeMarkdown, (progress) => {
 *   console.log(`Progress: ${progress.percent}%`)
 * })
 * ```
 */
export async function parseWithProgress(
  text: string,
  onProgress: (progress: { processed: number; total: number; percent: number }) => void,
  options?: StreamingOptions
): Promise<Tree> {
  const parser = new StreamingMarkdownParser(options)
  const total = text.length
  let processed = 0

  return new Promise((resolve, reject) => {
    parser.on('chunk', (chunk) => {
      processed += chunk.length
      onProgress({
        processed,
        total,
        percent: Math.round((processed / total) * 100),
      })
    })

    parser.on('error', reject)
    parser.on('end', resolve)

    const chunkSize = options?.chunkSize ?? 4096
    let offset = 0

    const writeNext = () => {
      if (offset >= text.length) {
        parser.end()
        return
      }

      const chunk = text.slice(offset, offset + chunkSize)
      offset += chunkSize

      const canWrite = parser.write(chunk)
      if (canWrite) {
        setImmediate(writeNext)
      } else {
        parser.once('drain', writeNext)
      }
    }

    writeNext()
  })
}
