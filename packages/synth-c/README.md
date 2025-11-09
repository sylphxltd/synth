# @sylphx/synth-c

C parser using Synth's universal AST. Conversion layer over tree-sitter-c.

## Features

- ✅ **Strategic Dependency** - Uses tree-sitter-c (battle-tested C parser)
- 🚀 **Full C Support** - C99, C11, C17, and C23 standards
- 🎯 **Universal AST** - Converts tree-sitter CST to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Battle-Tested** - tree-sitter powers VS Code, Atom, and many other editors

## Installation

```bash
npm install @sylphx/synth-c
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-c'

const c = `
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`

const tree = parse(c)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { CParser, createParser, parse, parseAsync } from '@sylphx/synth-c'

// Standalone function (recommended)
const tree = parse('int x = 42;')

// Async parsing (for plugins)
const tree = await parseAsync('int x = 42;')

// Class instance
const parser = new CParser()
const tree = parser.parse('int x = 42;')

// Factory function
const parser = createParser()
const tree = parser.parse('int x = 42;')
```

### Plugin System

```typescript
import { parse, parseAsync, type Tree } from '@sylphx/synth-c'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse('int x = 42;', { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync('int x = 42;', { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting tree-sitter's concrete syntax tree. Each node includes:

### Node Structure

```typescript
{
  type: 'FunctionDefinition',  // Mapped from tree-sitter type
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    text: 'int add()...',              // Original source text
    isNamed: true,                      // tree-sitter named node
    originalType: 'function_definition' // Original tree-sitter type
  }
}
```

## Supported C Features

### Data Types
- ✅ Primitive types (`int`, `long`, `short`, `char`, `float`, `double`)
- ✅ Unsigned types (`unsigned int`, `unsigned long`, etc.)
- ✅ `void` type
- ✅ Boolean type (`_Bool`, `bool` with `<stdbool.h>`)
- ✅ `size_t`, `ptrdiff_t` (stddef.h)
- ✅ Fixed-width integers (`int32_t`, `uint64_t`, etc.)

### Pointers
- ✅ Pointer declaration (`int *ptr`)
- ✅ Dereference operator (`*ptr`)
- ✅ Address-of operator (`&var`)
- ✅ Pointer arithmetic
- ✅ Null pointer (`NULL`)
- ✅ Void pointers (`void *`)
- ✅ Function pointers
- ✅ Double/triple pointers (`int **`, `int ***`)

### Arrays
- ✅ Array declaration (`int arr[10]`)
- ✅ Array initialization (`int arr[] = {1, 2, 3}`)
- ✅ Multidimensional arrays (`int matrix[3][3]`)
- ✅ Variable-length arrays (VLA) (C99+)
- ✅ Array access (`arr[i]`)
- ✅ Array decay to pointer

### Structs and Unions
- ✅ Struct definition (`struct Point { int x, y; }`)
- ✅ Struct declaration and initialization
- ✅ Anonymous structs
- ✅ Union definition
- ✅ Bit fields
- ✅ Member access (`.` operator)
- ✅ Pointer member access (`->` operator)
- ✅ Nested structs

### Control Flow
- ✅ `if/else if/else` statements
- ✅ `for` loops (traditional and C99-style with declarations)
- ✅ `while` loops
- ✅ `do-while` loops
- ✅ `switch/case/default` statements
- ✅ `break`, `continue`, `return`
- ✅ `goto` and labels

### Functions
- ✅ Function declarations
- ✅ Function definitions
- ✅ Function calls
- ✅ Parameters and return values
- ✅ Variadic functions (`...`)
- ✅ Static functions
- ✅ Inline functions (C99+)
- ✅ Function pointers

### Preprocessor
- ✅ `#include` (system and local)
- ✅ `#define` (constants and macros)
- ✅ `#ifdef`, `#ifndef`, `#if`, `#else`, `#elif`, `#endif`
- ✅ `#undef`
- ✅ `#pragma`
- ✅ `#error`, `#warning`
- ✅ Macro functions
- ✅ Predefined macros (`__FILE__`, `__LINE__`, etc.)

### Operators
- ✅ Arithmetic (`+`, `-`, `*`, `/`, `%`)
- ✅ Comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`)
- ✅ Logical (`&&`, `||`, `!`)
- ✅ Bitwise (`&`, `|`, `^`, `~`, `<<`, `>>`)
- ✅ Assignment (`=`, `+=`, `-=`, `*=`, `/=`, etc.)
- ✅ Increment/decrement (`++`, `--`)
- ✅ Ternary operator (`? :`)
- ✅ Comma operator (`,`)
- ✅ `sizeof` operator
- ✅ Cast operator (`(type)`)

### Storage Classes
- ✅ `auto` (implicit)
- ✅ `register`
- ✅ `static`
- ✅ `extern`
- ✅ `typedef`

### Type Qualifiers
- ✅ `const`
- ✅ `volatile`
- ✅ `restrict` (C99+)
- ✅ `_Atomic` (C11+)

### Modern C Features
- ✅ C99: Compound literals, designated initializers, inline, VLAs
- ✅ C11: Generic selections (`_Generic`), static assertions (`_Static_assert`)
- ✅ C11: Thread-local storage (`_Thread_local`)
- ✅ C11: Unicode support (`char16_t`, `char32_t`)
- ✅ C17: Minor bug fixes and clarifications
- ✅ C23: `typeof`, `constexpr`, improved type inference

### Comments
- ✅ Line comments (`// comment`)
- ✅ Block comments (`/* comment */`)

