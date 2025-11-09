# @sylphx/synth-ruby

Ruby parser using Synth's universal AST. Conversion layer over tree-sitter-ruby.

## Features

- ✅ **Strategic Dependency** - Uses tree-sitter-ruby (battle-tested Ruby parser)
- 🚀 **Full Ruby Support** - Ruby 2 and Ruby 3+ features
- 🎯 **Universal AST** - Converts tree-sitter CST to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Battle-Tested** - tree-sitter powers VS Code, Atom, and many other editors

## Installation

```bash
npm install @sylphx/synth-ruby
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-ruby'

const ruby = `
def greet(name)
  "Hello, \#{name}!"
end

puts greet("World")
`

const tree = parse(ruby)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { RubyParser, createParser, parse, parseAsync } from '@sylphx/synth-ruby'

// Standalone function (recommended)
const tree = parse('x = 42')

// Async parsing (for plugins)
const tree = await parseAsync('x = 42')

// Class instance
const parser = new RubyParser()
const tree = parser.parse('x = 42')

// Factory function
const parser = createParser()
const tree = parser.parse('x = 42')
```

### Plugin System

```typescript
import { parse, parseAsync, type Tree } from '@sylphx/synth-ruby'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse('x = 42', { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync('x = 42', { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting tree-sitter's concrete syntax tree. Each node includes:

### Node Structure

```typescript
{
  type: 'Method',  // Mapped from tree-sitter type
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    text: 'def greet()...',            // Original source text
    isNamed: true,                      // tree-sitter named node
    originalType: 'method'              // Original tree-sitter type
  }
}
```

## Supported Ruby Features

### Data Types
- ✅ Strings (single `'...'`, double `"..."`, with interpolation)
- ✅ Symbols (`:symbol`, `:"symbol with spaces"`)
- ✅ Integers (decimal, hex, octal, binary)
- ✅ Floats (`3.14`, `1.5e10`)
- ✅ Booleans (`true`, `false`)
- ✅ `nil`
- ✅ Arrays (`[1, 2, 3]`)
- ✅ Hashes (`{ key: value }`, `{ "key" => value }`)
- ✅ Ranges (`1..10`, `1...10`)
- ✅ Regular expressions (`/pattern/`, `%r{pattern}`)

### Control Flow
- ✅ `if/elsif/else` statements
- ✅ `unless` statements
- ✅ `case/when/else` statements
- ✅ `while` loops
- ✅ `until` loops
- ✅ `for` loops
- ✅ `break`, `next`, `redo`, `retry`, `return`
- ✅ Modifier forms (`puts x if condition`)
- ✅ `begin/rescue/ensure/end`

### Methods
- ✅ Method definitions (`def method_name`)
- ✅ Parameters and default values
- ✅ Splat operator (`*args`, `**kwargs`)
- ✅ Keyword arguments
- ✅ Block parameters (`&block`)
- ✅ Question mark methods (`empty?`)
- ✅ Bang methods (`save!`)
- ✅ Operator methods (`+`, `-`, `[]`, etc.)

### Blocks and Procs
- ✅ Blocks with `do...end`
- ✅ Blocks with `{...}`
- ✅ Block parameters (`|x|`, `|x, y|`)
- ✅ `Proc.new`
- ✅ `lambda` keyword
- ✅ Stabby lambda (`->(x) { x * 2 }`)
- ✅ `yield`

### Classes and Modules
- ✅ Class definitions (`class MyClass`)
- ✅ Module definitions (`module MyModule`)
- ✅ Inheritance (`class Child < Parent`)
- ✅ Module inclusion (`include`, `extend`, `prepend`)
- ✅ Initialize method (`def initialize`)
- ✅ Instance variables (`@name`)
- ✅ Class variables (`@@count`)
- ✅ Class methods (`def self.method`)
- ✅ `attr_reader`, `attr_writer`, `attr_accessor`
- ✅ Constants (`CONSTANT_NAME`)
- ✅ Singleton methods

### Metaprogramming
- ✅ `define_method`
- ✅ `method_missing`
- ✅ `send`, `public_send`
- ✅ `instance_eval`, `class_eval`
- ✅ `alias`, `alias_method`
- ✅ `private`, `protected`, `public`

### Operators
- ✅ Arithmetic (`+`, `-`, `*`, `/`, `%`, `**`)
- ✅ Comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`, `<=>`, `===`)
- ✅ Logical (`&&`, `||`, `!`, `and`, `or`, `not`)
- ✅ Bitwise (`&`, `|`, `^`, `~`, `<<`, `>>`)
- ✅ Assignment (`=`, `+=`, `-=`, `||=`, `&&=`)
- ✅ Ternary (`? :`)
- ✅ Range operators (`..`, `...`)
- ✅ Safe navigation (`&.`)

### Special Features
- ✅ String interpolation (`"Hello, \#{name}!"`)
- ✅ Percent literals (`%w[a b c]`, `%i[a b c]`)
- ✅ Here documents (heredoc)
- ✅ Global variables (`$global`)
- ✅ Special variables (`$0`, `$1`, etc.)
- ✅ BEGIN and END blocks

