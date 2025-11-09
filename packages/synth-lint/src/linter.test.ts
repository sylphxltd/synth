import { describe, it, expect } from 'bun:test'
import { Linter, createLinter } from './linter.js'
import { noEmptyBlocks, noConsole, maxDepth } from './rules/index.js'
import { createTree, addNode } from '@sylphx/synth'
import type { Rule, RuleVisitor } from './types.js'

describe('Linter', () => {
  it('should create a linter instance', () => {
    const linter = new Linter()
    expect(linter).toBeInstanceOf(Linter)
  })

  it('should create linter with factory', () => {
    const linter = createLinter()
    expect(linter).toBeInstanceOf(Linter)
  })

  it('should register rules', () => {
    const linter = new Linter()
    linter.addRule(noEmptyBlocks)

    const rules = linter.getRules()
    expect(rules.length).toBe(1)
    expect(rules[0].name).toBe('no-empty-blocks')
  })

  it('should register multiple rules', () => {
    const linter = new Linter()
    linter.addRules([noEmptyBlocks, noConsole, maxDepth])

    const rules = linter.getRules()
    expect(rules.length).toBe(3)
  })

  it('should get a specific rule', () => {
    const linter = new Linter()
    linter.addRule(noEmptyBlocks)

    const rule = linter.getRule('no-empty-blocks')
    expect(rule).toBeDefined()
    expect(rule!.name).toBe('no-empty-blocks')
  })

  it('should lint an empty tree', () => {
    const linter = new Linter()
    linter.addRule(noEmptyBlocks)

    const tree = createTree('javascript', '')
    const result = linter.lint(tree)

    expect(result).toBeDefined()
    expect(result.diagnostics).toBeDefined()
    expect(result.counts).toBeDefined()
    expect(result.success).toBe(true)
  })

  it('should detect empty blocks', () => {
    const linter = new Linter()
    linter.addRule(noEmptyBlocks)

    const tree = createTree('javascript', 'function test() {}')

    // Add empty block
    const blockId = addNode(tree, {
      type: 'BlockStatement',
      parent: tree.root,
      children: [],
      span: {
        start: { offset: 16, line: 1, column: 16 },
        end: { offset: 18, line: 1, column: 18 },
      },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(blockId)

    const result = linter.lint(tree)

    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].rule).toBe('no-empty-blocks')
    expect(result.diagnostics[0].severity).toBe('warning')
    expect(result.counts.warning).toBe(1)
  })

  it('should respect rule configuration', () => {
    const linter = new Linter()
    linter.addRule(noEmptyBlocks)
    linter.configure({
      rules: {
        'no-empty-blocks': false, // Disable rule
      },
    })

    const tree = createTree('javascript', 'function test() {}')

    const blockId = addNode(tree, {
      type: 'BlockStatement',
      parent: tree.root,
      children: [],
      span: {
        start: { offset: 16, line: 1, column: 16 },
        end: { offset: 18, line: 1, column: 18 },
      },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(blockId)

    const result = linter.lint(tree)

    expect(result.diagnostics.length).toBe(0)
  })

  it('should override severity via config', () => {
    const linter = new Linter()
    linter.addRule(noEmptyBlocks)
    linter.configure({
      rules: {
        'no-empty-blocks': 'error', // Change to error
      },
    })

    const tree = createTree('javascript', 'function test() {}')

    const blockId = addNode(tree, {
      type: 'BlockStatement',
      parent: tree.root,
      children: [],
      span: {
        start: { offset: 16, line: 1, column: 16 },
        end: { offset: 18, line: 1, column: 18 },
      },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(blockId)

    const result = linter.lint(tree)

    expect(result.diagnostics[0].severity).toBe('error')
    expect(result.counts.error).toBe(1)
    expect(result.success).toBe(false)
  })

  it('should filter by severity', () => {
    const linter = new Linter()
    linter.addRule(noEmptyBlocks) // warning
    linter.configure({
      severity: 'error', // Only show errors
    })

    const tree = createTree('javascript', 'function test() {}')

    const blockId = addNode(tree, {
      type: 'BlockStatement',
      parent: tree.root,
      children: [],
      span: {
        start: { offset: 16, line: 1, column: 16 },
        end: { offset: 18, line: 1, column: 18 },
      },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(blockId)

    const result = linter.lint(tree)

    // Warning should be filtered out
    expect(result.diagnostics.length).toBe(0)
  })

  it('should support custom rules', () => {
    const customRule: Rule = {
      name: 'custom-rule',
      description: 'A custom test rule',
      severity: 'info',
      enabled: true,

      create(context) {
        const visitor: RuleVisitor = {
          enter(node) {
            if (node.type === 'test') {
              context.report({
                severity: 'info',
                message: 'Found test node',
                nodeId: node.id,
              })
            }
          },
        }
        return visitor
      },
    }

    const linter = new Linter()
    linter.addRule(customRule)

    const tree = createTree('test', 'test')

    const testId = addNode(tree, {
      type: 'test',
      parent: tree.root,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: 4, line: 1, column: 4 },
      },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(testId)

    const result = linter.lint(tree)

    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].rule).toBe('custom-rule')
    expect(result.counts.info).toBe(1)
  })

  it('should support language-specific rules', () => {
    const linter = new Linter()
    linter.addRule(noConsole) // JavaScript only

    // JavaScript tree
    const jsTree = createTree('javascript', 'console.log("test")')
    const jsResult = linter.lint(jsTree)
    // Rule is disabled by default
    expect(jsResult.diagnostics.length).toBe(0)

    // Enable the rule
    linter.configure({ rules: { 'no-console': true } })

    // Python tree - rule shouldn't apply
    const pyTree = createTree('python', 'print("test")')
    const pyResult = linter.lint(pyTree)
    expect(pyResult.diagnostics.length).toBe(0)
  })

  it('should call visitor enter and leave', () => {
    let enterCalls = 0
    let leaveCalls = 0

    const customRule: Rule = {
      name: 'test-visitor',
      description: 'Test visitor callbacks',
      severity: 'info',
      enabled: true,

      create() {
        return {
          enter() {
            enterCalls++
          },
          leave() {
            leaveCalls++
          },
        }
      },
    }

    const linter = new Linter()
    linter.addRule(customRule)

    const tree = createTree('test', '')

    // Add some nodes
    const node1 = addNode(tree, {
      type: 'test',
      parent: tree.root,
      children: [],
      span: { start: { offset: 0, line: 1, column: 0 }, end: { offset: 0, line: 1, column: 0 } },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(node1)

    const node2 = addNode(tree, {
      type: 'test',
      parent: node1,
      children: [],
      span: { start: { offset: 0, line: 1, column: 0 }, end: { offset: 0, line: 1, column: 0 } },
      data: {},
    })
    tree.nodes[node1]!.children.push(node2)

    linter.lint(tree)

    // Root + 2 nodes = 3 total
    expect(enterCalls).toBe(3)
    expect(leaveCalls).toBe(3)
  })

  it('should support type-specific visitors', () => {
    let blockCalls = 0

    const customRule: Rule = {
      name: 'test-type-visitor',
      description: 'Test type-specific visitor',
      severity: 'info',
      enabled: true,

      create() {
        return {
          BlockStatement() {
            blockCalls++
          },
        }
      },
    }

    const linter = new Linter()
    linter.addRule(customRule)

    const tree = createTree('javascript', '')

    const block = addNode(tree, {
      type: 'BlockStatement',
      parent: tree.root,
      children: [],
      span: { start: { offset: 0, line: 1, column: 0 }, end: { offset: 0, line: 1, column: 0 } },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(block)

    const other = addNode(tree, {
      type: 'OtherNode',
      parent: tree.root,
      children: [],
      span: { start: { offset: 0, line: 1, column: 0 }, end: { offset: 0, line: 1, column: 0 } },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(other)

    linter.lint(tree)

    expect(blockCalls).toBe(1)
  })

  it('should provide context helpers', () => {
    const customRule: Rule = {
      name: 'test-context',
      description: 'Test context helpers',
      severity: 'info',
      enabled: true,

      create(context) {
        return {
          enter(node) {
            // Test context methods
            const retrieved = context.getNode(node.id)
            expect(retrieved).toBe(node)

            const children = context.getChildren(node.id)
            expect(Array.isArray(children)).toBe(true)

            if (node.parent !== null) {
              const parent = context.getParent(node.id)
              expect(parent).toBeDefined()
            }
          },
        }
      },
    }

    const linter = new Linter()
    linter.addRule(customRule)

    const tree = createTree('test', 'source code')

    const node1 = addNode(tree, {
      type: 'test',
      parent: tree.root,
      children: [],
      span: { start: { offset: 0, line: 1, column: 0 }, end: { offset: 11, line: 1, column: 11 } },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(node1)

    linter.lint(tree)
  })

  it('should detect max depth violations', () => {
    const linter = new Linter()
    linter.addRule(maxDepth)

    const tree = createTree('test', '')

    // Create deeply nested structure
    let parentId = tree.root
    for (let i = 0; i < 6; i++) {
      const nodeId = addNode(tree, {
        type: 'block',
        parent: parentId,
        children: [],
        span: {
          start: { offset: 0, line: 1, column: 0 },
          end: { offset: 0, line: 1, column: 0 },
        },
        data: {},
      })
      tree.nodes[parentId]!.children.push(nodeId)
      parentId = nodeId
    }

    const result = linter.lint(tree)

    // Should have warnings for depths > 4
    expect(result.diagnostics.length).toBeGreaterThan(0)
    expect(result.diagnostics.some((d) => d.message.includes('depth'))).toBe(true)
  })

  it('should count diagnostics correctly', () => {
    const linter = new Linter()
    linter.addRules([noEmptyBlocks, maxDepth])

    const tree = createTree('javascript', '')

    // Add empty block (warning)
    const blockId = addNode(tree, {
      type: 'BlockStatement',
      parent: tree.root,
      children: [],
      span: {
        start: { offset: 0, line: 1, column: 0 },
        end: { offset: 0, line: 1, column: 0 },
      },
      data: {},
    })
    tree.nodes[tree.root]!.children.push(blockId)

    const result = linter.lint(tree)

    expect(result.counts.warning).toBeGreaterThanOrEqual(1)
    expect(result.counts.error).toBe(0)
    expect(result.success).toBe(true)
  })
})
