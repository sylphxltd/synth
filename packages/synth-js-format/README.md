# @sylphx/synth-js-format

Prettier-style code formatter for JavaScript/TypeScript using Synth's universal AST.

## Features

- **Consistent Formatting**: Opinionated code formatting like Prettier
- **Configurable Options**: Control indentation, quotes, semicolons, and more
- **Universal AST**: Works on Synth's language-agnostic AST
- **Fast**: Direct AST-to-code printing without intermediate transformations
- **TypeScript Support**: Format both JavaScript and TypeScript code

## Installation

```bash
bun install @sylphx/synth-js-format
```

## Usage

### Basic Formatting

```typescript
import { format } from '@sylphx/synth-js-format'

const code = 'const x=42;function hello(){return"world";}'
const formatted = format(code)

console.log(formatted)
// Output:
// const x = 42;
//
// function hello() {
//   return "world";
// }
```

### With Options

```typescript
import { format } from '@sylphx/synth-js-format'

const code = 'const x = 42;'

const formatted = format(code, {
  semi: false,           // No semicolons
  singleQuote: true,     // Use single quotes
  tabWidth: 4,           // 4 spaces per indent
  trailingComma: 'all',  // Trailing commas everywhere
})
```

### Using the Formatter Class

```typescript
import { Formatter } from '@sylphx/synth-js-format'

const formatter = new Formatter({
  printWidth: 120,
  semi: true,
  singleQuote: false,
})

const formatted = formatter.format('const x=42;')
console.log(formatted) // "const x = 42;"
```

### Check if Code is Formatted

```typescript
import { check } from '@sylphx/synth-js-format'

const code = 'const x = 42;'
const isFormatted = check(code)

if (!isFormatted) {
  console.log('Code needs formatting!')
}
```

### Format a Synth Tree Directly

```typescript
import { parse } from '@sylphx/synth-js'
import { Formatter } from '@sylphx/synth-js-format'

// Parse code to Synth AST
const tree = parse('const x=42;')

// Format the AST
const formatter = new Formatter()
const formatted = formatter.formatTree(tree)

console.log(formatted) // "const x = 42;"
```

## Options

All options are compatible with Prettier:

```typescript
interface FormatOptions {
  /** Print width - line length limit (default: 80) */
  printWidth?: number

  /** Number of spaces per indentation level (default: 2) */
  tabWidth?: number

  /** Use tabs instead of spaces (default: false) */
  useTabs?: boolean

  /** Add semicolons at end of statements (default: true) */
  semi?: boolean

  /** Use single quotes instead of double quotes (default: false) */
  singleQuote?: boolean

  /** Quote object properties (default: 'as-needed') */
  quoteProps?: 'as-needed' | 'consistent' | 'preserve'

  /** Use trailing commas (default: 'es5') */
  trailingComma?: 'none' | 'es5' | 'all'

  /** Add spaces inside object literals (default: true) */
  bracketSpacing?: boolean

  /** Put > of multi-line elements at end of last line (default: false) */
  bracketSameLine?: boolean

  /** Include parentheses around sole arrow function parameter (default: 'always') */
  arrowParens?: 'always' | 'avoid'

  /** Line ending type (default: 'lf') */
  endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto'
}
```

## Examples

### Different Formatting Styles

```typescript
import { format } from '@sylphx/synth-js-format'

const code = `const obj={a:1,b:2};function test(x,y){return x+y;}`

// Default (Prettier-like)
format(code)
// const obj = { a: 1, b: 2, };
//
// function test(x, y) {
//   return x + y;
// }

// Compact style
format(code, {
  semi: false,
  bracketSpacing: false,
  printWidth: 120,
})
// const obj = {a: 1, b: 2}
//
// function test(x, y) {
//   return x + y
// }

// Tabs and single quotes
format(code, {
  useTabs: true,
  singleQuote: true,
  trailingComma: 'none',
})
```

### Format TypeScript

```typescript
import { format } from '@sylphx/synth-js-format'

const tsCode = `
interface User{name:string;age:number;}
function greet(user:User):void{console.log(user.name);}
`

const formatted = format(tsCode)
// Note: Type annotations are preserved but not specially formatted yet
```

### Check Before Formatting

```typescript
import { format, check } from '@sylphx/synth-js-format'

const code = readFileSync('app.js', 'utf-8')

if (!check(code)) {
  const formatted = format(code)
  writeFileSync('app.js', formatted)
  console.log('Formatted app.js')
} else {
  console.log('app.js is already formatted')
}
```

## API Reference

### Functions

- `format(code, options?)`: Format JavaScript code string
- `check(code, options?)`: Check if code is already formatted
- `createFormatter(options?)`: Create a new Formatter instance

### Classes

- `Formatter`: Main formatter class
  - `constructor(options?)`: Create formatter with options
  - `format(code, options?)`: Format code string
  - `formatTree(tree, options?)`: Format Synth AST tree
  - `check(code, options?)`: Check if code is formatted

- `Printer`: Low-level AST-to-code printer
  - `constructor(options?)`: Create printer with options
  - `print(tree)`: Convert Synth tree to formatted code

## Supported JavaScript Features

- ✅ Variable declarations (var, let, const)
- ✅ Function declarations and expressions
- ✅ Arrow functions
- ✅ Classes and methods
- ✅ Object and array literals
- ✅ Binary and unary expressions
- ✅ If statements
- ✅ Return statements
- ✅ Block statements
- ✅ Call expressions
- ✅ Member expressions
- ✅ Import/export statements
- ✅ Async/await
- ⚠️ Template literals (basic support)
- ⚠️ Generators (basic support)
- ⚠️ For/while loops (basic support)

## How It Works

1. **Parse**: JavaScript code → Synth AST (via `@sylphx/synth-js`)
2. **Print**: Synth AST → Formatted code (via `Printer`)

The formatter works directly on Synth's universal AST, which means:
- **Fast**: Single-pass printing without intermediate representations
- **Extensible**: Easy to add new formatting rules
- **Universal**: Same AST structure works for all languages

## Performance

The formatter is designed for speed:
- Direct AST traversal without copying
- Minimal string allocations
- No intermediate representations

## Limitations

This is a foundational implementation focused on core JavaScript features. Advanced features may have basic support:

- Complex destructuring patterns
- JSX/TSX (React)
- Decorators
- Some edge cases in template literals

Contributions welcome to expand support!

## Comparison with Prettier

This formatter is inspired by Prettier but works on Synth's universal AST:

**Similarities:**
- Opinionated formatting
- Configurable options
- Focus on consistency

**Differences:**
- Works on universal AST (can format multiple languages)
- Simpler implementation (educational/foundational)
- Smaller feature set (core JavaScript focus)

## Use Cases

- **Learning**: Understand how code formatters work
- **Prototyping**: Quick formatting in Synth-based tools
- **Integration**: Format code in Synth AST pipelines
- **Foundation**: Build custom formatters for other languages

## License

MIT
