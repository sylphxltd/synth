# @sylphx/synth-lint

Universal linter framework for Synth AST - works across all languages.

## Features

- ✅ **Universal Rules** - Write once, lint across all languages
- 🚀 **Language-Agnostic** - Rules work on Synth's universal AST
- 🎯 **ESLint-like API** - Familiar rule and visitor patterns
- 🔌 **Extensible** - Easy to add custom rules
- 📦 **Built-in Rules** - Common rules included out of the box
- ⚡ **Fast** - Leverages Synth's performance-optimized AST

## Installation

```bash
npm install @sylphx/synth-lint
```

## Usage

### Quick Start

```typescript
import { createLinter, builtinRules } from '@sylphx/synth-lint'
import { parse } from '@sylphx/synth-js'

const linter = createLinter()
linter.addRules(builtinRules)

const tree = parse('function test() {}')
const result = linter.lint(tree)

console.log(result.diagnostics)
console.log(result.counts)  // { error: 0, warning: 1, info: 0, hint: 0 }
console.log(result.success) // true if no errors
```

### Basic API

```typescript
import { Linter } from '@sylphx/synth-lint'

// Create linter
const linter = new Linter()

// Add rules
linter.addRule(noEmptyBlocks)
linter.addRules([noConsole, maxDepth])

// Configure
linter.configure({
  rules: {
    'no-empty-blocks': 'error',  // Override severity
    'no-console': true,           // Enable rule
    'max-depth': false            // Disable rule
  },
  severity: 'warning'  // Filter: only show warnings and errors
})

// Lint a tree
const result = linter.lint(tree)
```

## Built-in Rules

### no-empty-blocks

Disallows empty blocks across all languages.

```typescript
import { noEmptyBlocks } from '@sylphx/synth-lint'

linter.addRule(noEmptyBlocks)
```

**Examples:**

```javascript
// ❌ Warning: Empty BlockStatement block
function test() {}

// ❌ Warning: Empty ClassBody block
class User {}

// ✅ OK: Block has content
function test() {
  return 42
}
```

Works across:
- JavaScript/TypeScript functions, classes, objects
- CSS blocks, rules
- HTML/XML elements
- Markdown blockquotes, lists
- Any language with block/container nodes

### no-console

Disallows console statements (JavaScript/TypeScript only).

```typescript
import { noConsole } from '@sylphx/synth-lint'

linter.addRule(noConsole)
linter.configure({ rules: { 'no-console': true } }) // Disabled by default
```

**Examples:**

```javascript
// ❌ Warning: Unexpected console statement
console.log('debug')
console.error('error')
console.warn('warning')

// ✅ OK: No console usage
logger.info('Using proper logger')
```

### max-depth

Enforces maximum nesting depth (default: 4 levels).

```typescript
import { maxDepth } from '@sylphx/synth-lint'

linter.addRule(maxDepth)
```

**Examples:**

```javascript
// ❌ Warning: Nesting depth of 5 exceeds maximum allowed depth of 4
function test() {
  if (true) {
    if (true) {
      if (true) {
        if (true) {
          if (true) {  // Too deep!
            return 42
          }
        }
      }
    }
  }
}

// ✅ OK: Depth within limits
function test() {
  if (true) {
    if (true) {
      return 42
    }
  }
}
```

Works across all languages - universal complexity check.

## Creating Custom Rules

### Rule Structure

```typescript
import type { Rule } from '@sylphx/synth-lint'

const myRule: Rule = {
  name: 'my-rule',
  description: 'Description of what the rule checks',
  severity: 'warning',  // 'error' | 'warning' | 'info' | 'hint'
  enabled: true,

  // Optional: Restrict to specific languages
  languages: ['javascript', 'typescript'],

  // Optional: Only check specific node types
  nodeTypes: ['FunctionDeclaration', 'ClassDeclaration'],

  create(context) {
    return {
      // Called when entering any node
      enter(node) {
        // Check and report
      },

      // Called when leaving any node
      leave(node) {
        // Cleanup or final checks
      },

      // Called for specific node types
      FunctionDeclaration(node) {
        // Type-specific logic
      }
    }
  }
}
```

### Example: No TODO Comments

```typescript
const noTodoComments: Rule = {
  name: 'no-todo-comments',
  description: 'Disallow TODO comments',
  severity: 'warning',
  enabled: true,

  create(context) {
    return {
      enter(node) {
        // Get source text
        const source = context.getSource(node)

        // Check for TODO
        if (source.includes('TODO') || source.includes('FIXME')) {
          context.report({
            severity: 'warning',
            message: 'TODO comment found',
            range: node.span,
            nodeId: node.id
          })
        }
      }
    }
  }
}
```

### Example: No Magic Numbers

```typescript
const noMagicNumbers: Rule = {
  name: 'no-magic-numbers',
  description: 'Disallow magic numbers',
  severity: 'warning',
  enabled: true,
  languages: ['javascript', 'typescript'],

  create(context) {
    return {
      NumericLiteral(node) {
        const value = node.data.value

        // Allow 0, 1, -1
        if (value === 0 || value === 1 || value === -1) return

        context.report({
          severity: 'warning',
          message: `Magic number ${value} should be a named constant`,
          range: node.span,
          nodeId: node.id
        })
      }
    }
  }
}
```

### Example: Enforce Naming Convention

