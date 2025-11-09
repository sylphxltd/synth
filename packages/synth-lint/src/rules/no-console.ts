/**
 * Rule: no-console
 *
 * Disallows console statements
 * Works across JavaScript, TypeScript, and similar languages
 */

import type { Rule, RuleVisitor } from '../types.js'

export const noConsole: Rule = {
  name: 'no-console',
  description: 'Disallow console statements',
  severity: 'warning',
  enabled: false, // Opt-in rule
  languages: ['javascript', 'typescript', 'jsx', 'tsx'],

  create(context) {
    const visitor: RuleVisitor = {
      enter(node) {
        // Check for console.* calls
        if (isConsoleCall(node, context)) {
          const source = context.getSource(node)
          context.report({
            severity: 'warning',
            message: `Unexpected console statement: ${source}`,
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
 * Check if node is a console call
 */
function isConsoleCall(node: any, context: any): boolean {
  // CallExpression with callee that accesses console
  if (node.type === 'CallExpression' && node.data?.callee) {
    const source = context.getSource(node)
    return source.startsWith('console.')
  }

  // MemberExpression accessing console
  if (node.type === 'MemberExpression' && node.data) {
    if (node.data.object === 'console' || node.data.object?.name === 'console') {
      return true
    }
  }

  return false
}
