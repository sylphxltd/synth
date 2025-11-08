/**
 * @sylphx/ast-core
 *
 * Core AST infrastructure - language-agnostic types and utilities
 */

// Export core types
export * from './types/index.js'

// Export traversal utilities
export {
  traverse,
  select,
  find,
  selectByType,
} from './traverse.js'

// Export zipper for functional navigation
export type { Zipper } from './zipper.js'

export {
  createZipper,
  createZipperAt,
  getFocus,
  down,
  up,
  left,
  right,
  root,
  edit,
  replace,
  appendChild,
  insertLeft,
  insertRight,
  remove,
} from './zipper.js'

// Export query index
export type { QuerySelector, QueryPredicate, QueryObject, IndexStats } from './query-index.js'

export {
  ASTIndex,
  createIndex,
} from './query-index.js'

// Export incremental processing
export type {
  Edit,
  SimpleEdit,
  AffectedRange,
  IncrementalStats,
} from './incremental.js'

export {
  IncrementalParser,
  createIncrementalParser,
  applyEdit,
} from './incremental.js'
