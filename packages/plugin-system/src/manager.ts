/**
 * Generic Plugin Manager
 */

import type { Tree } from '@sylphx/ast-core'
import type { Plugin } from './plugin.js'
import { isTransformPlugin, isVisitorPlugin } from './plugin.js'

/**
 * Plugin manager for composing and executing plugins
 */
export class PluginManager {
  private plugins: Plugin[] = []

  /**
   * Register a plugin
   */
  use(plugin: Plugin): this {
    this.plugins.push(plugin)
    return this
  }

  /**
   * Register multiple plugins
   */
  useAll(plugins: Plugin[]): this {
    this.plugins.push(...plugins)
    return this
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins]
  }

  /**
   * Get plugins by type
   */
  getPluginsByType<T extends Plugin>(predicate: (plugin: Plugin) => plugin is T): T[] {
    return this.plugins.filter(predicate)
  }

  /**
   * Apply all transform plugins to a tree
   */
  async applyTransforms(tree: Tree): Promise<Tree> {
    let result = tree
    const transformPlugins = this.getPluginsByType(isTransformPlugin)

    for (const plugin of transformPlugins) {
      result = await plugin.transform(result)
    }

    return result
  }

  /**
   * Apply all visitor plugins to a tree
   * Subclasses should override this to implement language-specific visiting
   */
  async applyVisitors(tree: Tree): Promise<Tree> {
    let result = tree
    const visitorPlugins = this.getPluginsByType(isVisitorPlugin)

    for (const plugin of visitorPlugins) {
      if (plugin.setup) {
        await plugin.setup(result)
      }

      // Language-specific visitor application
      result = this.visitTree(result, plugin.visitors)

      if (plugin.teardown) {
        await plugin.teardown(result)
      }
    }

    return result
  }

  /**
   * Apply all plugins to a tree
   */
  async apply(tree: Tree): Promise<Tree> {
    let result = tree
    result = await this.applyTransforms(result)
    result = await this.applyVisitors(result)
    return result
  }

  /**
   * Visit tree with visitors - can be overridden by subclasses
   */
  protected visitTree(tree: Tree, visitors: Record<string, (node: any) => any>): Tree {
    // Default implementation - traverse and apply visitors
    const visitNode = (node: any): any => {
      const visitor = visitors[node.type]
      if (visitor) {
        const result = visitor(node)
        if (result) {
          node = result
        }
      }

      // Visit children
      if (node.children && node.children.length > 0) {
        for (let i = 0; i < node.children.length; i++) {
          const childId = node.children[i]
          if (childId !== undefined) {
            const child = tree.nodes[childId]
            if (child) {
              const visited = visitNode(child)
              tree.nodes[childId] = visited
            }
          }
        }
      }

      return node
    }

    const root = tree.nodes[tree.root]
    if (root) {
      tree.nodes[tree.root] = visitNode(root)
    }

    return tree
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins = []
  }

  /**
   * Remove a plugin by name
   */
  remove(name: string): boolean {
    const index = this.plugins.findIndex((p) => p.meta.name === name)
    if (index !== -1) {
      this.plugins.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.some((p) => p.meta.name === name)
  }
}