## Examples

### Parse a Function

```typescript
import { parse } from '@sylphx/synth-c'

const c = `
int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}
`

const tree = parse(c)

// Find function definitions
const funcNodes = tree.nodes.filter(n => n.type === 'FunctionDefinition')
console.log(funcNodes)
```

### Parse Struct

```typescript
import { parse } from '@sylphx/synth-c'

const c = `
struct Point {
    int x;
    int y;
};

struct Point p = {10, 20};
`

const tree = parse(c)

// Find struct definition
const structNode = tree.nodes.find(n => n.type.includes('Struct'))
console.log(structNode)
```

### Parse Pointers

```typescript
import { parse } from '@sylphx/synth-c'

const c = `
int x = 42;
int *ptr = &x;
int value = *ptr;
`

const tree = parse(c)

// Find pointer operations
const ptrNodes = tree.nodes.filter(n => n.type.includes('Pointer'))
console.log(ptrNodes)
```

### Parse Preprocessor

```typescript
import { parse } from '@sylphx/synth-c'

const c = `
#include <stdio.h>
#define PI 3.14159
#define MAX(a, b) ((a) > (b) ? (a) : (b))

#ifdef DEBUG
    #define LOG(msg) printf("DEBUG: %s\\n", msg)
#else
    #define LOG(msg)
#endif
`

const tree = parse(c)

// Find preprocessor directives
const preprocNodes = tree.nodes.filter(n => n.type.includes('Preproc'))
console.log(preprocNodes)
```

### Apply Plugin

```typescript
import { parse, type Tree, type Node } from '@sylphx/synth-c'

// Plugin to count functions
const functionCounterPlugin = {
  name: 'function-counter',
  transform(tree: Tree) {
    const functions = tree.nodes.filter(n => n.type === 'FunctionDefinition')
    console.log(`Found ${functions.length} functions`)
    return tree
  }
}

const c = `
int foo() { return 1; }
int bar() { return 2; }
int baz() { return 3; }
`

const tree = parse(c, { plugins: [functionCounterPlugin] })
// Output: Found 3 functions
```

## Use Cases

- **Code Analysis** - Analyze C codebases for patterns, complexity, dependencies
- **Linting** - Build custom linters for C code (like cppcheck)
- **Documentation** - Generate API docs from Doxygen-style comments
- **Refactoring** - Automate code transformations
- **Metrics** - Calculate code metrics (cyclomatic complexity, LOC, etc.)
- **IDE Features** - Power autocomplete, go-to-definition, find references
- **Code Generation** - Generate C code from templates or DSLs
- **Static Analysis** - Detect bugs, security vulnerabilities, undefined behavior
- **Cross-compilation** - Analyze code for different target platforms
- **Embedded Systems** - Analyze firmware code, memory usage
- **Kernel Development** - Analyze Linux kernel modules
- **Security Auditing** - Find buffer overflows, use-after-free, etc.

## Performance

- **Fast Parsing** - tree-sitter is highly optimized
- **Incremental Parsing** - tree-sitter supports incremental re-parsing
- **Low Memory** - Synth's arena-based storage is memory efficient
- **O(1) Node Access** - NodeId-based access is constant time

## Architecture

```
C Source Code
      ↓
tree-sitter-c (parse)
      ↓
tree-sitter CST
      ↓
@sylphx/synth-c (convert)
      ↓
Synth Universal AST
      ↓
Plugins (transform)
      ↓
Final AST
```

## Why tree-sitter-c?

- ✅ **Battle-Tested** - Powers VS Code, Atom, Neovim, and GitHub's code navigation
- ✅ **Complete** - Supports C99, C11, C17, and C23
- ✅ **Fast** - Written in C, highly optimized
- ✅ **Incremental** - Supports incremental parsing for editors
- ✅ **Error Recovery** - Handles partial/invalid code gracefully
- ✅ **Maintained** - Actively maintained by the tree-sitter community

**Our Value:** Universal AST format, cross-language tools, plugin system, and TypeScript API.

## API Reference

### `parse(source, options?)`

Parse C source code synchronously.

```typescript
const tree = parse('int x = 42;')
```

### `parseAsync(source, options?)`

Parse C source code asynchronously (for async plugins).

```typescript
const tree = await parseAsync('int x = 42;')
```

### `createParser()`

Create a new CParser instance.

```typescript
const parser = createParser()
```

### `CParser`

Main parser class with plugin support.

```typescript
const parser = new CParser()
parser.use(plugin)
const tree = parser.parse('int x = 42;')
```

### Options

```typescript
interface CParseOptions {
  buildIndex?: boolean    // Build query index (not yet implemented)
  plugins?: Plugin[]      // Plugins to apply
  standard?: 'c99' | 'c11' | 'c17' | 'c23'  // C standard (default: 'c11')
}
```

## License

MIT

---

**Part of the Synth universal AST ecosystem** - Works seamlessly with all other Synth parsers and tools.
