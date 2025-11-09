/**
 * Linter types and interfaces
 */

import type { Tree, Node, NodeId } from '@sylphx/synth'

/**
 * Diagnostic severity levels
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint'

/**
 * Location in source code
 */
export interface Location {
  offset: number
  line: number
  column: number
}

/**
 * Source range
 */
export interface Range {
  start: Location
  end: Location
}

/**
 * Lint diagnostic (error, warning, etc.)
 */
export interface Diagnostic {
  /** Rule that generated this diagnostic */
  rule: string

  /** Severity level */
  severity: DiagnosticSeverity

  /** Human-readable message */
  message: string

  /** Location in source */
  range?: Range

  /** Node ID that triggered the diagnostic */
  nodeId?: NodeId

  /** Suggested fix (if available) */
  fix?: {
    message: string
    range: Range
    replacement: string
  }
}

/**
 * Rule context provided to rules during execution
 */
export interface RuleContext {
  /** The AST tree being linted */
  tree: Tree

  /** Report a diagnostic */
  report(diagnostic: Omit<Diagnostic, 'rule'>): void

  /** Get a node by ID */
  getNode(id: NodeId): Node | undefined

  /** Get parent of a node */
  getParent(id: NodeId): Node | undefined

  /** Get children of a node */
  getChildren(id: NodeId): Node[]

  /** Get source text for a node */
  getSource(node: Node): string

  /** Get source text for a range */
  getSourceRange(range: Range): string
}

/**
 * Visitor pattern for AST traversal
 */
export type RuleVisitor = {
  /** Called when entering a node */
  enter?: (node: Node, context: RuleContext) => void

  /** Called when leaving a node */
  leave?: (node: Node, context: RuleContext) => void

  /** Called for specific node types */
  [key: string]: ((node: Node, context: RuleContext) => void) | undefined
}

/**
 * Lint rule definition
 */
export interface Rule {
  /** Rule name (e.g., 'no-unused-vars') */
  name: string

  /** Rule description */
  description: string

  /** Default severity */
  severity: DiagnosticSeverity

  /** Whether rule is enabled by default */
  enabled?: boolean

  /** Languages this rule applies to (empty = all languages) */
  languages?: string[]

  /** Node types this rule applies to (empty = all types) */
  nodeTypes?: string[]

  /** Rule implementation */
  create(context: RuleContext): RuleVisitor
}

/**
 * Linter configuration
 */
export interface LinterConfig {
  /** Rules to enable/disable */
  rules?: Record<string, boolean | DiagnosticSeverity>

  /** Global severity level (filters out lower severities) */
  severity?: DiagnosticSeverity

  /** Languages to lint (empty = all) */
  languages?: string[]

  /** Custom rules */
  customRules?: Rule[]
}

/**
 * Linter result
 */
export interface LintResult {
  /** All diagnostics found */
  diagnostics: Diagnostic[]

  /** Count by severity */
  counts: {
    error: number
    warning: number
    info: number
    hint: number
  }

  /** Whether linting passed (no errors) */
  success: boolean
}
