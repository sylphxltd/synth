/**
 * @sylphx/ast-optimizations
 *
 * Shared performance optimization components
 */

// Export batch processing
export type { BatchVisitor, BatchProcessingOptions } from './batch-processor.js'

export {
  batchProcess,
  batchTraverse,
  batchSelect,
  batchTransform,
  batchMap,
  batchFilter,
} from './batch-processor.js'

// Export object pooling
export type { PoolConfig, PoolStats } from './node-pool.js'

export {
  NodePoolManager,
  globalNodePool,
  createNodePool,
} from './node-pool.js'
