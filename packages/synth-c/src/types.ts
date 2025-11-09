/**
 * Type definitions for C parser
 */

import type { Plugin } from '@sylphx/synth'

export interface CParseOptions {
  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]

  /** C standard compatibility (default: 'c11') */
  standard?: 'c99' | 'c11' | 'c17' | 'c23'
}
