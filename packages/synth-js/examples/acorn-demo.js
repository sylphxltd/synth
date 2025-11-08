/**
 * Acorn Demo - 睇下 Acorn 實際點 work
 */

import * as acorn from 'acorn'

// ========================================
// Example 1: Basic Parsing
// ========================================

const code1 = 'const x = 42;'
const ast1 = acorn.parse(code1, { ecmaVersion: 'latest' })

console.log('Example 1: Basic Parsing')
console.log('Input:', code1)
console.log('Output:', JSON.stringify(ast1, null, 2))
console.log('\n')

// Output:
// {
//   "type": "Program",
//   "start": 0,
//   "end": 13,
//   "body": [
//     {
//       "type": "VariableDeclaration",
//       "start": 0,
//       "end": 13,
//       "declarations": [
//         {
//           "type": "VariableDeclarator",
//           "start": 6,
//           "end": 12,
//           "id": {
//             "type": "Identifier",
//             "start": 6,
//             "end": 7,
//             "name": "x"
//           },
//           "init": {
//             "type": "Literal",
//             "start": 10,
//             "end": 12,
//             "value": 42,
//             "raw": "42"
//           }
//         }
//       ],
//       "kind": "const"
//     }
//   ],
//   "sourceType": "script"
// }

// ========================================
// Example 2: ES6+ Features
// ========================================

const code2 = `
  const add = (a, b) => a + b;

  class Person {
    constructor(name) {
      this.name = name;
    }
  }
`

const ast2 = acorn.parse(code2, { ecmaVersion: 2015 })

console.log('Example 2: ES6+ Features')
console.log('Input:', code2)
console.log('Arrow Function node:',
  ast2.body[0].declarations[0].init.type) // ArrowFunctionExpression
console.log('Class node:', ast2.body[1].type) // ClassDeclaration
console.log('\n')

// ========================================
// Example 3: Different Versions
// ========================================

try {
  // ES5 mode - rejects let/const
  const es6Code = 'const x = 42;'
  acorn.parse(es6Code, { ecmaVersion: 5 })
} catch (error) {
  console.log('Example 3: Version Checking')
  console.log('ES5 parser rejects "const":', error.message)
  // "The keyword 'const' is reserved"
}

// ES2015 accepts it
const es6Ast = acorn.parse('const x = 42;', { ecmaVersion: 2015 })
console.log('ES2015 parser accepts "const":', es6Ast.body[0].kind) // "const"
console.log('\n')

// ========================================
// Example 4: Position Tracking
// ========================================

const code4 = `const x = 42;
const y = 100;`

const ast4 = acorn.parse(code4, {
  ecmaVersion: 'latest',
  locations: true, // Add line/column info
  ranges: true,    // Add character positions
})

console.log('Example 4: Position Tracking')
console.log('First declaration:')
console.log('  Range:', ast4.body[0].range) // [0, 13]
console.log('  Location:', ast4.body[0].loc)
// {
//   start: { line: 1, column: 0 },
//   end: { line: 1, column: 13 }
// }
console.log('\n')

// ========================================
// Example 5: Error Handling
// ========================================

try {
  const invalidCode = 'const x = ;'
  acorn.parse(invalidCode, { ecmaVersion: 'latest' })
} catch (error) {
  console.log('Example 5: Error Handling')
  console.log('Syntax error detected:')
  console.log('  Message:', error.message)
  console.log('  Position:', error.pos)
  console.log('  Line:', error.loc?.line)
  console.log('  Column:', error.loc?.column)
}
console.log('\n')

// ========================================
// Example 6: Modern Features
// ========================================

const code6 = `
  // ES2020: Optional chaining
  const value = obj?.prop?.nested;

  // ES2020: Nullish coalescing
  const result = value ?? 'default';

  // ES2022: Private fields
  class Counter {
    #count = 0;
    increment() { this.#count++; }
  }
`

const ast6 = acorn.parse(code6, { ecmaVersion: 2022 })

console.log('Example 6: Modern JavaScript Features')
console.log('Optional chaining node:',
  ast6.body[0].declarations[0].init.type) // ChainExpression
console.log('Private field node:',
  ast6.body[2].body.body[0].type) // PropertyDefinition
console.log('\n')

// ========================================
// Example 7: TypeScript (需要 plugin)
// ========================================

import tsPlugin from 'acorn-typescript'

const acornTS = acorn.Parser.extend(tsPlugin())

const tsCode = `
  interface User {
    name: string;
    age: number;
  }

  function greet(user: User): string {
    return \`Hello \${user.name}\`;
  }
`

const tsAst = acornTS.parse(tsCode, { ecmaVersion: 'latest' })

console.log('Example 7: TypeScript Support')
console.log('Interface node:', tsAst.body[0].type) // TSInterfaceDeclaration
console.log('Function with types:', tsAst.body[1].type) // FunctionDeclaration
console.log('\n')

// ========================================
// Summary
// ========================================

console.log('========================================')
console.log('Acorn 特點總結：')
console.log('✅ 將 JS code → ESTree AST')
console.log('✅ 支援 ES5 到 ES2024+')
console.log('✅ Position tracking (line, column, offset)')
console.log('✅ 清晰嘅 error messages')
console.log('✅ Plugin 系統 (TypeScript, JSX, etc.)')
console.log('✅ 快速、輕量、可靠')
console.log('========================================')
