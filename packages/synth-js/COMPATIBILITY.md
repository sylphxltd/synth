# JavaScript Version Compatibility

This document explains how `@sylphx/synth-js` handles different JavaScript versions and evolving syntax.

## Strategy Overview

The parser uses a **layered compatibility approach**:

1. **Parser Layer** (synth-js): Universal - handles ALL syntax via Acorn
2. **Transform Layer** (plugins): Version-specific transformations
3. **Output Layer** (formatter/minifier): Incremental support for new features

## Parser Compatibility

### Automatic Support ✅

The parser **automatically supports new JavaScript syntax** without code changes because:

```typescript
// Generic conversion - no node type switching
private convertNode(tree: Tree, node: any, parentId: NodeId): NodeId {
  const { type, loc, range, start, end, ...data } = node

  // Just copy the type - works for ANY Acorn node type
  return addNode(tree, {
    type,  // ← New syntax? No problem!
    parent: parentId,
    children: [],
    data: this.cleanData(data),
  })
}
```

**Benefits:**
- ✅ ES2015 decorators? Supported
- ✅ ES2022 private fields? Supported
- ✅ ES2024 import defer? Supported
- ✅ Future ES2030 syntax? Will be supported

**Only requirement:** Update Acorn dependency

### Specifying Version

```typescript
import { parse } from '@sylphx/synth-js'

// Parse with specific ECMAScript version
const tree = parse(code, {
  ecmaVersion: 2024,  // ES2024
  // or: 'latest' for bleeding edge
})

// Enable TypeScript
const tsTree = parse(tsCode, {
  typescript: true,
  ecmaVersion: 'latest'
})
```

### Supported Versions

Via Acorn (current: v8.x):
- ES3 (1999)
- ES5 (2009)
- ES6/ES2015 → ES2024
- `'latest'` - All finished proposals

Via acorn-typescript plugin:
- TypeScript syntax (types, interfaces, enums, etc.)

## Formatter/Minifier Compatibility

### Current Support

The formatter/minifier have **incremental support** for syntax:

**Fully Supported:**
- ✅ Variable declarations (var, let, const)
- ✅ Functions (regular, arrow, async, generators)
- ✅ Classes (declarations, methods)
- ✅ Objects & Arrays
- ✅ Binary/Unary expressions
- ✅ Control flow (if, while, for)
- ✅ Import/Export (basic)
- ✅ Async/Await

**Partial Support:**
- ⚠️ Template literals (basic)
- ⚠️ Destructuring (basic)
- ⚠️ Spread operator (basic)

