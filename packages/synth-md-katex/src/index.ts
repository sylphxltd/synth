/**
 * @sylphx/synth-md-katex
 *
 * KaTeX math rendering support for Synth Markdown parser
 *
 * Supports inline math: $E = mc^2$
 * And block math:
 * $$
 * \frac{-b \pm \sqrt{b^2-4ac}}{2a}
 * $$
 */

import { createTransformPlugin } from '@sylphx/synth'
import type { BaseNode } from '@sylphx/synth'

export interface MathNode extends BaseNode {
  type: 'math'
  value: string
  inline: boolean
  data?: {
    latex?: string
    html?: string
  }
}

export interface KatexPluginOptions {
  /**
   * Enable inline math with $ delimiters (default: true)
   */
  inlineMath?: boolean

  /**
   * Enable block math with $$ delimiters (default: true)
   */
  blockMath?: boolean

  /**
   * Throw on error (default: false)
   */
  throwOnError?: boolean

  /**
   * Render math to HTML (default: false)
   */
  prerender?: boolean
}

/**
 * KaTeX plugin for Synth Markdown
 *
 * Detects and processes LaTeX math expressions
 * - Inline: $...$
 * - Block: $$...$$
 *
 * @example
 * ```typescript
 * import { UltraOptimizedMarkdownParser } from '@sylphx/synth-md'
 * import { katexPlugin } from '@sylphx/synth-md-katex'
 *
 * const parser = new UltraOptimizedMarkdownParser()
 * const tree = parser.parse(markdown, { plugins: [katexPlugin()] })
 * ```
 */
export function katexPlugin(options: KatexPluginOptions = {}) {
  const {
    inlineMath = true,
    blockMath = true,
  } = options

  return createTransformPlugin(
    {
      name: 'katex',
      version: '0.1.0',
      description: 'Process KaTeX math expressions'
    },
    (tree) => {
      const mathNodes: MathNode[] = []

      // Process text nodes for inline/block math
      for (const node of tree.nodes) {
        if (node.type === 'text' || node.type === 'paragraph') {
          const text = (node as any).value || (node as any).text || ''

          // Find block math $$...$$
          if (blockMath) {
            const blockRegex = /\$\$([\s\S]+?)\$\$/g
            let match: RegExpExecArray | null
            while ((match = blockRegex.exec(text)) !== null) {
              if (match[1]) {
                mathNodes.push({
                  ...node,
                  type: 'math',
                  value: match[1].trim(),
                  inline: false,
                  data: {
                    latex: match[1].trim()
                  }
                } as MathNode)
              }
            }
          }

          // Find inline math $...$
          if (inlineMath) {
            const inlineRegex = /\$([^\$\n]+?)\$/g
            let match: RegExpExecArray | null
            while ((match = inlineRegex.exec(text)) !== null) {
              if (match[1]) {
                mathNodes.push({
                  ...node,
                  type: 'math',
                  value: match[1],
                  inline: true,
                  data: {
                    latex: match[1]
                  }
                } as MathNode)
              }
            }
          }
        }
      }

      // Add math nodes to tree metadata
      if (!tree.meta?.data) {
        tree.meta = {
          ...tree.meta,
          data: {
            ...tree.meta?.data,
            mathExpressions: mathNodes
          }
        }
      } else {
        tree.meta.data.mathExpressions = mathNodes
      }

      return tree
    }
  )
}
