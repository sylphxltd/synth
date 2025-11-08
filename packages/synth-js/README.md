# @sylphx/synth-js

High-performance JavaScript/TypeScript parser for Synth. Powered by Acorn, converting ESTree AST into Synth's language-agnostic universal AST.

## Features

- **JavaScript & TypeScript**: Full ES2024+ support with TypeScript parsing
- **Language-Agnostic AST**: Uses Synth's universal `BaseNode` interface
- **Powered by Acorn**: Battle-tested parsing engine with excellent performance
- **Plugin System**: Compatible with Synth's transform and visitor plugins
- **Async Support**: Both sync and async parsing with automatic async plugin detection
- **TypeScript**: Fully typed with comprehensive type utilities

## Installation

```bash
bun install @sylphx/synth-js
```

## Usage

### Basic JavaScript Parsing

```typescript
import { parse } from '@sylphx/synth-js'

const tree = parse('const x = 42; function hello() { return x; }')
```

### TypeScript Parsing

```typescript
import { parse } from '@sylphx/synth-js'

const tree = parse(
  'const x: number = 42; function greet(name: string): void {}',
  { typescript: true }
)
```

### Using the Parser Class

```typescript
import { JSParser } from '@sylphx/synth-js'

const parser = new JSParser()
const tree = parser.parse('export function add(a, b) { return a + b; }')

// Access the tree
console.log(tree.nodes)
```

### Working with AST Nodes

```typescript
import {
  parse,
  isFunctionDeclaration,
  isVariableDeclaration,
  getFunctionName,
  getVariableKind,
  findImports,
  findExports,
} from '@sylphx/synth-js'

const code = `
  import { useState } from 'react';

  export function Counter() {
    const [count, setCount] = useState(0);
    return count;
  }
`

const tree = parse(code)

// Find imports and exports
const imports = findImports(tree)  // All import declarations
const exports = findExports(tree)  // All export declarations

// Find functions
const func = tree.nodes.find(isFunctionDeclaration)
console.log(getFunctionName(func))  // "Counter"

// Find variables
const varDecl = tree.nodes.find(isVariableDeclaration)
console.log(getVariableKind(varDecl))  // "const"
```

### Plugin Support

```typescript
import { parse } from '@sylphx/synth-js'
import { createTransformPlugin } from '@sylphx/synth'

// Create a plugin that logs all function names
const logFunctionsPlugin = createTransformPlugin(
  { name: 'log-functions', version: '1.0.0' },
  (tree) => {
    tree.nodes.forEach(node => {
      if (node.type === 'FunctionDeclaration') {
        console.log('Function:', node.data?.id)
      }
    })
    return tree
  }
)

const tree = parse('function foo() {} function bar() {}', {
  plugins: [logFunctionsPlugin],
})
```

### Async Parsing

```typescript
import { parseAsync } from '@sylphx/synth-js'
import { createTransformPlugin } from '@sylphx/synth'

const asyncPlugin = createTransformPlugin(
  { name: 'async-transform', version: '1.0.0' },
  async (tree) => {
    // Async transformation
    await somethingAsync()
    return tree
  }
)

const tree = await parseAsync('const x = 42;', {
  plugins: [asyncPlugin],
})
```

### Registered Plugins

```typescript
import { JSParser } from '@sylphx/synth-js'
import { createTransformPlugin } from '@sylphx/synth'

const parser = new JSParser()

// Register plugins
parser
  .use(plugin1)
  .use(plugin2)
  .use(plugin3)

// Plugins apply to all parse() calls
const tree = parser.parse('const x = 42;')
```

## API Reference

### Parsing Functions

- `parse(code, options?)`: Parse JavaScript/TypeScript synchronously
- `parseAsync(code, options?)`: Parse JavaScript/TypeScript asynchronously
- `createParser()`: Create a new parser instance

### Parse Options

```typescript
interface JSParseOptions {
  /** ECMAScript version (default: 'latest') */
  ecmaVersion?: acorn.ecmaVersion

  /** Source type: 'script' or 'module' (default: 'module') */
  sourceType?: 'script' | 'module'

  /** Enable TypeScript parsing (default: false) */
  typescript?: boolean

  /** Build query index for fast lookups */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]

  /** Allow return outside functions */
  allowReturnOutsideFunction?: boolean

  /** Allow await at top level */
  allowAwaitOutsideFunction?: boolean

  /** Allow hash bang (#!) at start */
  allowHashBang?: boolean
}
```

### Type Guards