### Comments
- ✅ Line comments (`# comment`)
- ✅ Block comments (`=begin ... =end`)

## Examples

### Parse a Class

```typescript
import { parse } from '@sylphx/synth-ruby'

const ruby = `
class Calculator
  def add(a, b)
    a + b
  end

  def subtract(a, b)
    a - b
  end
end
`

const tree = parse(ruby)

// Find class
const classNode = tree.nodes.find(n => n.type === 'Class')
console.log(classNode)

// Find methods
const methodNodes = tree.nodes.filter(n => n.type === 'Method' || n.type.includes('Method'))
console.log(methodNodes)
```

### Parse Blocks

```typescript
import { parse } from '@sylphx/synth-ruby'

const ruby = `
[1, 2, 3].each do |n|
  puts n * 2
end
`

const tree = parse(ruby)

// Find block
const blockNode = tree.nodes.find(n => n.type === 'Block' || n.type === 'DoBlock')
console.log(blockNode)
```

### Parse Lambda

```typescript
import { parse } from '@sylphx/synth-ruby'

const ruby = `
double = ->(x) { x * 2 }
result = double.call(21)
`

const tree = parse(ruby)

// Find lambda
const lambdaNode = tree.nodes.find(n => n.type === 'Lambda')
console.log(lambdaNode)
```

### Parse String Interpolation

```typescript
import { parse } from '@sylphx/synth-ruby'

const ruby = `
name = "World"
greeting = "Hello, \#{name}!"
`

const tree = parse(ruby)

// Find interpolation
const interpolNode = tree.nodes.find(n => n.type.includes('Interpolation'))
console.log(interpolNode)
```

### Apply Plugin

```typescript
import { parse, type Tree, type Node } from '@sylphx/synth-ruby'

// Plugin to count methods
const methodCounterPlugin = {
  name: 'method-counter',
  transform(tree: Tree) {
    const methods = tree.nodes.filter(n => n.type === 'Method' || n.type.includes('Method'))
    console.log(`Found ${methods.length} methods`)
    return tree
  }
}

const ruby = `
class Example
  def method1; end
  def method2; end
  def method3; end
end
`

const tree = parse(ruby, { plugins: [methodCounterPlugin] })
// Output: Found 3 methods
```

## Use Cases

- **Code Analysis** - Analyze Ruby codebases for patterns, complexity, dependencies
- **Linting** - Build custom linters for Ruby code (RuboCop alternative)
- **Documentation** - Generate API docs from YARD comments
- **Refactoring** - Automate code transformations
- **Metrics** - Calculate code metrics (cyclomatic complexity, LOC, etc.)
- **IDE Features** - Power autocomplete, go-to-definition, find references
- **Code Generation** - Generate Ruby code from templates
- **Migration Tools** - Automate Ruby version upgrades
- **Security Analysis** - Detect security vulnerabilities (SQL injection, etc.)
- **Rails Analysis** - Analyze Rails applications (models, controllers, routes)

## Performance

- **Fast Parsing** - tree-sitter is highly optimized
- **Incremental Parsing** - tree-sitter supports incremental re-parsing
- **Low Memory** - Synth's arena-based storage is memory efficient
- **O(1) Node Access** - NodeId-based access is constant time

## Architecture

```
Ruby Source Code
      ↓
tree-sitter-ruby (parse)
      ↓
tree-sitter CST
      ↓
@sylphx/synth-ruby (convert)
      ↓
Synth Universal AST
      ↓
Plugins (transform)
      ↓
Final AST
```

## Why tree-sitter-ruby?

- ✅ **Battle-Tested** - Powers VS Code, Atom, Neovim, and GitHub's code navigation
- ✅ **Complete** - Supports Ruby 2 and Ruby 3+ including latest features
- ✅ **Fast** - Written in C, highly optimized
- ✅ **Incremental** - Supports incremental parsing for editors
- ✅ **Error Recovery** - Handles partial/invalid code gracefully
- ✅ **Maintained** - Actively maintained by the tree-sitter community

**Our Value:** Universal AST format, cross-language tools, plugin system, and TypeScript API.

## API Reference

### `parse(source, options?)`

Parse Ruby source code synchronously.

```typescript
const tree = parse('x = 42')
```

### `parseAsync(source, options?)`

Parse Ruby source code asynchronously (for async plugins).

```typescript
const tree = await parseAsync('x = 42')
```

### `createParser()`

Create a new RubyParser instance.

```typescript
const parser = createParser()
```

### `RubyParser`

Main parser class with plugin support.

```typescript
const parser = new RubyParser()
parser.use(plugin)
const tree = parser.parse('x = 42')
```

### Options

```typescript
interface RubyParseOptions {
  buildIndex?: boolean    // Build query index (not yet implemented)
  plugins?: Plugin[]      // Plugins to apply
  rubyVersion?: 2 | 3     // Ruby version (for compatibility)
}
```

## License

MIT

---

**Part of the Synth universal AST ecosystem** - Works seamlessly with all other Synth parsers and tools.
