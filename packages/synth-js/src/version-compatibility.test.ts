/**
 * JavaScript Version Compatibility Tests
 *
 * Demonstrates how the parser handles different ECMAScript versions
 */

import { describe, it, expect } from 'vitest'
import { parse } from './parser.js'

describe('ECMAScript Version Compatibility', () => {
  describe('ES5 (2009)', () => {
    it('should parse ES5 syntax', () => {
      const code = `
        var x = 42;
        function add(a, b) {
          return a + b;
        }
        var obj = { name: "test" };
      `

      const tree = parse(code, { ecmaVersion: 5 })
      expect(tree.nodes.some(n => n.type === 'VariableDeclaration')).toBe(true)
      expect(tree.nodes.some(n => n.type === 'FunctionDeclaration')).toBe(true)
    })

    it('should reject ES6+ syntax in ES5 mode', () => {
      const es6Code = 'const x = () => 42;'

      expect(() => {
        parse(es6Code, { ecmaVersion: 5 })
      }).toThrow()
    })
  })

  describe('ES6/ES2015', () => {
    it('should parse arrow functions', () => {
      const code = 'const add = (a, b) => a + b;'
      const tree = parse(code, { ecmaVersion: 2015 })

      expect(tree.nodes.some(n => n.type === 'ArrowFunctionExpression')).toBe(true)
    })

    it('should parse let/const', () => {
      const code = 'let x = 1; const y = 2;'
      const tree = parse(code, { ecmaVersion: 2015 })

      const varDecls = tree.nodes.filter(n => n.type === 'VariableDeclaration')
      expect(varDecls.some(n => n.data?.kind === 'let')).toBe(true)
      expect(varDecls.some(n => n.data?.kind === 'const')).toBe(true)
    })

    it('should parse classes', () => {
      const code = `
        class Point {
          constructor(x, y) {
            this.x = x;
            this.y = y;
          }
        }
      `

      const tree = parse(code, { ecmaVersion: 2015 })
      expect(tree.nodes.some(n => n.type === 'ClassDeclaration')).toBe(true)
    })

    it('should parse template literals', () => {
      const code = 'const msg = `Hello ${name}`;'
      const tree = parse(code, { ecmaVersion: 2015 })

      expect(tree.nodes.some(n => n.type === 'TemplateLiteral')).toBe(true)
    })
  })

  describe('ES2017', () => {
    it('should parse async/await', () => {
      const code = `
        async function fetchData() {
          const result = await fetch('/api');
          return result;
        }
      `

      const tree = parse(code, { ecmaVersion: 2017 })
      expect(tree.nodes.some(n => n.type === 'FunctionDeclaration' && n.data?.async)).toBe(true)
      expect(tree.nodes.some(n => n.type === 'AwaitExpression')).toBe(true)
    })
  })

  describe('ES2020', () => {
    it('should parse optional chaining', () => {
      const code = 'const value = obj?.prop?.nested;'
      const tree = parse(code, { ecmaVersion: 2020 })

      expect(tree.nodes.some(n => n.type === 'ChainExpression')).toBe(true)
    })

    it('should parse nullish coalescing', () => {
      const code = 'const value = x ?? defaultValue;'
      const tree = parse(code, { ecmaVersion: 2020 })

      expect(tree.nodes.some(n => n.type === 'LogicalExpression')).toBe(true)
    })

    it('should parse BigInt literals', () => {
      const code = 'const big = 9007199254740991n;'
      const tree = parse(code, { ecmaVersion: 2020 })

      expect(tree.nodes.some(n => n.type === 'Literal')).toBe(true)
    })
  })

  describe('ES2022', () => {
    it('should parse class private fields', () => {
      const code = `
        class Counter {
          #count = 0;

          increment() {
            this.#count++;
          }
        }
      `

      const tree = parse(code, { ecmaVersion: 2022 })
      expect(tree.nodes.some(n => n.type === 'PropertyDefinition')).toBe(true)
      expect(tree.nodes.some(n => n.type === 'PrivateIdentifier')).toBe(true)
    })

    it('should parse top-level await', () => {
      const code = 'const data = await fetch("/api");'
      const tree = parse(code, {
        ecmaVersion: 2022,
        allowAwaitOutsideFunction: true
      })

      expect(tree.nodes.some(n => n.type === 'AwaitExpression')).toBe(true)
    })
  })

  describe('Latest', () => {
    it('should parse with latest ECMAScript features', () => {
      const code = `
        // ES2020+ features
        const value = obj?.prop ?? 'default';

        // ES2022+ features
        class MyClass {
          #private = 42;
        }

        // Async
        async function main() {
          await something();
        }
      `

      const tree = parse(code, { ecmaVersion: 'latest' })
      expect(tree.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Backward Compatibility', () => {
    it('should parse old syntax with new parser', () => {
      // ES5 code parsed with latest parser
      const es5Code = 'var x = 42; function foo() { return x; }'
      const tree = parse(es5Code, { ecmaVersion: 'latest' })

      expect(tree.nodes.some(n => n.type === 'VariableDeclaration')).toBe(true)
      expect(tree.nodes.some(n => n.type === 'FunctionDeclaration')).toBe(true)
    })

    it('should preserve node types across versions', () => {
      const code = 'const add = (a, b) => a + b;'

      // Parse with different versions
      const tree2015 = parse(code, { ecmaVersion: 2015 })
      const treeLatest = parse(code, { ecmaVersion: 'latest' })

      // Should have same structure
      expect(tree2015.nodes.length).toBe(treeLatest.nodes.length)
    })
  })

  describe('TypeScript Support', () => {
    it('should parse TypeScript syntax', () => {
      const tsCode = `
        interface User {
          name: string;
          age: number;
        }

        function greet(user: User): string {
          return \`Hello \${user.name}\`;
        }
      `

      const tree = parse(tsCode, {
        typescript: true,
        ecmaVersion: 'latest'
      })

      expect(tree.nodes.some(n => n.type === 'TSInterfaceDeclaration')).toBe(true)
      expect(tree.nodes.some(n => n.type === 'FunctionDeclaration')).toBe(true)
    })

    it('should parse TypeScript enums', () => {
      const tsCode = `
        enum Color {
          Red,
          Green,
          Blue
        }
      `

      const tree = parse(tsCode, { typescript: true })
      expect(tree.nodes.some(n => n.type === 'TSEnumDeclaration')).toBe(true)
    })

    it('should parse TypeScript generics', () => {
      const tsCode = `
        function identity<T>(arg: T): T {
          return arg;
        }
      `

      const tree = parse(tsCode, { typescript: true })
      expect(tree.nodes.some(n => n.type === 'FunctionDeclaration')).toBe(true)
    })
  })

  describe('Forward Compatibility', () => {
    it('should handle unknown node types gracefully', () => {
      // Even if we don't know how to FORMAT a new syntax,
      // we can still PARSE it and preserve the AST
      const code = 'const x = 42;'
      const tree = parse(code)

      // All nodes are preserved
      expect(tree.nodes.length).toBeGreaterThan(0)

      // Can access any node type
      tree.nodes.forEach(node => {
        expect(node.type).toBeDefined()
        expect(node.children).toBeDefined()
        // data might be undefined or empty object for some nodes
        expect(node.data !== null).toBe(true)
      })
    })

    it('should preserve all node data for unknown syntax', () => {
      // Future: When new syntax is added to Acorn,
      // it automatically appears in our AST
      const code = `
        class MyClass {
          #privateField = 42;
        }
      `

      const tree = parse(code, { ecmaVersion: 2022 })

      // Find private field node
      const privateFieldNode = tree.nodes.find(
        n => n.type === 'PrivateIdentifier'
      )

      // All data is preserved even if we don't have special handling
      expect(privateFieldNode).toBeDefined()
      expect(privateFieldNode?.data).toBeDefined()
    })
  })

  describe('Version-Specific Features', () => {
    it('should allow return outside function in ES5 mode', () => {
      const code = 'return 42;'

      expect(() => {
        parse(code, {
          ecmaVersion: 5,
          allowReturnOutsideFunction: false
        })
      }).toThrow()

      const tree = parse(code, {
        ecmaVersion: 5,
        allowReturnOutsideFunction: true
      })

      expect(tree.nodes.some(n => n.type === 'ReturnStatement')).toBe(true)
    })

    it('should handle hashbang in scripts', () => {
      const code = '#!/usr/bin/env node\nconsole.log("Hello");'

      const tree = parse(code, {
        ecmaVersion: 'latest',
        allowHashBang: true
      })

      expect(tree).toBeDefined()
    })
  })

  describe('Real-World Examples', () => {
    it('should parse modern React component', () => {
      const reactCode = `
        import React, { useState } from 'react';

        export default function Counter() {
          const [count, setCount] = useState(0);

          return (
            <div>
              <button onClick={() => setCount(count + 1)}>
                Count: {count}
              </button>
            </div>
          );
        }
      `

      // Note: JSX requires separate plugin, but JS part should parse
      // For now, we just test that imports/exports work
      const jsOnlyCode = `
        import React, { useState } from 'react';

        export default function Counter() {
          const [count, setCount] = useState(0);
          return count;
        }
      `

      const tree = parse(jsOnlyCode, { ecmaVersion: 'latest' })
      expect(tree.nodes.some(n => n.type === 'ImportDeclaration')).toBe(true)
      expect(tree.nodes.some(n => n.type === 'ExportDefaultDeclaration')).toBe(true)
    })

    it('should parse Node.js ESM code', () => {
      const nodeCode = `
        import fs from 'fs/promises';
        import path from 'path';

        export async function readConfig(filePath) {
          const content = await fs.readFile(filePath, 'utf-8');
          return JSON.parse(content);
        }
      `

      const tree = parse(nodeCode, { ecmaVersion: 'latest' })
      expect(tree.nodes.some(n => n.type === 'ImportDeclaration')).toBe(true)
      expect(tree.nodes.some(n => n.type === 'FunctionDeclaration')).toBe(true)
    })
  })
})
