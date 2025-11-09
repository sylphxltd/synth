# @sylphx/synth-java

Java parser using Synth's universal AST. Conversion layer over tree-sitter-java.

## Features

- ✅ **Strategic Dependency** - Uses tree-sitter-java (battle-tested Java parser)
- 🚀 **Full Java Support** - Java 8 through Java 21+ features
- 🎯 **Universal AST** - Converts tree-sitter CST to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Battle-Tested** - tree-sitter powers VS Code, Atom, and many other editors

## Installation

```bash
npm install @sylphx/synth-java
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-java'

const java = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`

const tree = parse(java)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { JavaParser, createParser, parse, parseAsync } from '@sylphx/synth-java'

// Standalone function (recommended)
const tree = parse('int x = 42;')

// Async parsing (for plugins)
const tree = await parseAsync('int x = 42;')

// Class instance
const parser = new JavaParser()
const tree = parser.parse('int x = 42;')

// Factory function
const parser = createParser()
const tree = parser.parse('int x = 42;')
```

### Plugin System

```typescript
import { parse, parseAsync, type Tree } from '@sylphx/synth-java'

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
  type: 'MethodDeclaration',  // Mapped from tree-sitter type
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    text: 'public void method()...',   // Original source text
    isNamed: true,                      // tree-sitter named node
    originalType: 'method_declaration'  // Original tree-sitter type
  }
}
```

## Supported Java Features

### Data Types
- ✅ Primitive types (`int`, `long`, `double`, `float`, `boolean`, `char`, `byte`, `short`)
- ✅ String literals (`"text"`)
- ✅ Integer literals (decimal, hex, octal, binary)
- ✅ Floating point literals (`3.14`, `1.5e10`)
- ✅ Boolean literals (`true`, `false`)
- ✅ Character literals (`'a'`)
- ✅ `null` literal
- ✅ Arrays (`int[]`, `String[][]`)

### Control Flow
- ✅ `if/else if/else` statements
- ✅ `for` loops (traditional and enhanced)
- ✅ `while` loops
- ✅ `do-while` loops
- ✅ `switch` statements (including switch expressions - Java 14+)
- ✅ `try/catch/finally`
- ✅ `break`, `continue`, `return`
- ✅ `throw` statements

### Classes and Objects
- ✅ Class declarations (`class MyClass`)
- ✅ Constructors
- ✅ Fields (instance and static)
- ✅ Methods (instance and static)
- ✅ Access modifiers (`public`, `private`, `protected`, package-private)
- ✅ Abstract classes and methods
- ✅ Final classes, methods, and variables
- ✅ Inner classes, nested classes, anonymous classes
- ✅ Interfaces
- ✅ Enums
- ✅ Records (Java 14+)

### Inheritance
- ✅ `extends` keyword
- ✅ `implements` keyword
- ✅ Method overriding (`@Override`)
- ✅ `super` keyword
- ✅ `this` keyword

### Generics
- ✅ Generic classes (`class Box<T>`)
- ✅ Generic methods (`<T> T getValue()`)
- ✅ Type parameters and bounds (`<T extends Number>`)
- ✅ Wildcards (`? extends`, `? super`)
- ✅ Generic type usage (`List<String>`)

### Annotations
- ✅ Built-in annotations (`@Override`, `@Deprecated`, `@SuppressWarnings`)
- ✅ Custom annotations
- ✅ Annotation elements
- ✅ Meta-annotations (`@Target`, `@Retention`)

### Lambda Expressions (Java 8+)
- ✅ Lambda expressions (`x -> x * x`)
- ✅ Method references (`String::length`)
- ✅ Functional interfaces

### Packages and Imports
- ✅ Package declarations (`package com.example;`)
- ✅ Import statements (`import java.util.List;`)
- ✅ Static imports (`import static Math.PI;`)
- ✅ Wildcard imports (`import java.util.*;`)

### Modern Java Features
- ✅ var keyword (Java 10+)
- ✅ Switch expressions (Java 14+)
- ✅ Records (Java 14+)
- ✅ Pattern matching for instanceof (Java 16+)
- ✅ Sealed classes (Java 17+)
- ✅ Text blocks (Java 15+)

### Operators
- ✅ Arithmetic (`+`, `-`, `*`, `/`, `%`)
- ✅ Comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`)
- ✅ Logical (`&&`, `||`, `!`)
- ✅ Bitwise (`&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`)
- ✅ Assignment (`=`, `+=`, `-=`, etc.)
- ✅ Ternary (`? :`)
- ✅ instanceof operator

### Comments
- ✅ Line comments (`// comment`)
- ✅ Block comments (`/* comment */`)
- ✅ Javadoc comments (`/** @param ... */`)

