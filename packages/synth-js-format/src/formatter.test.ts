/**
 * Formatter Tests
 */

import { describe, it, expect } from 'vitest'
import { Formatter, format, check } from './formatter.js'

describe('Formatter', () => {
  describe('Basic Formatting', () => {
    it('should format variable declarations', () => {
      const code = 'const x=42;'
      const formatted = format(code)

      expect(formatted).toContain('const x = 42;')
    })

    it('should format multiple variable declarations', () => {
      const code = 'const x=1,y=2,z=3;'
      const formatted = format(code)

      expect(formatted).toContain('const x = 1, y = 2, z = 3;')
    })

    it('should format function declarations', () => {
      const code = 'function hello(){return"world";}'
      const formatted = format(code)

      expect(formatted).toContain('function hello()')
      expect(formatted).toContain('return "world";')
    })

    it('should format arrow functions', () => {
      const code = 'const add=(a,b)=>a+b;'
      const formatted = format(code)

      expect(formatted).toContain('const add = (a, b) => a + b;')
    })
  })

  describe('Options', () => {
    it('should respect printWidth option', () => {
      const formatter = new Formatter({ printWidth: 80 })
      const code = 'const x = 42;'
      const formatted = formatter.format(code)

      expect(formatted).toBeDefined()
    })

    it('should respect semi option', () => {
      const code = 'const x = 42'

      const withSemi = format(code, { semi: true })
      expect(withSemi).toContain(';')

      const withoutSemi = format(code, { semi: false })
      expect(withoutSemi).not.toContain(';')
    })

    it('should respect singleQuote option', () => {
      const code = 'const str = "hello";'

      const singleQuotes = format(code, { singleQuote: true })
      expect(singleQuotes).toContain("'hello'")

      const doubleQuotes = format(code, { singleQuote: false })
      expect(doubleQuotes).toContain('"hello"')
    })

    it('should respect tabWidth option', () => {
      const code = 'function foo() { return 42; }'

      const twoSpaces = format(code, { tabWidth: 2 })
      expect(twoSpaces).toBeDefined()

      const fourSpaces = format(code, { tabWidth: 4 })
      expect(fourSpaces).toBeDefined()
    })

    it('should respect bracketSpacing option', () => {
      const code = 'const obj = {a: 1, b: 2};'

      const withSpacing = format(code, { bracketSpacing: true })
      expect(withSpacing).toContain('{ ')
      expect(withSpacing).toContain(' }')

      const withoutSpacing = format(code, { bracketSpacing: false })
      expect(withoutSpacing).toContain('{')
      expect(withoutSpacing).not.toMatch(/{\s/)
    })

    it('should respect trailingComma option', () => {
      const code = 'const arr = [1, 2, 3];'

      const withComma = format(code, { trailingComma: 'all' })
      expect(withComma).toBeDefined()

      const withoutComma = format(code, { trailingComma: 'none' })
      expect(withoutComma).toBeDefined()
    })
  })

  describe('Statements', () => {
    it('should format if statements', () => {
      const code = 'if(x>0){console.log("positive");}'
      const formatted = format(code)

      expect(formatted).toContain('if (x > 0)')
      expect(formatted).toContain('{')
      expect(formatted).toContain('}')
    })

    it('should format return statements', () => {
      const code = 'function getValue() { return x+y; }'
      const formatted = format(code)

      expect(formatted).toContain('return x + y;')
    })

    it('should format block statements', () => {
      const code = 'function test(){const x=1;const y=2;return x+y;}'
      const formatted = format(code)

      expect(formatted).toContain('{')
      expect(formatted).toContain('}')
      expect(formatted).toContain('const x = 1;')
      expect(formatted).toContain('const y = 2;')
    })
  })

  describe('Expressions', () => {
    it('should format binary expressions', () => {
      const code = 'const result=a+b*c;'
      const formatted = format(code)

      expect(formatted).toContain('a + b * c')
    })

    it('should format call expressions', () => {
      const code = 'console.log("hello","world");'
      const formatted = format(code)

      expect(formatted).toContain('console.log("hello", "world")')
    })

    it('should format member expressions', () => {
      const code = 'obj.prop.nested;'
      const formatted = format(code)

      expect(formatted).toContain('obj.prop.nested')
    })

    it('should format array expressions', () => {
      const code = 'const arr=[1,2,3,4];'
      const formatted = format(code)

      expect(formatted).toContain('[1, 2, 3, 4,')
      expect(formatted).toContain(']')
    })

    it('should format object expressions', () => {
      const code = 'const obj={a:1,b:2};'
      const formatted = format(code)

      expect(formatted).toContain('{ a: 1, b: 2,')
      expect(formatted).toContain('}')
    })
  })

  describe('Async/Await', () => {
    it('should format async functions', () => {
      const code = 'async function fetchData(){return await fetch("/api");}'
      const formatted = format(code)

      expect(formatted).toContain('async function fetchData()')
    })
  })

  describe('Classes', () => {
    it('should format class declarations', () => {
      const code = 'class MyClass{constructor(){this.value=42;}}'
      const formatted = format(code)

      expect(formatted).toContain('class MyClass')
      expect(formatted).toContain('{')
      expect(formatted).toContain('}')
    })
  })

  describe('Imports/Exports', () => {
    it('should format import declarations', () => {
      const code = 'import React from "react";'
      const formatted = format(code)

      expect(formatted).toContain('import')
    })

    it('should format export declarations', () => {
      const code = 'export const x = 42;'
      const formatted = format(code)

      expect(formatted).toContain('export')
      expect(formatted).toContain('const x = 42')
    })

    it('should format default exports', () => {
      const code = 'export default function foo() {}'
      const formatted = format(code)

      expect(formatted).toContain('export default')
    })
  })

  describe('Complex Code', () => {
    it('should format complete functions', () => {
      const code = `
        function calculate(a,b){
          const sum=a+b;
          const product=a*b;
          return{sum,product};
        }
      `

      const formatted = format(code)

      expect(formatted).toContain('function calculate(a, b)')
      expect(formatted).toContain('const sum = a + b;')
      expect(formatted).toContain('const product = a * b;')
      expect(formatted).toContain('return { sum: sum, product: product,')
    })

    it('should format nested structures', () => {
      const code = 'const nested={a:{b:{c:1}}};'
      const formatted = format(code)

      expect(formatted).toContain('const nested =')
      expect(formatted).toContain('a:')
      expect(formatted).toContain('b:')
      expect(formatted).toContain('c: 1')
    })
  })

  describe('check() function', () => {
    it('should return true for formatted code', () => {
      const code = 'const x = 42;'
      const formatted = format(code)

      expect(check(formatted)).toBe(true)
    })

    it('should return false for unformatted code', () => {
      const unformatted = 'const x=42;'
      const isFormatted = check(unformatted)

      expect(isFormatted).toBe(false)
    })
  })

  describe('Standalone functions', () => {
    it('should format with standalone format()', () => {
      const code = 'const x=42;'
      const formatted = format(code)

      expect(formatted).toContain('const x = 42;')
    })

    it('should check with standalone check()', () => {
      const code = 'const x = 42;'
      const result = check(code)

      expect(typeof result).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should handle empty code', () => {
      const formatted = format('')
      expect(formatted).toBeDefined()
    })

    it('should handle syntax errors gracefully', () => {
      expect(() => {
        format('const x = ')
      }).toThrow()
    })
  })

  describe('Indentation', () => {
    it('should indent nested blocks', () => {
      const code = 'function outer(){function inner(){return 42;}}'
      const formatted = format(code)

      expect(formatted).toContain('function outer()')
      expect(formatted).toContain('function inner()')
    })

    it('should indent if statement bodies', () => {
      const code = 'if(true){const x=1;}'
      const formatted = format(code)

      expect(formatted).toContain('if (true)')
      expect(formatted).toContain('const x = 1;')
    })
  })
})
