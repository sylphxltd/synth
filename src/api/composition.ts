/**
 * Functional composition utilities
 */

import type { TransformFn } from './processor.js'
import type { Tree } from '../types/index.js'

/**
 * Compose multiple transforms into one
 * Transforms are applied left to right
 */
export function compose(...transforms: TransformFn[]): TransformFn {
  return async (tree: Tree) => {
    let result = tree
    for (const transform of transforms) {
      result = await transform(result)
    }
    return result
  }
}

/**
 * Pipe operator alternative
 * Same as compose but more explicit
 */
export function pipe(...transforms: TransformFn[]): TransformFn {
  return compose(...transforms)
}

/**
 * Conditional transform
 */
export function when(
  predicate: (tree: Tree) => boolean | Promise<boolean>,
  transform: TransformFn
): TransformFn {
  return async (tree: Tree) => {
    const shouldApply = await predicate(tree)
    return shouldApply ? await transform(tree) : tree
  }
}

/**
 * Map a transform over multiple trees
 */
export async function map(trees: Tree[], transform: TransformFn): Promise<Tree[]> {
  return Promise.all(trees.map(transform))
}

/**
 * Parallel composition - run transforms in parallel and merge results
 */
export function parallel(...transforms: TransformFn[]): TransformFn {
  return async (tree: Tree) => {
    const results = await Promise.all(transforms.map(t => t(tree)))
    // Return the last result (can be customized with a merge strategy)
    return results[results.length - 1]!
  }
}

/**
 * Sequential composition (explicit)
 */
export function sequential(...transforms: TransformFn[]): TransformFn {
  return compose(...transforms)
}

/**
 * Retry a transform on failure
 */
export function retry(transform: TransformFn, maxAttempts: number = 3): TransformFn {
  return async (tree: Tree) => {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await transform(tree)
      } catch (error) {
        lastError = error as Error
      }
    }

    throw new Error(
      `Transform failed after ${maxAttempts} attempts: ${lastError?.message}`
    )
  }
}

/**
 * Memoize a transform (cache based on tree identity)
 */
export function memoize(transform: TransformFn): TransformFn {
  const cache = new WeakMap<Tree, Tree>()

  return async (tree: Tree) => {
    const cached = cache.get(tree)
    if (cached) return cached

    const result = await transform(tree)
    cache.set(tree, result)
    return result
  }
}

/**
 * Tap into the pipeline for side effects (logging, debugging)
 */
export function tap(fn: (tree: Tree) => void | Promise<void>): TransformFn {
  return async (tree: Tree) => {
    await fn(tree)
    return tree
  }
}

/**
 * Time a transform execution
 */
export function timed(transform: TransformFn, label?: string): TransformFn {
  return async (tree: Tree) => {
    const start = performance.now()
    const result = await transform(tree)
    const duration = performance.now() - start
    console.log(`Transform${label ? ` '${label}'` : ''} took ${duration.toFixed(2)}ms`)
    return result
  }
}
