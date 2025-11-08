/**
 * @sylphx/synth-md-mermaid
 *
 * Mermaid diagram support for Synth Markdown parser
 *
 * Detects and processes Mermaid code blocks:
 * ```mermaid
 * graph TD
 *   A --> B
 * ```
 */

import { createTransformPlugin } from '@sylphx/synth'
import type { BaseNode } from '@sylphx/synth'
import type { CodeBlockNode } from '@sylphx/synth-md'

export interface MermaidNode extends BaseNode {
  type: 'mermaid'
  value: string
  data?: {
    diagram?: string
    svg?: string
  }
}

export interface MermaidPluginOptions {
  /**
   * Validate Mermaid syntax (default: false)
   */
  validate?: boolean

  /**
   * Pre-render to SVG (default: false)
   */
  prerender?: boolean

  /**
   * Custom theme
   */
  theme?: 'default' | 'dark' | 'forest' | 'neutral'
}

/**
 * Mermaid plugin for Synth Markdown
 *
 * Transforms code blocks with language 'mermaid' into Mermaid diagram nodes
 *
 * @example
 * ```typescript
 * import { UltraOptimizedMarkdownParser } from '@sylphx/synth-md'
 * import { mermaidPlugin } from '@sylphx/synth-md-mermaid'
 *
 * const parser = new UltraOptimizedMarkdownParser()
 * const tree = parser.parse(markdown, { plugins: [mermaidPlugin()] })
 * ```
 */
export function mermaidPlugin(_options: MermaidPluginOptions = {}) {
  return createTransformPlugin(
    {
      name: 'mermaid',
      version: '0.1.0',
      description: 'Process Mermaid diagram code blocks'
    },
    (tree) => {
      // Find all code blocks with language 'mermaid'
      const nodes = tree.nodes.filter(
        node => node.type === 'codeBlock' && (node as CodeBlockNode).lang === 'mermaid'
      )

      for (const node of nodes) {
        const codeNode = node as CodeBlockNode
        const mermaidNode: MermaidNode = {
          ...codeNode,
          type: 'mermaid',
          value: codeNode.code,
          data: {
            diagram: codeNode.code,
          }
        }

        // Replace in tree
        const index = tree.nodes.indexOf(node)
        if (index !== -1) {
          tree.nodes[index] = mermaidNode as any
        }
      }

      return tree
    }
  )
}
