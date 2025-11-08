/**
 * @sylphx/synth-js
 *
 * High-performance JavaScript/TypeScript parser for Synth
 */

// Core parser
export { JSParser, createParser, parse, parseAsync } from './parser.js'
export type { JSParseOptions } from './parser.js'

// Types and utilities
export {
  isProgramNode,
  isIdentifier,
  isLiteral,
  isFunctionDeclaration,
  isClassDeclaration,
  isVariableDeclaration,
  isImportDeclaration,
  isExportDeclaration,
  isStatement,
  isExpression,
  isCallExpression,
  isMemberExpression,
  isArrowFunction,
  isFunctionExpression,
  getIdentifierName,
  getLiteralValue,
  getLiteralRaw,
  getVariableKind,
  getFunctionName,
  isAsync,
  isGenerator,
  getOperator,
  getSourceType,
  findImports,
  findExports,
  findFunctions,
  findClasses,
  findIdentifiersByName,
} from './types.js'
export type { JSNodeType } from './types.js'
