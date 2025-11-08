#!/usr/bin/env tsx
/**
 * Comprehensive Benchmarking Suite Runner
 *
 * Runs all benchmarks and generates a comparison report.
 *
 * Usage:
 *   npm run bench:all          # Run all benchmarks
 *   npm run bench:compare      # Compare vs remark only
 *   npm run bench:profile      # Run detailed profiling
 *   npm run bench:memory       # Memory usage analysis (future)
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'

interface BenchmarkSuite {
  name: string
  file: string
  description: string
  category: 'comparison' | 'profiling' | 'feature' | 'optimization'
}

const benchmarkSuites: BenchmarkSuite[] = [
  {
    name: 'Ultra-Optimization',
    file: 'ultra-optimization.bench.ts',
    description: 'Compare remark vs optimized vs ultra-optimized across document sizes',
    category: 'comparison',
  },
  {
    name: 'Detailed Profiling',
    file: 'detailed-profiling.bench.ts',
    description: 'Comprehensive performance analysis (phases, features, scaling)',
    category: 'profiling',
  },
  {
    name: 'No Index Mode',
    file: 'no-index.bench.ts',
    description: 'Performance without query index (maximum speed)',
    category: 'optimization',
  },
  {
    name: 'Parser Profiling',
    file: 'parser-profiling.bench.ts',
    description: 'Parser-specific profiling',
    category: 'profiling',
  },
  {
    name: 'Markdown Parser',
    file: 'markdown-parser.bench.ts',
    description: 'Basic Markdown parser benchmarks',
    category: 'feature',
  },
]

function runBenchmark(suite: BenchmarkSuite): void {
  const benchFile = join('benchmarks', suite.file)

  if (!existsSync(benchFile)) {
    console.log(`⚠️  Skipping ${suite.name}: File not found (${suite.file})`)
    return
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(`🏃 Running: ${suite.name}`)
  console.log(`📝 ${suite.description}`)
  console.log(`${'='.repeat(80)}\n`)

  try {
    execSync(`npm run bench -- ${suite.file}`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    })
  } catch (error) {
    console.error(`❌ Error running ${suite.name}:`, error)
  }
}

function printSummary(): void {
  console.log(`\n${'='.repeat(80)}`)
  console.log('📊 BENCHMARK SUMMARY')
  console.log(`${'='.repeat(80)}\n`)

  console.log('Available benchmark suites:')
  console.log()

  const byCategory = benchmarkSuites.reduce(
    (acc, suite) => {
      if (!acc[suite.category]) {
        acc[suite.category] = []
      }
      acc[suite.category]!.push(suite)
      return acc
    },
    {} as Record<string, BenchmarkSuite[]>
  )

  for (const [category, suites] of Object.entries(byCategory)) {
    console.log(`\n${category.toUpperCase()}:`)
    for (const suite of suites) {
      const status = existsSync(join('benchmarks', suite.file)) ? '✅' : '❌'
      console.log(`  ${status} ${suite.name}`)
      console.log(`     ${suite.description}`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('Usage:')
  console.log('  npm run bench:all       - Run all benchmarks')
  console.log('  npm run bench:compare   - Comparison benchmarks only')
  console.log('  npm run bench:profile   - Profiling benchmarks only')
  console.log('  npm run bench:feature   - Feature benchmarks only')
  console.log(`${'='.repeat(80)}\n`)
}

// Main execution
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'all':
    console.log('🚀 Running all benchmark suites...\n')
    for (const suite of benchmarkSuites) {
      runBenchmark(suite)
    }
    break

  case 'compare':
  case 'comparison':
    console.log('🚀 Running comparison benchmarks...\n')
    for (const suite of benchmarkSuites.filter((s) => s.category === 'comparison')) {
      runBenchmark(suite)
    }
    break

  case 'profile':
  case 'profiling':
    console.log('🚀 Running profiling benchmarks...\n')
    for (const suite of benchmarkSuites.filter((s) => s.category === 'profiling')) {
      runBenchmark(suite)
    }
    break

  case 'feature':
    console.log('🚀 Running feature benchmarks...\n')
    for (const suite of benchmarkSuites.filter((s) => s.category === 'feature')) {
      runBenchmark(suite)
    }
    break

  case 'optimization':
    console.log('🚀 Running optimization benchmarks...\n')
    for (const suite of benchmarkSuites.filter((s) => s.category === 'optimization')) {
      runBenchmark(suite)
    }
    break

  case 'summary':
  case 'list':
  case 'help':
  default:
    printSummary()
    break
}
