/**
 * JavaScript/TypeScript AST utilities
 *
 * Following the language-agnostic BaseNode interface from @sylphx/synth
 * All JS-specific data is stored in the node.data field
 */

import type { BaseNode } from '@sylphx/synth'

// JavaScript node types (subset of ESTree/Babel)
export type JSNodeType =
  | 'root'
  | 'Program'
  // Statements
  | 'ExpressionStatement'
  | 'BlockStatement'
  | 'ReturnStatement'
  | 'IfStatement'
  | 'SwitchStatement'
  | 'WhileStatement'
  | 'DoWhileStatement'
  | 'ForStatement'
  | 'ForInStatement'
  | 'ForOfStatement'
  | 'BreakStatement'
  | 'ContinueStatement'
  | 'ThrowStatement'
  | 'TryStatement'
  | 'VariableDeclaration'
  | 'FunctionDeclaration'
  | 'ClassDeclaration'
  | 'ImportDeclaration'
  | 'ExportNamedDeclaration'
  | 'ExportDefaultDeclaration'
  | 'ExportAllDeclaration'
  // Expressions
  | 'Identifier'
  | 'Literal'
  | 'ArrayExpression'
  | 'ObjectExpression'
  | 'FunctionExpression'
  | 'ArrowFunctionExpression'
  | 'ClassExpression'
  | 'CallExpression'
  | 'MemberExpression'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'LogicalExpression'
  | 'ConditionalExpression'
  | 'AssignmentExpression'
  | 'UpdateExpression'
  | 'NewExpression'
  | 'TemplateLiteral'
  | 'TaggedTemplateExpression'
  | 'SpreadElement'
  | 'YieldExpression'
  | 'AwaitExpression'
  // Patterns
  | 'ObjectPattern'
  | 'ArrayPattern'
  | 'AssignmentPattern'
  | 'RestElement'
  // Other
  | 'Property'
  | 'MethodDefinition'
  | 'VariableDeclarator'
  | 'SwitchCase'
  | 'CatchClause'
  | 'TemplateElement'

// Type guards
export function isProgramNode(node?: BaseNode): node is BaseNode {
  return node?.type === 'Program'
}

export function isIdentifier(node?: BaseNode): node is BaseNode {
  return node?.type === 'Identifier'
}

export function isLiteral(node?: BaseNode): node is BaseNode {
  return node?.type === 'Literal'
}

export function isFunctionDeclaration(node?: BaseNode): node is BaseNode {
  return node?.type === 'FunctionDeclaration'
}

export function isClassDeclaration(node?: BaseNode): node is BaseNode {
  return node?.type === 'ClassDeclaration'
}

export function isVariableDeclaration(node?: BaseNode): node is BaseNode {
  return node?.type === 'VariableDeclaration'
}

export function isImportDeclaration(node?: BaseNode): node is BaseNode {
  return node?.type === 'ImportDeclaration'
}

export function isExportDeclaration(node?: BaseNode): node is BaseNode {
  return (
    node?.type === 'ExportNamedDeclaration' ||
    node?.type === 'ExportDefaultDeclaration' ||
    node?.type === 'ExportAllDeclaration'
  )
}

export function isStatement(node?: BaseNode): node is BaseNode {
  if (!node) return false
  return (
    node.type.endsWith('Statement') ||
    node.type.endsWith('Declaration')
  )
}

export function isExpression(node?: BaseNode): node is BaseNode {
  if (!node) return false
  return node.type.endsWith('Expression') || node.type === 'Identifier' || node.type === 'Literal'
}

export function isCallExpression(node?: BaseNode): node is BaseNode {
  return node?.type === 'CallExpression'
}

export function isMemberExpression(node?: BaseNode): node is BaseNode {
  return node?.type === 'MemberExpression'
}

export function isArrowFunction(node?: BaseNode): node is BaseNode {
  return node?.type === 'ArrowFunctionExpression'
}

export function isFunctionExpression(node?: BaseNode): node is BaseNode {
  return node?.type === 'FunctionExpression' || node?.type === 'ArrowFunctionExpression'
}

// Data accessor functions
export function getIdentifierName(node: BaseNode): string | undefined {
  if (!isIdentifier(node)) return undefined
  return node.data?.name as string | undefined
}

export function getLiteralValue(node: BaseNode): unknown {
  if (!isLiteral(node)) return undefined
  return node.data?.value
}

export function getLiteralRaw(node: BaseNode): string | undefined {
  if (!isLiteral(node)) return undefined
  return node.data?.raw as string | undefined
}

export function getVariableKind(node: BaseNode): 'var' | 'let' | 'const' | undefined {
  if (!isVariableDeclaration(node)) return undefined
  return node.data?.kind as 'var' | 'let' | 'const' | undefined
}

export function getFunctionName(node: BaseNode): string | undefined {
  if (!isFunctionDeclaration(node) && !isFunctionExpression(node)) return undefined
  // After cleanData processing, the id is extracted to just the name string
  return node.data?.id as string | undefined
}

export function isAsync(node: BaseNode): boolean {
  return node.data?.async === true
}

export function isGenerator(node: BaseNode): boolean {
  return node.data?.generator === true
}

export function getOperator(node: BaseNode): string | undefined {
  return node.data?.operator as string | undefined
}

export function getSourceType(node: BaseNode): 'script' | 'module' | undefined {
  if (!isProgramNode(node)) return undefined
  return node.data?.sourceType as 'script' | 'module' | undefined
}

// Utility: Find all imports in a program
export function findImports(tree: { nodes: BaseNode[] }): BaseNode[] {
  return tree.nodes.filter(isImportDeclaration)
}

// Utility: Find all exports in a program
export function findExports(tree: { nodes: BaseNode[] }): BaseNode[] {
  return tree.nodes.filter(isExportDeclaration)
}

// Utility: Find all function declarations
export function findFunctions(tree: { nodes: BaseNode[] }): BaseNode[] {
  return tree.nodes.filter(isFunctionDeclaration)
}

// Utility: Find all class declarations
export function findClasses(tree: { nodes: BaseNode[] }): BaseNode[] {
  return tree.nodes.filter(isClassDeclaration)
}

// Utility: Find identifiers by name
export function findIdentifiersByName(tree: { nodes: BaseNode[] }, name: string): BaseNode[] {
  return tree.nodes.filter(n => isIdentifier(n) && getIdentifierName(n) === name)
}
