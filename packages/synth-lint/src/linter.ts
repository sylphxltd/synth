/**
 * Universal linter implementation
 */

import type { Tree, Node, NodeId } from '@sylphx/synth'
import type {
  Rule,
  RuleContext,
  RuleVisitor,
  Diagnostic,
  DiagnosticSeverity,
  LinterConfig,
  LintResult,
  Range,
} from './types.js'

/**
 * Universal linter for Synth AST
 */
export class Linter {
  private rules: Map<string, Rule> = new Map()
  private config: LinterConfig = {}

  /**
   * Register a rule
   */
  addRule(rule: Rule): this {
    this.rules.set(rule.name, rule)
    return this
  }

  /**
   * Register multiple rules
   */
  addRules(rules: Rule[]): this {
    for (const rule of rules) {
      this.addRule(rule)
    }
    return this
  }

  /**
   * Configure the linter
   */
  configure(config: LinterConfig): this {
    this.config = { ...this.config, ...config }
    return this
  }

  /**
   * Lint a tree
   */
  lint(tree: Tree): LintResult {
    const diagnostics: Diagnostic[] = []
    const language = tree.meta.language

    // Filter rules based on config and language
    const activeRules = this.getActiveRules(language)

    // Execute each rule
    for (const rule of activeRules) {
      const ruleDiagnostics = this.executeRule(rule, tree)
      diagnostics.push(...ruleDiagnostics)
    }

    // Filter by severity if configured
    const filteredDiagnostics = this.filterBySeverity(diagnostics)

    // Count diagnostics by severity
    const counts = {
      error: 0,
      warning: 0,
      info: 0,
      hint: 0,
    }

    for (const diagnostic of filteredDiagnostics) {
      counts[diagnostic.severity]++
    }

    return {
      diagnostics: filteredDiagnostics,
      counts,
      success: counts.error === 0,
    }
  }

  /**
   * Get active rules based on configuration
   */
  private getActiveRules(language: string): Rule[] {
    const activeRules: Rule[] = []

    for (const [name, rule] of this.rules) {
      // Check if rule is enabled in config
      const configValue = this.config.rules?.[name]
      const isEnabled =
        configValue === true ||
        (configValue !== false && rule.enabled !== false)

      if (!isEnabled) continue

      // Check if rule applies to this language
      if (rule.languages && rule.languages.length > 0) {
        if (!rule.languages.includes(language)) continue
      }

      // Check if language is in config filter
      if (this.config.languages && this.config.languages.length > 0) {
        if (!this.config.languages.includes(language)) continue
      }

      activeRules.push(rule)
    }

    return activeRules
  }

  /**
   * Execute a single rule on the tree
   */
  private executeRule(rule: Rule, tree: Tree): Diagnostic[] {
    const diagnostics: Diagnostic[] = []

    // Create context
    const context: RuleContext = {
      tree,
      report: (diagnostic) => {
        // Get severity from config or rule default
        const configSeverity = this.config.rules?.[rule.name]
        const severity =
          typeof configSeverity === 'string'
            ? configSeverity
            : diagnostic.severity || rule.severity

        diagnostics.push({
          ...diagnostic,
          rule: rule.name,
          severity,
        })
      },
      getNode: (id) => tree.nodes[id],
      getParent: (id) => {
        const node = tree.nodes[id]
        if (!node || node.parent === null) return undefined
        return tree.nodes[node.parent]
      },
      getChildren: (id) => {
        const node = tree.nodes[id]
        if (!node) return []
        return node.children.map((childId) => tree.nodes[childId]!).filter(Boolean)
      },
      getSource: (node) => {
        if (!node.span || !tree.meta.source) return ''
        return tree.meta.source.slice(node.span.start.offset, node.span.end.offset)
      },
      getSourceRange: (range) => {
        if (!tree.meta.source) return ''
        return tree.meta.source.slice(range.start.offset, range.end.offset)
      },
    }

    // Create visitor
    const visitor = rule.create(context)

    // Traverse tree
    this.traverse(tree, tree.root, visitor, context, rule)

    return diagnostics
  }

  /**
   * Traverse the AST and call visitor methods
   */
  private traverse(
    tree: Tree,
    nodeId: NodeId,
    visitor: RuleVisitor,
    context: RuleContext,
    rule: Rule
  ): void {
    const node = tree.nodes[nodeId]
    if (!node) return

    // Check if rule applies to this node type
    if (rule.nodeTypes && rule.nodeTypes.length > 0) {
      if (!rule.nodeTypes.includes(node.type)) {
        // Still traverse children
        for (const childId of node.children) {
          this.traverse(tree, childId, visitor, context, rule)
        }
        return
      }
    }

    // Call enter callback
    if (visitor.enter) {
      visitor.enter(node, context)
    }

    // Call type-specific callback
    const typeCallback = visitor[node.type]
    if (typeCallback && typeof typeCallback === 'function') {
      typeCallback(node, context)
    }

    // Traverse children
    for (const childId of node.children) {
      this.traverse(tree, childId, visitor, context, rule)
    }

    // Call leave callback
    if (visitor.leave) {
      visitor.leave(node, context)
    }
  }

  /**
   * Filter diagnostics by configured severity level
   */
  private filterBySeverity(diagnostics: Diagnostic[]): Diagnostic[] {
    if (!this.config.severity) return diagnostics

    const severityOrder: DiagnosticSeverity[] = ['error', 'warning', 'info', 'hint']
    const minSeverityIndex = severityOrder.indexOf(this.config.severity)

    return diagnostics.filter((diagnostic) => {
      const diagnosticIndex = severityOrder.indexOf(diagnostic.severity)
      return diagnosticIndex <= minSeverityIndex
    })
  }

  /**
   * Get all registered rules
   */
  getRules(): Rule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get a specific rule
   */
  getRule(name: string): Rule | undefined {
    return this.rules.get(name)
  }
}

/**
 * Create a new linter instance
 */
export function createLinter(config?: LinterConfig): Linter {
  const linter = new Linter()
  if (config) {
    linter.configure(config)
  }
  return linter
}
