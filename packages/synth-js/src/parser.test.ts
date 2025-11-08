/**
 * JavaScript Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { JSParser, createParser, parse, parseAsync } from './parser.js'
import { createTransformPlugin } from '@sylphx/synth'
import {
  isProgramNode,
  isIdentifier,
  isLiteral,
  isFunctionDeclaration,
  isVariableDeclaration,
  isImportDeclaration,
  isExportDeclaration,
  getIdentifierName,
  getLiteralValue,
  getVariableKind,
  getFunctionName,
  findImports,
  findExports,
  findFunctions,
  findIdentifiersByName,
} from './types.js'

describe('JSParser', () => {
  describe('Basic JavaScript Parsing', () => {
    it('should parse simple variable declaration', () => {
      const parser = new JSParser()
      const tree = parser.parse('const x = 42;')

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)

      const varDecl = tree.nodes.find(isVariableDeclaration)
      expect(varDecl).toBeDefined()
      expect(getVariableKind(varDecl!)).toBe('const')
    })

    it('should parse function declaration', () => {
      const parser = new JSParser()
      const tree = parser.parse('function hello() { return "world"; }')

      const func = tree.nodes.find(isFunctionDeclaration)
      expect(func).toBeDefined()
      expect(getFunctionName(func!)).toBe('hello')
    })

    it('should parse arrow function', () => {
      const parser = new JSParser()
      const tree = parser.parse('const add = (a, b) => a + b;')

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse literals', () => {
      const parser = new JSParser()
      const tree = parser.parse('const num = 42; const str = "hello"; const bool = true;')

      const literals = tree.nodes.filter(isLiteral)
      expect(literals.length).toBeGreaterThan(0)

      const numLiteral = literals.find(l => getLiteralValue(l) === 42)
      expect(numLiteral).toBeDefined()

      const strLiteral = literals.find(l => getLiteralValue(l) === 'hello')
      expect(strLiteral).toBeDefined()

      const boolLiteral = literals.find(l => getLiteralValue(l) === true)
      expect(boolLiteral).toBeDefined()
    })

    it('should parse identifiers', () => {
      const parser = new JSParser()
      const tree = parser.parse('const myVariable = x + y;')

      const identifiers = tree.nodes.filter(isIdentifier)
      expect(identifiers.length).toBeGreaterThan(0)

      const myVar = identifiers.find(i => getIdentifierName(i) === 'myVariable')
      expect(myVar).toBeDefined()
    })
  })

  describe('ES Modules', () => {
    it('should parse import statements', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        import { foo, bar } from 'module';
        import React from 'react';
      `)

      const imports = findImports(tree)
      expect(imports.length).toBe(2)
    })

    it('should parse export statements', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        const bar = 1;
        const baz = 2;
        export const x = 42;
        export default function foo() {}
        export { bar, baz };
      `)

      const exports = findExports(tree)
      expect(exports.length).toBe(3)
    })

    it('should parse mixed imports and exports', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        import foo from 'foo';
        const x = 42;
        export { x, foo };
      `)

      expect(findImports(tree).length).toBe(1)
      expect(findExports(tree).length).toBe(1)
    })
  })

  describe('ES6+ Features', () => {
    it('should parse class declarations', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        class MyClass {
          constructor() {
            this.value = 42;
          }

          method() {
            return this.value;
          }
        }
      `)

      const classDecl = tree.nodes.find(n => n.type === 'ClassDeclaration')
      expect(classDecl).toBeDefined()
    })

    it('should parse async/await', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        async function fetchData() {
          const response = await fetch('/api');
          return response.json();
        }
      `)

      const asyncFunc = tree.nodes.find(isFunctionDeclaration)
      expect(asyncFunc).toBeDefined()
    })

    it('should parse template literals', () => {
      const parser = new JSParser()
      const tree = parser.parse('const msg = `Hello ${name}`;')

      const templateLiteral = tree.nodes.find(n => n.type === 'TemplateLiteral')
      expect(templateLiteral).toBeDefined()
    })

    it('should parse destructuring', () => {
      const parser = new JSParser()
      const tree = parser.parse('const { x, y } = point; const [a, b] = arr;')

      const patterns = tree.nodes.filter(n =>
        n.type === 'ObjectPattern' || n.type === 'ArrayPattern'
      )
      expect(patterns.length).toBe(2)
    })

    it('should parse spread operator', () => {
      const parser = new JSParser()
      const tree = parser.parse('const arr = [...items]; const obj = {...props};')

      const spreadElements = tree.nodes.filter(n => n.type === 'SpreadElement')
      expect(spreadElements.length).toBeGreaterThan(0)
    })
  })

  describe('Control Flow', () => {
    it('should parse if statements', () => {
      const parser = new JSParser()
      const tree = parser.parse('if (x > 0) { console.log("positive"); }')

      const ifStmt = tree.nodes.find(n => n.type === 'IfStatement')
      expect(ifStmt).toBeDefined()
    })

    it('should parse loops', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        for (let i = 0; i < 10; i++) {}
        while (x > 0) {}
        do {} while (y < 10);
      `)

      const forStmt = tree.nodes.find(n => n.type === 'ForStatement')
      const whileStmt = tree.nodes.find(n => n.type === 'WhileStatement')
      const doWhileStmt = tree.nodes.find(n => n.type === 'DoWhileStatement')

      expect(forStmt).toBeDefined()
      expect(whileStmt).toBeDefined()
      expect(doWhileStmt).toBeDefined()
    })

    it('should parse switch statements', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        switch (x) {
          case 1:
            break;
          default:
            break;
        }
      `)

      const switchStmt = tree.nodes.find(n => n.type === 'SwitchStatement')
      expect(switchStmt).toBeDefined()
    })

    it('should parse try/catch', () => {
      const parser = new JSParser()
      const tree = parser.parse(`
        try {
          throw new Error("test");
        } catch (e) {
          console.error(e);
        }
      `)

      const tryStmt = tree.nodes.find(n => n.type === 'TryStatement')
      expect(tryStmt).toBeDefined()
    })
  })

  describe('TypeScript Support', () => {
    it('should parse TypeScript with type annotations', () => {
      const parser = new JSParser()
      const tree = parser.parse(
        'const x: number = 42; function greet(name: string): void {}',
        { typescript: true }
      )

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse TypeScript interfaces', () => {
      const parser = new JSParser()
      const tree = parser.parse(
        'interface User { name: string; age: number; }',
        { typescript: true }
      )

      expect(tree).toBeDefined()
    })

    it('should parse TypeScript generics', () => {
      const parser = new JSParser()
      const tree = parser.parse(
        'function identity<T>(arg: T): T { return arg; }',
        { typescript: true }
      )

      expect(tree).toBeDefined()
    })
  })

  describe('Plugin Support', () => {
    it('should apply transform plugins', () => {
      const parser = new JSParser()

      let pluginCalled = false
      const plugin = createTransformPlugin(
        { name: 'test', version: '1.0.0' },
        (tree) => {
          pluginCalled = true
          return tree
        }
      )

      parser.parse('const x = 42;', { plugins: [plugin] })
      expect(pluginCalled).toBe(true)
    })

    it('should support registered plugins', () => {
      const parser = new JSParser()

      let pluginCalled = false
      const plugin = createTransformPlugin(
        { name: 'test', version: '1.0.0' },
        (tree) => {
          pluginCalled = true
          return tree
        }
      )

      parser.use(plugin)
      parser.parse('const x = 42;')

      expect(pluginCalled).toBe(true)
    })

    it('should support plugin chaining', () => {
      const parser = new JSParser()

      const plugin1 = createTransformPlugin(
        { name: 'test1', version: '1.0.0' },
        (tree) => tree
      )
      const plugin2 = createTransformPlugin(
        { name: 'test2', version: '1.0.0' },
        (tree) => tree
      )

      const result = parser.use(plugin1).use(plugin2)
      expect(result).toBe(parser)
    })

    it('should merge registered and one-off plugins', () => {
      const parser = new JSParser()

      let registered = false
      let oneOff = false

      const registeredPlugin = createTransformPlugin(
        { name: 'registered', version: '1.0.0' },
        (tree) => {
          registered = true
          return tree
        }
      )

      const oneOffPlugin = createTransformPlugin(
        { name: 'one-off', version: '1.0.0' },
        (tree) => {
          oneOff = true
          return tree
        }
      )

      parser.use(registeredPlugin)
      parser.parse('const x = 42;', { plugins: [oneOffPlugin] })

      expect(registered).toBe(true)
      expect(oneOff).toBe(true)
    })
  })

  describe('Async Parsing', () => {
    it('should parse asynchronously', async () => {
      const parser = new JSParser()
      const tree = await parser.parseAsync('const x = 42;')

      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should support async plugins', async () => {
      const parser = new JSParser()

      let pluginCalled = false
      const asyncPlugin = createTransformPlugin(
        { name: 'async-test', version: '1.0.0' },
        async (tree) => {
          await new Promise(resolve => setTimeout(resolve, 1))
          pluginCalled = true
          return tree
        }
      )

      await parser.parseAsync('const x = 42;', { plugins: [asyncPlugin] })
      expect(pluginCalled).toBe(true)
    })

    it('should detect async plugins in sync parse', () => {
      const parser = new JSParser()

      const asyncPlugin = createTransformPlugin(
        { name: 'async', version: '1.0.0' },
        async (tree) => {
          await new Promise(resolve => setTimeout(resolve, 1))
          return tree
        }
      )

      expect(() => {
        parser.parse('const x = 42;', { plugins: [asyncPlugin] })
      }).toThrow('Detected async plugins. Use parseAsync() instead of parse()')
    })
  })

  describe('Error Handling', () => {
    it('should throw on syntax errors', () => {
      const parser = new JSParser()

      expect(() => {
        parser.parse('const x = ')
      }).toThrow('JavaScript parse error')
    })

    it('should throw on invalid code', () => {
      const parser = new JSParser()

      expect(() => {
        parser.parse('function () {}')
      }).toThrow()
    })
  })

  describe('getTree()', () => {
    it('should return null before parsing', () => {
      const parser = new JSParser()
      expect(parser.getTree()).toBe(null)
    })

    it('should return tree after parsing', () => {
      const parser = new JSParser()
      const tree = parser.parse('const x = 42;')

      expect(parser.getTree()).toBe(tree)
    })

    it('should return updated tree after second parse', () => {
      const parser = new JSParser()
      const tree1 = parser.parse('const x = 1;')
      const tree2 = parser.parse('const y = 2;')

      expect(parser.getTree()).toBe(tree2)
      expect(parser.getTree()).not.toBe(tree1)
    })
  })

  describe('Factory and Standalone Functions', () => {
    it('should create parser with factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(JSParser)
    })

    it('should parse with standalone function', () => {
      const tree = parse('const x = 42;')
      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse async with standalone function', async () => {
      const tree = await parseAsync('const x = 42;')
      expect(tree).toBeDefined()
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should accept options in standalone functions', () => {
      const tree = parse('const x: number = 42;', { typescript: true })
      expect(tree).toBeDefined()
    })
  })

  describe('Parse Options', () => {
    it('should parse as module by default', () => {
      const parser = new JSParser()
      const tree = parser.parse('import x from "y";')

      const program = tree.nodes.find(isProgramNode)
      expect(program).toBeDefined()
    })

    it('should parse as script when specified', () => {
      const parser = new JSParser()
      const tree = parser.parse('var x = 42;', { sourceType: 'script' })

      expect(tree).toBeDefined()
    })

    it('should handle top-level await', () => {
      const parser = new JSParser()
      const tree = parser.parse(
        'const data = await fetch("/api");',
        { allowAwaitOutsideFunction: true }
      )

      expect(tree).toBeDefined()
    })
  })

  describe('Complex Programs', () => {
    it('should parse complete module', () => {
      const code = `
        import { useState } from 'react';

        export function Counter() {
          const [count, setCount] = useState(0);

          const increment = () => setCount(count + 1);

          return count;
        }
      `

      const parser = new JSParser()
      const tree = parser.parse(code)

      expect(tree).toBeDefined()
      expect(findImports(tree).length).toBe(1)
      expect(findExports(tree).length).toBe(1)
      expect(findFunctions(tree).length).toBeGreaterThan(0)

      const stateIdentifiers = findIdentifiersByName(tree, 'useState')
      expect(stateIdentifiers.length).toBeGreaterThan(0)
    })

    it('should parse Node.js module', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');

        function readConfig(filePath) {
          const fullPath = path.resolve(filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          return JSON.parse(content);
        }

        module.exports = { readConfig };
      `

      const parser = new JSParser()
      const tree = parser.parse(code, { sourceType: 'script' })

      expect(tree).toBeDefined()
      expect(findFunctions(tree).length).toBeGreaterThan(0)
    })
  })
})
