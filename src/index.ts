/**
 * Synth - The world's fastest AST processor
 *
 * @example
 * ```typescript
 * import { synth } from '@sylphx/synth'
 *
 * const result = await synth()
 *   .parse('# Hello', 'markdown')
 *   .transform(tree => {
 *     // transform logic
 *     return tree
 *   })
 *   .compile('html')
 * ```
 */

// Core types
export type * from './types/index.js'

// Core engine
export * from './core/index.js'

// Public API
export * from './api/index.js'

// Re-export main entry point
export { flux as synth, flux } from './api/index.js'