- `isProgramNode(node)`: Check if node is root program
- `isIdentifier(node)`: Check if node is an identifier
- `isLiteral(node)`: Check if node is a literal value
- `isFunctionDeclaration(node)`: Check if node is a function declaration
- `isClassDeclaration(node)`: Check if node is a class declaration
- `isVariableDeclaration(node)`: Check if node is a variable declaration
- `isImportDeclaration(node)`: Check if node is an import statement
- `isExportDeclaration(node)`: Check if node is an export statement
- `isStatement(node)`: Check if node is any statement
- `isExpression(node)`: Check if node is any expression
- `isCallExpression(node)`: Check if node is a function call
- `isMemberExpression(node)`: Check if node is a member access
- `isArrowFunction(node)`: Check if node is an arrow function
- `isFunctionExpression(node)`: Check if node is a function expression

### Data Accessors

- `getIdentifierName(node)`: Get identifier name
- `getLiteralValue(node)`: Get literal value
- `getLiteralRaw(node)`: Get literal raw source
- `getVariableKind(node)`: Get variable kind ('var' | 'let' | 'const')
- `getFunctionName(node)`: Get function name
- `isAsync(node)`: Check if function is async
- `isGenerator(node)`: Check if function is a generator
- `getOperator(node)`: Get operator for binary/unary expressions
- `getSourceType(node)`: Get program source type

### Utility Functions

- `findImports(tree)`: Find all import declarations
- `findExports(tree)`: Find all export declarations
- `findFunctions(tree)`: Find all function declarations
- `findClasses(tree)`: Find all class declarations
- `findIdentifiersByName(tree, name)`: Find all identifiers with given name

## Node Structure

All nodes follow Synth's language-agnostic `BaseNode` interface:

```typescript
interface BaseNode {
  id: number
  type: string  // ESTree node type: 'FunctionDeclaration', 'VariableDeclaration', etc.
  parent: number | null
  children: number[]
  span?: {
    start: { offset: number; line: number; column: number }
    end: { offset: number; line: number; column: number }
  }
  data?: Record<string, unknown>  // JavaScript-specific data
}
```

JavaScript-specific data is stored in the `data` field:

```typescript
// Function declaration
{
  id: 5,
  type: 'FunctionDeclaration',
  parent: 0,
  children: [6, 7],  // Parameters and body
  data: {
    id: 'myFunction',  // Function name
    async: false,
    generator: false,
    expression: false
  }
}

// Variable declaration
{
  id: 2,
  type: 'VariableDeclaration',
  parent: 0,
  children: [3],  // Declarators
  data: {
    kind: 'const'  // 'var', 'let', or 'const'
  }
}
```

## Supported JavaScript Features

- **ES2024+**: All modern JavaScript syntax
- **Modules**: import/export statements
- **Classes**: class declarations, extends, methods
- **Functions**: declarations, expressions, arrow functions
- **Async/Await**: async functions and await expressions
- **Generators**: function* and yield
- **Destructuring**: object and array destructuring
- **Spread/Rest**: ...spread and ...rest operators
- **Template Literals**: `string ${interpolation}`
- **Optional Chaining**: obj?.prop
- **Nullish Coalescing**: value ?? default

## TypeScript Support

Enable TypeScript parsing with the `typescript` option:

```typescript
import { parse } from '@sylphx/synth-js'

const tree = parse(`
  interface User {
    name: string;
    age: number;
  }

  function greet(user: User): void {
    console.log(\`Hello, \${user.name}\`);
  }
`, { typescript: true })
```

Supported TypeScript features:
- Type annotations
- Interfaces
- Type aliases
- Enums
- Generics
- Decorators
- Namespaces

## Performance

Built on Acorn, one of the fastest JavaScript parsers:
- **Fast parsing**: Character-based parsing with minimal overhead
- **Efficient tree building**: Arena-based storage for cache locality
- **Low memory usage**: Optimized for large codebases

## Examples

### Analyze Module Dependencies

```typescript
import { parse, findImports, getIdentifierName } from '@sylphx/synth-js'

const code = `
  import React from 'react';
  import { useState, useEffect } from 'react';
  import './styles.css';
`

const tree = parse(code)
const imports = findImports(tree)

console.log(`Found ${imports.length} imports`)
```

### Find All Functions

```typescript
import { parse, findFunctions, getFunctionName } from '@sylphx/synth-js'

const code = `
  function foo() {}
  function bar() {}
  const baz = () => {};
`

const tree = parse(code)
const functions = findFunctions(tree)

functions.forEach(func => {
  console.log('Function:', getFunctionName(func))
})
```

### Transform AST

```typescript
import { parse } from '@sylphx/synth-js'
import { createTransformPlugin } from '@sylphx/synth'

// Rename all functions to have 'fn_' prefix
const renamePlugin = createTransformPlugin(
  { name: 'rename-functions', version: '1.0.0' },
  (tree) => {
    tree.nodes.forEach(node => {
      if (node.type === 'FunctionDeclaration' && node.data?.id) {
        node.data.id = `fn_${node.data.id}`
      }
    })
    return tree
  }
)

const tree = parse('function hello() {}', {
  plugins: [renamePlugin],
})
```

## License

MIT
