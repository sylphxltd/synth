/**
 * Node Pool for Markdown AST Nodes
 *
 * Reduces GC pressure by reusing node objects
 * Expected gain: 1.5-2x (reduced allocations)
 */

import type { BaseNode } from '@sylphx/ast-core'

/**
 * Generic node pool for reusing objects
 */
export class NodePool<T extends BaseNode> {
  private pool: T[] = []
  private factory: () => T
  private maxSize: number

  constructor(factory: () => T, maxSize = 1000) {
    this.factory = factory
    this.maxSize = maxSize
  }

  /**
   * Get a node from pool or create new one
   */
  acquire(): T {
    return this.pool.pop() || this.factory()
  }

  /**
   * Return node to pool for reuse
   */
  release(node: T): void {
    if (this.pool.length < this.maxSize) {
      // Reset node properties
      this.resetNode(node)
      this.pool.push(node)
    }
  }

  /**
   * Reset node to initial state
   */
  private resetNode(node: T): void {
    node.children = []
    node.parent = 0
    if (node.span) {
      node.span.start = { line: 0, column: 0, offset: 0 }
      node.span.end = { line: 0, column: 0, offset: 0 }
    }
    if (node.data) {
      node.data = {}
    }
  }

  /**
   * Clear entire pool
   */
  clear(): void {
    this.pool = []
  }

  /**
   * Get current pool size
   */
  size(): number {
    return this.pool.length
  }
}

/**
 * Specialized pools for common Markdown node types
 */
export class MarkdownNodePool {
  private headingPool: NodePool<any>
  private paragraphPool: NodePool<any>
  private textPool: NodePool<any>
  private codePool: NodePool<any>
  private listItemPool: NodePool<any>
  private blockquotePool: NodePool<any>
  private emphasisPool: NodePool<any>
  private strongPool: NodePool<any>
  private linkPool: NodePool<any>
  private imagePool: NodePool<any>
  private inlineCodePool: NodePool<any>

  constructor(maxPoolSize = 1000) {
    // Block-level nodes
    this.headingPool = new NodePool(() => this.createHeading(), maxPoolSize)
    this.paragraphPool = new NodePool(() => this.createParagraph(), maxPoolSize)
    this.codePool = new NodePool(() => this.createCode(), maxPoolSize)
    this.listItemPool = new NodePool(() => this.createListItem(), maxPoolSize)
    this.blockquotePool = new NodePool(() => this.createBlockquote(), maxPoolSize)

    // Inline nodes
    this.textPool = new NodePool(() => this.createText(), maxPoolSize)
    this.emphasisPool = new NodePool(() => this.createEmphasis(), maxPoolSize)
    this.strongPool = new NodePool(() => this.createStrong(), maxPoolSize)
    this.linkPool = new NodePool(() => this.createLink(), maxPoolSize)
    this.imagePool = new NodePool(() => this.createImage(), maxPoolSize)
    this.inlineCodePool = new NodePool(() => this.createInlineCode(), maxPoolSize)
  }

  // Factory methods for creating new nodes
  private createHeading(): any {
    return {
      type: 'heading',
      parent: 0,
      children: [],
      span: this.createPosition(),
      data: {},
    }
  }

  private createParagraph(): any {
    return {
      type: 'paragraph',
      parent: 0,
      children: [],
      span: this.createPosition(),
    }
  }

  private createText(): any {
    return {
      type: 'text',
      parent: 0,
      children: [],
      span: this.createPosition(),
      data: { value: '' },
    }
  }

  private createCode(): any {
    return {
      type: 'code',
      parent: 0,
      children: [],
      span: this.createPosition(),
      data: { lang: '', meta: '', value: '' },
    }
  }

  private createListItem(): any {
    return {
      type: 'listItem',
      parent: 0,
      children: [],
      span: this.createPosition(),
      data: {},
    }
  }

  private createBlockquote(): any {
    return {
      type: 'blockquote',
      parent: 0,
      children: [],
      span: this.createPosition(),
    }
  }

  private createEmphasis(): any {
    return {
      type: 'emphasis',
      parent: 0,
      children: [],
      span: this.createPosition(),
    }
  }

