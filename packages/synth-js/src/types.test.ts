/**
 * JavaScript Types Tests
 */

import { describe, it, expect } from 'vitest'
import { parse } from './parser.js'
import {
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

describe('JavaScript Types', () => {
  describe('Type Guards', () => {
    it('should identify program nodes', () => {
      const tree = parse('const x = 42;')
      const program = tree.nodes.find(isProgramNode)

      expect(program).toBeDefined()
      expect(program?.type).toBe('Program')
    })

    it('should identify identifiers', () => {
      const tree = parse('const myVar = x + y;')
      const identifiers = tree.nodes.filter(isIdentifier)

      expect(identifiers.length).toBeGreaterThan(0)
      const names = identifiers.map(getIdentifierName)
      expect(names).toContain('myVar')
      expect(names).toContain('x')
      expect(names).toContain('y')
    })

    it('should identify literals', () => {
      const tree = parse('const a = 42; const b = "hello"; const c = true;')
      const literals = tree.nodes.filter(isLiteral)

      expect(literals.length).toBe(3)
      const values = literals.map(getLiteralValue)
      expect(values).toContain(42)
      expect(values).toContain('hello')
      expect(values).toContain(true)
    })

    it('should identify function declarations', () => {
      const tree = parse('function foo() {} function bar() {}')
      const functions = tree.nodes.filter(isFunctionDeclaration)

      expect(functions.length).toBe(2)
    })

    it('should identify class declarations', () => {
      const tree = parse('class Foo {} class Bar extends Foo {}')
      const classes = tree.nodes.filter(isClassDeclaration)

      expect(classes.length).toBe(2)
    })

    it('should identify variable declarations', () => {
      const tree = parse('const x = 1; let y = 2; var z = 3;')
      const varDecls = tree.nodes.filter(isVariableDeclaration)

      expect(varDecls.length).toBe(3)
    })

    it('should identify import declarations', () => {
      const tree = parse('import foo from "foo"; import { bar } from "bar";')
      const imports = tree.nodes.filter(isImportDeclaration)

      expect(imports.length).toBe(2)
    })

    it('should identify export declarations', () => {
      const tree = parse('export const x = 42; export default function foo() {}')
      const exports = tree.nodes.filter(isExportDeclaration)

      expect(exports.length).toBe(2)
    })

    it('should identify statements', () => {
      const tree = parse('const x = 42; if (x > 0) {} return x;', {
        allowReturnOutsideFunction: true
      })
      const statements = tree.nodes.filter(isStatement)

      expect(statements.length).toBeGreaterThan(0)
    })

    it('should identify expressions', () => {
      const tree = parse('const x = 1 + 2;')
      const expressions = tree.nodes.filter(isExpression)

      expect(expressions.length).toBeGreaterThan(0)
    })

    it('should identify call expressions', () => {
      const tree = parse('console.log("hello"); foo();')
      const calls = tree.nodes.filter(isCallExpression)

      expect(calls.length).toBe(2)
    })

    it('should identify member expressions', () => {
      const tree = parse('console.log; obj.prop;')
      const members = tree.nodes.filter(isMemberExpression)

      expect(members.length).toBe(2)
    })

    it('should identify arrow functions', () => {
      const tree = parse('const add = (a, b) => a + b;')
      const arrows = tree.nodes.filter(isArrowFunction)

      expect(arrows.length).toBe(1)
    })

    it('should identify function expressions', () => {
      const tree = parse('const f1 = function() {}; const f2 = () => {};')
      const funcExprs = tree.nodes.filter(isFunctionExpression)

      expect(funcExprs.length).toBe(2)
    })

    it('should handle undefined nodes', () => {
      expect(isProgramNode(undefined)).toBe(false)
      expect(isIdentifier(undefined)).toBe(false)
    })
  })

  describe('Data Accessors', () => {
    it('should get identifier names', () => {
      const tree = parse('const myVariable = x;')
      const myVar = tree.nodes.find(n => isIdentifier(n) && getIdentifierName(n) === 'myVariable')

      expect(myVar).toBeDefined()
      expect(getIdentifierName(myVar!)).toBe('myVariable')
    })

    it('should get literal values', () => {
      const tree = parse('const num = 42; const str = "hello"; const bool = false;')

      const num = tree.nodes.find(n => isLiteral(n) && getLiteralValue(n) === 42)
      const str = tree.nodes.find(n => isLiteral(n) && getLiteralValue(n) === 'hello')
      const bool = tree.nodes.find(n => isLiteral(n) && getLiteralValue(n) === false)

      expect(num).toBeDefined()
      expect(str).toBeDefined()
      expect(bool).toBeDefined()
    })

    it('should get literal raw values', () => {
      const tree = parse('const x = 42;')
      const literal = tree.nodes.find(isLiteral)

      expect(literal).toBeDefined()
      expect(getLiteralRaw(literal!)).toBeDefined()
    })

    it('should get variable kind', () => {
      const tree = parse('const a = 1; let b = 2; var c = 3;')

      const constDecl = tree.nodes.find(n => isVariableDeclaration(n) && getVariableKind(n) === 'const')
      const letDecl = tree.nodes.find(n => isVariableDeclaration(n) && getVariableKind(n) === 'let')
      const varDecl = tree.nodes.find(n => isVariableDeclaration(n) && getVariableKind(n) === 'var')

      expect(constDecl).toBeDefined()
      expect(letDecl).toBeDefined()
      expect(varDecl).toBeDefined()
    })

    it('should get function names', () => {
      const tree = parse('function myFunction() {}')
      const func = tree.nodes.find(isFunctionDeclaration)

      expect(getFunctionName(func!)).toBe('myFunction')
    })

    it('should detect async functions', () => {
      const tree = parse('async function fetchData() {}')
      const func = tree.nodes.find(isFunctionDeclaration)

      expect(func).toBeDefined()
      expect(isAsync(func!)).toBe(true)
    })

    it('should detect generator functions', () => {
      const tree = parse('function* generator() {}')
      const func = tree.nodes.find(isFunctionDeclaration)

      expect(func).toBeDefined()
      expect(isGenerator(func!)).toBe(true)
    })

    it('should get operators', () => {
      const tree = parse('const x = 1 + 2;')
      const binary = tree.nodes.find(n => n.type === 'BinaryExpression')

      expect(binary).toBeDefined()
      expect(getOperator(binary!)).toBe('+')
    })

    it('should get source type', () => {
      const tree = parse('export const x = 42;')
      const program = tree.nodes.find(isProgramNode)

      expect(program).toBeDefined()
      expect(getSourceType(program!)).toBe('module')
    })
  })

  describe('Utility Functions', () => {
    it('should find all imports', () => {
      const tree = parse(`
        import React from 'react';
        import { useState } from 'react';
        import './styles.css';
      `)

      const imports = findImports(tree)
      expect(imports.length).toBe(3)
    })

    it('should find all exports', () => {
      const tree = parse(`
        export const x = 42;
        export function foo() {}
        export default class Bar {}
      `)

      const exports = findExports(tree)
      expect(exports.length).toBe(3)
    })

    it('should find all functions', () => {
      const tree = parse(`
        function foo() {}
        function bar() {}
        const baz = () => {};
      `)

      const functions = findFunctions(tree)
      expect(functions.length).toBe(2) // Only declarations, not expressions
    })

    it('should find all classes', () => {
      const tree = parse(`
        class Foo {}
        class Bar extends Foo {}
      `)

      const classes = findClasses(tree)
      expect(classes.length).toBe(2)
    })

    it('should find identifiers by name', () => {
      const tree = parse('const x = 1; const y = x + x;')

      const xIdentifiers = findIdentifiersByName(tree, 'x')
      expect(xIdentifiers.length).toBeGreaterThan(1)
    })

    it('should return empty array when no matches', () => {
      const tree = parse('const x = 42;')

      expect(findImports(tree)).toEqual([])
      expect(findExports(tree)).toEqual([])
      expect(findClasses(tree)).toEqual([])
    })
  })

  describe('Complex Code Analysis', () => {
    it('should analyze React component', () => {
      const code = `
        import { useState } from 'react';

        export function Counter() {
          const [count, setCount] = useState(0);

          const increment = () => setCount(count + 1);

          return count;
        }
      `

      const tree = parse(code)

      expect(findImports(tree).length).toBe(1)
      expect(findExports(tree).length).toBe(1)
      expect(findFunctions(tree).length).toBe(1)

      const stateIdentifiers = findIdentifiersByName(tree, 'useState')
      expect(stateIdentifiers.length).toBeGreaterThan(0)
    })

    it('should analyze class-based component', () => {
      const code = `
        class Component {
          constructor(props) {
            this.props = props;
            this.state = { value: 0 };
          }

          render() {
            return this.state.value;
          }
        }

        export class MyComponent extends Component {
          constructor(props) {
            super(props);
          }
        }
      `

      const tree = parse(code)

      expect(findExports(tree).length).toBe(1)
      expect(findClasses(tree).length).toBe(2)
    })

    it('should analyze Node.js module', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');

        function readFile(filePath) {
          return fs.readFileSync(filePath, 'utf-8');
        }

        module.exports = { readFile };
      `

      const tree = parse(code, { sourceType: 'script' })

      expect(findFunctions(tree).length).toBe(1)

      const fsIdentifiers = findIdentifiersByName(tree, 'fs')
      expect(fsIdentifiers.length).toBeGreaterThan(0)
    })
  })
})
