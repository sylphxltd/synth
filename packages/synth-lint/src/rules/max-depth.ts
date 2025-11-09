/**
 * Rule: max-depth
 *
 * Enforces maximum nesting depth
 * Works across all languages - language-agnostic complexity check
 */

import type { Rule, RuleVisitor } from '../types.js'

const DEFAULT_MAX_DEPTH = 4

export const maxDepth: Rule = {
  name: 'max-depth',
  description: 'Enforce maximum nesting depth',
  severity: 'warning',
  enabled: true,

  create(context) {
    const maxDepth = DEFAULT_MAX_DEPTH
    const depthStack: number[] = [0]

    const visitor: RuleVisitor = {
      enter(node) {
        // Calculate depth from root
        const depth = getDepth(node, context)

        if (depth > maxDepth) {
          context.report({
            severity: 'warning',
            message: `Nesting depth of ${depth} exceeds maximum allowed depth of ${maxDepth}`,
            range: node.span,
            nodeId: node.id,
          })
        }
      },
    }

    return visitor
  },
}

/**
 * Get nesting depth of a node
 */
function getDepth(node: any, context: any): number {
  let depth = 0
  let current = node

  while (current.parent !== null) {
    depth++
    current = context.getParent(current.id)
    if (!current) break
  }

  return depth
}
