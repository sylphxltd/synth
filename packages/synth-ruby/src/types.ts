/**
 * Type definitions for Ruby parser
 */

import type { Plugin } from '@sylphx/synth'

export interface RubyParseOptions {
  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]

  /** Ruby version compatibility (default: 3) */
  rubyVersion?: 2 | 3
}
