/**
 * Rule: no-empty-blocks
 *
 * Disallows empty blocks across all languages
 * Works on any node type that can have children
 */

import type { Rule, RuleVisitor } from '../types.js'

export const noEmptyBlocks: Rule = {
  name: 'no-empty-blocks',
  description: 'Disallow empty blocks',
  severity: 'warning',
  enabled: true,

  create(context) {
    const visitor: RuleVisitor = {
      enter(node) {
        // Check for empty blocks
        // A block is considered empty if it has no children and is typically a container node
        if (node.children.length === 0 && isBlockNode(node.type)) {
          context.report({
            severity: 'warning',
            message: `Empty ${node.type} block`,
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
 * Check if a node type represents a block/container
 */
function isBlockNode(type: string): boolean {
  const blockTypes = [
    // Generic
    'block',
    'body',
    'BlockStatement',

    // JavaScript/TypeScript
    'FunctionBody',
    'ClassBody',
    'ObjectExpression',
    'ArrayExpression',

    // CSS
    'Block',
    'Rule',

    // HTML/XML
    'Element',

    // Markdown
    'blockquote',
    'list',

    // Go
    'BlockStmt',

    // Rust
    'block_expr',

    // Python
    'block',
    'suite',
  ]

  return blockTypes.some((pattern) =>
    type.toLowerCase().includes(pattern.toLowerCase())
  )
}
