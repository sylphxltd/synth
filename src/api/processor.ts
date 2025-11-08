/**
 * Main processor API
 *
 * Provides a fluent, functional interface for working with ASTs
 */

import type { Tree, Visitor } from '../types/index.js'
import type { Zipper } from '../core/index.js'
import { createTree } from '../types/index.js'
import { traverse } from '../core/index.js'
import { createZipper } from '../core/index.js'

/**
 * Transform function type
 */
export type TransformFn = (tree: Tree) => Tree | Promise<Tree>

/**
 * Plugin function type
 */
export type Plugin = (processor: Processor) => void | Promise<void>

/**
 * Language adapter interface
 * WASM implementations will implement this interface
 */
export interface LanguageAdapter {
  /** Parse source to AST */
  parse(source: string): Tree | Promise<Tree>

  /** Compile AST to source */
  compile(tree: Tree): string | Promise<string>
}

/**
 * Processor - main API entry point
 */
export class Processor {
  private transforms: TransformFn[] = []
  private plugins: Plugin[] = []
  private adapters: Map<string, LanguageAdapter> = new Map()

  /**
   * Register a language adapter
   */
  adapter(language: string, adapter: LanguageAdapter): this {
    this.adapters.set(language, adapter)
    return this
  }

  /**
   * Get a registered adapter
   */
  getAdapter(language: string): LanguageAdapter | undefined {
    return this.adapters.get(language)
  }

  /**
   * Parse source code to AST
   */
  async parse(source: string, language: string): Promise<ProcessorChain> {
    const adapter = this.adapters.get(language)

    let tree: Tree
    if (adapter) {
      tree = await adapter.parse(source)
    } else {
      // Fallback: create empty tree
      tree = createTree(language, source)
    }

    return new ProcessorChain(this, tree)
  }

  /**
   * Use a plugin
   */
  use(plugin: Plugin): this {
    this.plugins.push(plugin)
    return this
  }

  /**
   * Add a transform
   */
  transform(fn: TransformFn): this {
    this.transforms.push(fn)
    return this
  }

  /**
   * Apply all registered transforms to a tree
   */
  async applyTransforms(tree: Tree): Promise<Tree> {
    let result = tree

    for (const transform of this.transforms) {
      result = await transform(result)
    }

    return result
  }

  /**
   * Clone this processor
   */
  clone(): Processor {
    const cloned = new Processor()
    cloned.transforms = [...this.transforms]
    cloned.plugins = [...this.plugins]
    cloned.adapters = new Map(this.adapters)
    return cloned
  }
}

/**
 * Processor chain - allows fluent API after parsing
 */
export class ProcessorChain {
  constructor(
    private processor: Processor,
    private tree: Tree
  ) {}

  /**
   * Get the current tree
   */
  getTree(): Tree {
    return this.tree
  }

  /**
   * Apply a visitor to the tree
   */
  visit(visitor: Visitor): this {
    traverse(this.tree, visitor)
    return this
  }

  /**
   * Transform the tree
   */
  async transform(fn: TransformFn): Promise<this> {
    this.tree = await fn(this.tree)
    return this
  }

  /**
   * Select nodes matching a predicate
   */
  select(_predicate: (node: any) => boolean): any[] {
    // TODO: Implementation will be enhanced
    return []
  }

  /**
   * Get a zipper for functional navigation
   */
  zipper(): Zipper {
    return createZipper(this.tree)
  }

  /**
   * Compile the tree back to source
   */
  async compile(language?: string): Promise<string> {
    const targetLang = language ?? this.tree.meta.language
    const adapter = this.processor.getAdapter(targetLang)

    if (!adapter) {
      throw new Error(`No adapter registered for language: ${targetLang}`)
    }

    return await adapter.compile(this.tree)
  }

  /**
   * Convert to a different language
   */
  async to(language: string): Promise<string> {
    return this.compile(language)
  }
}

/**
 * Create a new processor instance
 */
export function flux(): Processor {
  return new Processor()
}
