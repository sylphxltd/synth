/**
 * Type definitions for Java parser
 */

import type { Plugin } from '@sylphx/synth'

export interface JavaParseOptions {
  /** Build query index for AST */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]

  /** Java version compatibility (default: 17) */
  javaVersion?: 8 | 11 | 17 | 21
}
