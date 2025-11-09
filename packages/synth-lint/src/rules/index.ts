/**
 * Built-in lint rules
 */

export { noEmptyBlocks } from './no-empty-blocks.js'
export { noConsole } from './no-console.js'
export { maxDepth } from './max-depth.js'

import { noEmptyBlocks } from './no-empty-blocks.js'
import { noConsole } from './no-console.js'
import { maxDepth } from './max-depth.js'

/**
 * All built-in rules
 */
export const builtinRules = [noEmptyBlocks, noConsole, maxDepth]
