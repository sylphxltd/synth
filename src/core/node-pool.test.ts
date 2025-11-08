import { describe, it, expect, beforeEach } from 'vitest'
import { NodePoolManager, createNodePool } from './node-pool.js'

describe('Node Pool', () => {
  describe('NodePoolManager', () => {
    let pool: NodePoolManager

    beforeEach(() => {
      pool = createNodePool({
        initialSize: 10,
        maxSize: 100,
      })
    })

    it('should acquire nodes from pool', () => {
      const node1 = pool.acquire('paragraph', 1, 0)
      const node2 = pool.acquire('heading', 2, 0)

      expect(node1.id).toBe(1)
      expect(node1.type).toBe('paragraph')
      expect(node1.parent).toBe(0)

      expect(node2.id).toBe(2)
      expect(node2.type).toBe('heading')
    })

    it('should reuse released nodes', () => {
      const node1 = pool.acquire('paragraph', 1, 0)
      node1.data = { original: true }

      pool.release(node1)

      const node2 = pool.acquire('paragraph', 2, null)

      // Data should be cleared
      expect(node2.data).toBeUndefined()
      expect(node2.id).toBe(2) // New ID
      expect(node2.type).toBe('paragraph')
    })

    it('should track statistics', () => {
      // Acquire 5 nodes
      const nodes = []
      for (let i = 0; i < 5; i++) {
        nodes.push(pool.acquire('item', i, null))
      }

      // Release 3 nodes
      for (let i = 0; i < 3; i++) {
        pool.release(nodes[i])
      }

      // Acquire 2 more (should reuse from pool)
      pool.acquire('item', 10, null)
      pool.acquire('item', 11, null)

      const stats = pool.getAggregateStats()

      expect(stats.totalAcquired).toBe(7) // 5 + 2
      expect(stats.totalReleased).toBe(3)
      expect(stats.currentInUse).toBe(4) // 7 - 3
    })

    it('should calculate hit rate', () => {
      // Pre-populate pool
      const nodes = []
      for (let i = 0; i < 10; i++) {
        nodes.push(pool.acquire('text', i, null))
      }
      for (const node of nodes) {
        pool.release(node)
      }

      // Clear stats and start fresh
      const freshPool = createNodePool({ initialSize: 0 })

      // Acquire and release
      const n1 = freshPool.acquire('text', 1, null)
      freshPool.release(n1)

      // This should be a hit
      freshPool.acquire('text', 2, null)

      const stats = freshPool.getAggregateStats()
      expect(stats.hitRate).toBeGreaterThan(0)
    })

    it('should handle multiple node types', () => {
      pool.acquire('heading', 1, null)
      pool.acquire('paragraph', 2, null)
      pool.acquire('list', 3, null)
      pool.acquire('paragraph', 4, null)

      const types = pool.getPoolTypes()
      expect(types).toContain('heading')
      expect(types).toContain('paragraph')
      expect(types).toContain('list')
    })

    it('should respect maxSize limit', () => {
      const limitedPool = createNodePool({
        initialSize: 0,
        maxSize: 3,
      })

      // Acquire and release 10 nodes
      for (let i = 0; i < 10; i++) {
        const node = limitedPool.acquire('item', i, null)
        limitedPool.release(node)
      }

      const stats = limitedPool.getAggregateStats()
      expect(stats.currentPoolSize).toBeLessThanOrEqual(3)
    })

    it('should trim pool size', () => {
      // Acquire and release many nodes
      for (let i = 0; i < 50; i++) {
        const node = pool.acquire('item', i, null)
        pool.release(node)
      }

      pool.trim(10)

      const stats = pool.getAggregateStats()
      expect(stats.currentPoolSize).toBeLessThanOrEqual(10)
    })

    it('should clear all pools', () => {
      pool.acquire('heading', 1, null)
      pool.acquire('paragraph', 2, null)

      pool.clear()

      const stats = pool.getAggregateStats()
      expect(stats.currentPoolSize).toBe(0)
    })

    it('should release multiple nodes at once', () => {
      const nodes = [
        pool.acquire('item', 1, null),
        pool.acquire('item', 2, null),
        pool.acquire('item', 3, null),
      ]

      pool.releaseMany(nodes)

      const stats = pool.getAggregateStats()
      expect(stats.totalReleased).toBe(3)
    })
  })

  describe('Performance', () => {
    it('should reduce object creation through pooling', () => {
      const pool = createNodePool({ initialSize: 100 })

      // Warm up pool
      for (let i = 0; i < 100; i++) {
        const node = pool.acquire('item', i, null)
        pool.release(node)
      }

      // Reset stats
      const beforeStats = pool.getAggregateStats()

      // Perform many acquire/release cycles
      for (let i = 0; i < 1000; i++) {
        const node = pool.acquire('item', i, null)
        pool.release(node)
      }

      const afterStats = pool.getAggregateStats()

      // Should have high reuse (hit rate)
      // Most acquires should reuse pooled objects, not create new ones
      expect(afterStats.hitRate).toBeGreaterThan(70) // >70% reuse

      // Total objects created should be much less than total acquires
      const newCreations = afterStats.totalCreated - beforeStats.totalCreated
      expect(newCreations).toBeLessThan(300) // Should create < 300 new objects for 1000 acquires
    })

    it('should have high hit rate with reuse', () => {
      const pool = createNodePool({ initialSize: 100 })

      // Simulate typical usage pattern
      const activeNodes = []

      for (let cycle = 0; cycle < 10; cycle++) {
        // Acquire batch
        for (let i = 0; i < 20; i++) {
          activeNodes.push(pool.acquire('node', cycle * 20 + i, null))
        }

        // Release half
        for (let i = 0; i < 10; i++) {
          pool.release(activeNodes.shift()!)
        }
      }

      const stats = pool.getAggregateStats()
      // Should have good reuse after first cycle
      expect(stats.hitRate).toBeGreaterThan(40)
    })
  })
})
