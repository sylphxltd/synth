/**
 * JavaScript Code Formatter
 *
 * Prettier-style formatting for JavaScript/TypeScript
 */

import type { Tree } from '@sylphx/synth'
import { parse } from '@sylphx/synth-js'
import { Printer } from './printer.js'
import type { FormatOptions } from './options.js'

export class Formatter {
  private options: FormatOptions

  constructor(options: FormatOptions = {}) {
    this.options = options
  }

  /**
   * Format JavaScript code
   */
  format(code: string, options?: FormatOptions): string {
    const opts = { ...this.options, ...options }

    // Parse code to AST
    const tree = parse(code)

    // Format AST back to code
    return this.formatTree(tree, opts)
  }

  /**
   * Format a Synth tree
   */
  formatTree(tree: Tree, options?: FormatOptions): string {
    const opts = { ...this.options, ...options }
    const printer = new Printer(opts)
    return printer.print(tree)
  }

  /**
   * Check if code is formatted
   */
  check(code: string, options?: FormatOptions): boolean {
    const formatted = this.format(code, options)
    return code === formatted
  }
}

/**
 * Format JavaScript code (standalone function)
 */
export function format(code: string, options?: FormatOptions): string {
  const formatter = new Formatter(options)
  return formatter.format(code)
}

/**
 * Check if code is formatted (standalone function)
 */
export function check(code: string, options?: FormatOptions): boolean {
  const formatter = new Formatter(options)
  return formatter.check(code, options)
}
