/**
 * Markdown adapter
 */

import type { LanguageAdapter } from '../../api/index.js'
import type { Tree } from '../../types/index.js'
import { parse } from './parser.js'
import { compile } from './compiler.js'

export * from './types.js'

/**
 * Markdown language adapter
 */
export class MarkdownAdapter implements LanguageAdapter {
  async parse(source: string): Promise<Tree> {
    return parse(source)
  }

  async compile(tree: Tree): Promise<string> {
    return compile(tree)
  }
}

/**
 * Create a markdown adapter instance
 */
export function markdown(): MarkdownAdapter {
  return new MarkdownAdapter()
}
