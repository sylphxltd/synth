/**
 * Core engine exports
 */

export {
  traverse,
  select,
  find,
  selectByType,
} from './traverse.js'

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

export type { BatchVisitor, BatchProcessingOptions } from './batch-processor.js'

export {
  batchProcess,
  batchTraverse,
  batchSelect,
  batchTransform,
  batchMap,
  batchFilter,
} from './batch-processor.js'

export type { PoolConfig, PoolStats } from './node-pool.js'

export {
  NodePoolManager,
  globalNodePool,
  createNodePool,
} from './node-pool.js'

export type { QuerySelector, QueryPredicate, QueryObject, IndexStats } from './query-index.js'

export {
  ASTIndex,
  createIndex,
} from './query-index.js'
