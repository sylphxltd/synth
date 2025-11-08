/**
 * Markdown compiler - converts AST back to markdown
 */

import type { Tree, BaseNode } from '../../types/index.js'
import { getChildren } from '../../types/index.js'

/**
 * Compile AST to markdown
 */
export function compile(tree: Tree): string {
  const output: string[] = []

  const rootChildren = getChildren(tree, tree.root)

  for (const child of rootChildren) {
    const markdown = nodeToMarkdown(tree, child)
    if (markdown) {
      output.push(markdown)
    }
  }

  return output.join('\n')
}

/**
 * Convert a node to markdown
 */
function nodeToMarkdown(tree: Tree, node: BaseNode): string {
  switch (node.type) {
    case 'heading': {
      const depth = (node.data?.['depth'] as number) ?? 1
      const children = getChildren(tree, node.id)
      const text = children.map(c => nodeToMarkdown(tree, c)).join('')
      return '#'.repeat(depth) + ' ' + text
    }

    case 'paragraph': {
      const children = getChildren(tree, node.id)
      return children.map(c => nodeToMarkdown(tree, c)).join('')
    }

    case 'text': {
      return (node.data?.['value'] as string) ?? ''
    }

    case 'listItem': {
      const children = getChildren(tree, node.id)
      const text = children.map(c => nodeToMarkdown(tree, c)).join('')
      return '- ' + text
    }

    case 'emphasis': {
      const children = getChildren(tree, node.id)
      const text = children.map(c => nodeToMarkdown(tree, c)).join('')
      return '*' + text + '*'
    }

    case 'strong': {
      const children = getChildren(tree, node.id)
      const text = children.map(c => nodeToMarkdown(tree, c)).join('')
      return '**' + text + '**'
    }

    case 'code': {
      const value = (node.data?.['value'] as string) ?? ''
      const lang = (node.data?.['lang'] as string) ?? ''
      return '```' + lang + '\n' + value + '\n```'
    }

    case 'link': {
      const url = (node.data?.['url'] as string) ?? ''
      const children = getChildren(tree, node.id)
      const text = children.map(c => nodeToMarkdown(tree, c)).join('')
      return '[' + text + '](' + url + ')'
    }

    default:
      return ''
  }
}