  private createStrong(): any {
    return {
      type: 'strong',
      parent: 0,
      children: [],
      span: this.createPosition(),
    }
  }

  private createLink(): any {
    return {
      type: 'link',
      parent: 0,
      children: [],
      span: this.createPosition(),
      data: { url: '' },
    }
  }

  private createImage(): any {
    return {
      type: 'image',
      parent: 0,
      children: [],
      span: this.createPosition(),
      data: { url: '', alt: '' },
    }
  }

  private createInlineCode(): any {
    return {
      type: 'inlineCode',
      parent: 0,
      children: [],
      span: this.createPosition(),
      data: { value: '' },
    }
  }

  private createPosition(): {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  } {
    return {
      start: { line: 0, column: 0, offset: 0 },
      end: { line: 0, column: 0, offset: 0 },
    }
  }

  /**
   * Acquire node from appropriate pool
   */
  acquire(type: string): any {
    switch (type) {
      case 'heading':
        return this.headingPool.acquire()
      case 'paragraph':
        return this.paragraphPool.acquire()
      case 'text':
        return this.textPool.acquire()
      case 'code':
        return this.codePool.acquire()
      case 'listItem':
        return this.listItemPool.acquire()
      case 'blockquote':
        return this.blockquotePool.acquire()
      case 'emphasis':
        return this.emphasisPool.acquire()
      case 'strong':
        return this.strongPool.acquire()
      case 'link':
        return this.linkPool.acquire()
      case 'image':
        return this.imagePool.acquire()
      case 'inlineCode':
        return this.inlineCodePool.acquire()
      default:
        // Fallback for unsupported types
        return {
          type,
          parent: 0,
          children: [],
          span: this.createPosition(),
        }
    }
  }

  /**
   * Release node back to appropriate pool
   */
  release(node: any): void {
    switch (node.type) {
      case 'heading':
        this.headingPool.release(node)
        break
      case 'paragraph':
        this.paragraphPool.release(node)
        break
      case 'text':
        this.textPool.release(node)
        break
      case 'code':
        this.codePool.release(node)
        break
      case 'listItem':
        this.listItemPool.release(node)
        break
      case 'blockquote':
        this.blockquotePool.release(node)
        break
      case 'emphasis':
        this.emphasisPool.release(node)
        break
      case 'strong':
        this.strongPool.release(node)
        break
      case 'link':
        this.linkPool.release(node)
        break
      case 'image':
        this.imagePool.release(node)
        break
      case 'inlineCode':
        this.inlineCodePool.release(node)
        break
    }
  }

  /**
   * Release all nodes in a tree
   */
  releaseTree(nodes: BaseNode[]): void {
    for (const node of nodes) {
      this.release(node)
    }
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.headingPool.clear()
    this.paragraphPool.clear()
    this.textPool.clear()
    this.codePool.clear()
    this.listItemPool.clear()
    this.blockquotePool.clear()
    this.emphasisPool.clear()
    this.strongPool.clear()
    this.linkPool.clear()
    this.imagePool.clear()
    this.inlineCodePool.clear()
  }

  /**
   * Get pool statistics
   */
  stats(): Record<string, number> {
    return {
      heading: this.headingPool.size(),
      paragraph: this.paragraphPool.size(),
      text: this.textPool.size(),
      code: this.codePool.size(),
      listItem: this.listItemPool.size(),
      blockquote: this.blockquotePool.size(),
      emphasis: this.emphasisPool.size(),
      strong: this.strongPool.size(),
      link: this.linkPool.size(),
      image: this.imagePool.size(),
      inlineCode: this.inlineCodePool.size(),
    }
  }
}

/**
 * Global node pool instance
 */
let globalPool: MarkdownNodePool | null = null

/**
 * Get or create global node pool
 */
export function getGlobalNodePool(): MarkdownNodePool {
  if (!globalPool) {
    globalPool = new MarkdownNodePool()
  }
  return globalPool
}

/**
 * Create a new isolated node pool
 */
export function createNodePool(maxPoolSize?: number): MarkdownNodePool {
  return new MarkdownNodePool(maxPoolSize)
}