**Not Yet Supported:**
- ❌ Decorators
- ❌ Private fields (#field)
- ❌ Pipeline operator (|>)
- ❌ Record/Tuple (#{}, #[])

### Graceful Degradation

Unknown syntax gets placeholder output:

```typescript
// Input: ES2030 hypothetical syntax
const code = 'using x = resource()'

// Parser: ✅ Works - creates AST node
const tree = parse(code, { ecmaVersion: 2030 })
// → { type: 'UsingDeclaration', data: { ... }, children: [...] }

// Formatter: Placeholder until support added
format(code)
// → "/* UsingDeclaration */"
```

### Adding Support

To support new syntax in formatter/minifier:

```typescript
// In printer.ts
case 'UsingDeclaration':
  this.printUsingDeclaration(tree, node)
  break

private printUsingDeclaration(tree: Tree, node: BaseNode): void {
  this.writeIndent()
  this.write('using ')

  const id = node.data?.id
  if (id) {
    this.write(`${id} = `)
  }

  const init = tree.nodes[node.children[0]!]
  if (init) {
    this.printNode(tree, init)
  }

  if (this.options.semi) {
    this.write(';')
  }
}
```

## Plugin System for Custom Syntax

### Parser Plugins

Transform AST after parsing:

```typescript
import { parse } from '@sylphx/synth-js'

const decoratorPlugin = {
  name: 'decorator-transform',
  transform: (tree) => {
    // Transform decorator nodes
    // e.g., convert to function calls
    return transformedTree
  }
}

const tree = parse(code, {
  plugins: [decoratorPlugin]
})
```

### Formatter Plugins (Future)

Extend formatter with custom node handlers:

```typescript
import { ExtensiblePrinter } from '@sylphx/synth-js-format'

const printer = new ExtensiblePrinter()
  .use(decoratorPlugin)
  .use(pipelineOperatorPlugin)

const formatted = printer.print(tree)
```

## Version Management Strategy

### When JavaScript Updates

**New Syntax Released (e.g., ES2025):**

1. **Update Acorn** ✅
   ```bash
   bun update acorn
   ```
   - Parser now supports ES2025
   - No code changes needed

2. **Add Tests** ✅
   ```typescript
   it('should parse ES2025 deferred imports', () => {
     const code = 'import defer * as foo from "bar"'
     const tree = parse(code, { ecmaVersion: 2025 })

     expect(tree.nodes.some(n => n.type === 'ImportDeclaration')).toBe(true)
   })
   ```

3. **Add Formatter Support** (optional)
   ```typescript
   case 'ImportDeclaration':
     if (node.data?.defer) {
       this.write('import defer ')
     }
     // ...
   ```

### Backwards Compatibility

**Code parsed with older ecmaVersion:**
```typescript
// ES5 mode
parse(code, { ecmaVersion: 5 })

// Rejects:
// - let/const
// - arrow functions
// - classes
// - etc.
```

**Use case:** Validating legacy code

## Testing Strategy

### Version Matrix Testing

```typescript
describe('JavaScript Version Support', () => {
  const versions: acorn.ecmaVersion[] = [5, 6, 2015, 2020, 2024, 'latest']

  versions.forEach(version => {
    it(`should parse ES${version} syntax`, () => {
      const code = getCodeForVersion(version)
      const tree = parse(code, { ecmaVersion: version })
      expect(tree).toBeDefined()
    })
  })
})
```

### Regression Testing

```typescript
// Ensure old syntax still works
it('should parse ES5 code with ES2024 parser', () => {
  const es5Code = 'var x = 42; function foo() { return x; }'
  const tree = parse(es5Code, { ecmaVersion: 2024 })
  expect(tree).toBeDefined()
})
```

## Dependency Update Policy

### Acorn Updates

- **Patch updates** (8.11.x → 8.11.y): Auto-update
- **Minor updates** (8.x → 8.y): Review changelog, update
- **Major updates** (8.x → 9.x): Test thoroughly, check breaking changes

### acorn-typescript Updates

- Follow TypeScript version releases
- Test against major TS versions (4.x, 5.x)

## Real-World Examples

### Example 1: ES2022 Private Fields

```typescript
// Code with private fields
const code = `
  class Counter {
    #count = 0

    increment() {
      this.#count++
    }
  }
`

// Parser: ✅ Works automatically
const tree = parse(code, { ecmaVersion: 2022 })

// AST contains:
// - ClassDeclaration
// - PropertyDefinition (with private: true)
// - PrivateIdentifier (#count)

// Formatter: ⚠️ Needs implementation
format(code)  // Currently: "class Counter { /* PrivateIdentifier */ }"
```

### Example 2: TypeScript Enums

```typescript
// TypeScript enum
const tsCode = `
  enum Color {
    Red = 1,
    Green = 2,
    Blue = 3
  }
`

// Parser: ✅ Works with typescript: true
const tree = parse(tsCode, { typescript: true })

// AST contains:
// - TSEnumDeclaration
// - TSEnumMember nodes

// Can be transformed via plugins
```

### Example 3: Future Syntax

```typescript
// Hypothetical ES2026 pattern matching
const futureCode = `
  match (value) {
    when Number: console.log('number')
    when String: console.log('string')
  }
`

// When Acorn adds support:
// 1. Update acorn: bun update acorn
// 2. Parse works immediately: ✅
const tree = parse(futureCode, { ecmaVersion: 2026 })

// 3. Add formatter support as needed
// (Parser doesn't block on formatter support)
```

## Summary

**Parser (synth-js):**
- ✅ Automatic forward compatibility
- ✅ Update Acorn → get new syntax
- ✅ No code changes needed
- ✅ Universal AST structure

**Formatter/Minifier:**
- ⚠️ Incremental feature support
- ⚠️ Graceful degradation for unknown syntax
- ⚠️ Plugin system for extensions
- ⚠️ Add support as needed per feature

**Philosophy:**
- **Parse everything** (via Acorn)
- **Transform flexibly** (via plugins)
- **Output incrementally** (add as needed)

This approach balances:
- Forward compatibility (parse new syntax)
- Practical utility (format common syntax)
- Extensibility (plugins for custom needs)