## Examples

### Parse a Class

```typescript
import { parse } from '@sylphx/synth-java'

const java = `
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public int subtract(int a, int b) {
        return a - b;
    }
}
`

const tree = parse(java)

// Find class declaration
const classNode = tree.nodes.find(n => n.type === 'ClassDeclaration')
console.log(classNode)

// Find method declarations
const methodNodes = tree.nodes.filter(n => n.type === 'MethodDeclaration')
console.log(methodNodes)
```

### Parse with Generics

```typescript
import { parse } from '@sylphx/synth-java'

const java = `
public class Box<T> {
    private T value;

    public Box(T value) {
        this.value = value;
    }

    public T getValue() {
        return value;
    }
}
`

const tree = parse(java)

// Find type parameters
const typeParams = tree.nodes.find(n => n.type === 'TypeParameters')
console.log(typeParams)
```

### Parse Lambda Expressions

```typescript
import { parse } from '@sylphx/synth-java'

const java = `
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
names.stream()
     .filter(name -> name.startsWith("A"))
     .forEach(System.out::println);
`

const tree = parse(java)

// Find lambda expressions
const lambdaNodes = tree.nodes.filter(n => n.type === 'LambdaExpression')
console.log(lambdaNodes)
```

### Parse Annotations

```typescript
import { parse } from '@sylphx/synth-java'

const java = `
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private String username;
}
`

const tree = parse(java)

// Find all annotations
const annotations = tree.nodes.filter(n => n.type.includes('Annotation'))
console.log(annotations)
```

### Apply Plugin

```typescript
import { parse, type Tree, type Node } from '@sylphx/synth-java'

// Plugin to count methods
const methodCounterPlugin = {
  name: 'method-counter',
  transform(tree: Tree) {
    const methods = tree.nodes.filter(n => n.type === 'MethodDeclaration')
    console.log(`Found ${methods.length} methods`)
    return tree
  }
}

const java = `
public class Example {
    public void method1() {}
    public void method2() {}
    public void method3() {}
}
`

const tree = parse(java, { plugins: [methodCounterPlugin] })
// Output: Found 3 methods
```

## Use Cases

- **Code Analysis** - Analyze Java codebases for patterns, complexity, dependencies
- **Linting** - Build custom linters for Java code
- **Documentation** - Generate API docs from source code
- **Refactoring** - Automate code transformations
- **Metrics** - Calculate code metrics (cyclomatic complexity, LOC, etc.)
- **IDE Features** - Power autocomplete, go-to-definition, find references
- **Code Generation** - Generate Java code from templates
- **Migration Tools** - Automate Java version upgrades

## Performance

- **Fast Parsing** - tree-sitter is highly optimized
- **Incremental Parsing** - tree-sitter supports incremental re-parsing
- **Low Memory** - Synth's arena-based storage is memory efficient
- **O(1) Node Access** - NodeId-based access is constant time

## Architecture

```
Java Source Code
      ↓
tree-sitter-java (parse)
      ↓
tree-sitter CST
      ↓
@sylphx/synth-java (convert)
      ↓
Synth Universal AST
      ↓
Plugins (transform)
      ↓
Final AST
```

## Why tree-sitter-java?

- ✅ **Battle-Tested** - Powers VS Code, Atom, Neovim, and GitHub's code navigation
- ✅ **Complete** - Supports all Java versions including latest features
- ✅ **Fast** - Written in C, highly optimized
- ✅ **Incremental** - Supports incremental parsing for editors
- ✅ **Error Recovery** - Handles partial/invalid code gracefully
- ✅ **Maintained** - Actively maintained by the tree-sitter community

**Our Value:** Universal AST format, cross-language tools, plugin system, and TypeScript API.

## API Reference

### `parse(source, options?)`

Parse Java source code synchronously.

```typescript
const tree = parse('int x = 42;')
```

### `parseAsync(source, options?)`

Parse Java source code asynchronously (for async plugins).

```typescript
const tree = await parseAsync('int x = 42;')
```

### `createParser()`

Create a new JavaParser instance.

```typescript
const parser = createParser()
```

### `JavaParser`

Main parser class with plugin support.

```typescript
const parser = new JavaParser()
parser.use(plugin)
const tree = parser.parse('int x = 42;')
```

### Options

```typescript
interface JavaParseOptions {
  buildIndex?: boolean    // Build query index (not yet implemented)
  plugins?: Plugin[]      // Plugins to apply
  javaVersion?: 8 | 11 | 17 | 21  // Java version (for compatibility)
}
```

## License

MIT

---

**Part of the Synth universal AST ecosystem** - Works seamlessly with all other Synth parsers and tools.