```typescript
const camelCaseVars: Rule = {
  name: 'camelcase-vars',
  description: 'Enforce camelCase variable names',
  severity: 'error',
  enabled: true,
  languages: ['javascript', 'typescript'],

  create(context) {
    return {
      VariableDeclarator(node) {
        const name = node.data.id?.name
        if (!name) return

        // Check if camelCase
        const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(name)

        if (!isCamelCase) {
          context.report({
            severity: 'error',
            message: `Variable '${name}' is not in camelCase`,
            range: node.span,
            nodeId: node.id
          })
        }
      }
    }
  }
}
```

## Configuration

### Basic Configuration

```typescript
linter.configure({
  // Enable/disable rules
  rules: {
    'no-empty-blocks': true,
    'no-console': false,
    'max-depth': 'error'
  }
})
```

### Severity Levels

```typescript
linter.configure({
  rules: {
    'no-empty-blocks': 'error',   // Fail on this
    'no-console': 'warning',      // Warn about this
    'max-depth': 'info',          // Informational
    'my-rule': 'hint'             // Just a hint
  }
})
```

### Severity Filtering

```typescript
linter.configure({
  severity: 'warning'  // Only show warnings and errors (filters out info and hint)
})
```

### Language Filtering

```typescript
linter.configure({
  languages: ['javascript', 'typescript']  // Only lint JS/TS files
})
```

## Context API

Rules receive a `RuleContext` object with helper methods:

```typescript
interface RuleContext {
  // The AST tree
  tree: Tree

  // Report a diagnostic
  report(diagnostic: Diagnostic): void

  // Get a node by ID
  getNode(id: NodeId): Node | undefined

  // Get parent node
  getParent(id: NodeId): Node | undefined

  // Get children nodes
  getChildren(id: NodeId): Node[]

  // Get source text for a node
  getSource(node: Node): string

  // Get source text for a range
  getSourceRange(range: Range): string
}
```

### Example Using Context

```typescript
const myRule: Rule = {
  name: 'no-nested-ternary',
  description: 'Disallow nested ternary expressions',
  severity: 'warning',

  create(context) {
    return {
      ConditionalExpression(node) {
        // Check if parent is also a ternary
        const parent = context.getParent(node.id)
        if (parent && parent.type === 'ConditionalExpression') {
          context.report({
            severity: 'warning',
            message: 'Nested ternary expressions are hard to read',
            range: node.span
          })
        }
      }
    }
  }
}
```

## Lint Result

```typescript
interface LintResult {
  diagnostics: Diagnostic[]
  counts: {
    error: number
    warning: number
    info: number
    hint: number
  }
  success: boolean  // true if no errors
}
```

### Example

```typescript
const result = linter.lint(tree)

console.log(`Found ${result.diagnostics.length} issues`)
console.log(`Errors: ${result.counts.error}`)
console.log(`Warnings: ${result.counts.warning}`)

if (!result.success) {
  process.exit(1)
}

// Print diagnostics
for (const diagnostic of result.diagnostics) {
  console.log(`[${diagnostic.severity}] ${diagnostic.rule}: ${diagnostic.message}`)
  if (diagnostic.range) {
    console.log(`  at line ${diagnostic.range.start.line}, column ${diagnostic.range.start.column}`)
  }
}
```

## Universal Linting

The power of `@sylphx/synth-lint` is that rules work across **all languages**:

```typescript
import { createLinter, noEmptyBlocks, maxDepth } from '@sylphx/synth-lint'
import { parse as parseJS } from '@sylphx/synth-js'
import { parse as parsePy } from '@sylphx/synth-python'
import { parse as parseGo } from '@sylphx/synth-go'

const linter = createLinter()
linter.addRules([noEmptyBlocks, maxDepth])

// Same rules work on JavaScript
const jsTree = parseJS('function test() {}')
linter.lint(jsTree)

// Same rules work on Python
const pyTree = parsePy('def test(): pass')
linter.lint(pyTree)

// Same rules work on Go
const goTree = parseGo('func test() {}')
linter.lint(goTree)
```

## Use Cases

- **Code quality enforcement** - Consistent rules across your entire codebase
- **Multi-language projects** - One linter configuration for JS, Python, Go, etc.
- **Custom style guides** - Define your team's coding standards
- **CI/CD integration** - Fail builds on lint errors
- **Editor integration** - Real-time feedback while coding
- **Migration tools** - Detect patterns during code migrations

## Examples

### CI/CD Integration

```typescript
import { createLinter, builtinRules } from '@sylphx/synth-lint'
import { parse } from '@sylphx/synth-js'
import { readFileSync } from 'fs'

const source = readFileSync('src/index.js', 'utf-8')
const tree = parse(source)

const linter = createLinter()
linter.addRules(builtinRules)
linter.configure({
  rules: {
    'no-empty-blocks': 'error',
    'no-console': 'error'
  }
})

const result = linter.lint(tree)

if (!result.success) {
  console.error('Linting failed!')
  for (const diagnostic of result.diagnostics) {
    console.error(`  ${diagnostic.message}`)
  }
  process.exit(1)
}
```

### Custom Rule Set

```typescript
const teamRules = [
  noEmptyBlocks,
  noConsole,
  maxDepth,
  myCustomRule1,
  myCustomRule2
]

const linter = createLinter({
  rules: {
    'no-empty-blocks': 'error',
    'no-console': 'warning',
    'max-depth': 'warning',
    'my-custom-rule-1': 'error',
    'my-custom-rule-2': 'info'
  }
})

linter.addRules(teamRules)
```

## Performance

Leverages Synth's performance-optimized AST:
- Fast traversal using arena-based storage
- O(1) node access
- Efficient visitor pattern
- Minimal memory overhead

## License

MIT

---

**Note:** This is a universal linter framework. Rules work across all languages supported by Synth parsers.
