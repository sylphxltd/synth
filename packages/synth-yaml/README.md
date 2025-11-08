# @sylphx/synth-yaml

YAML parser using Synth's universal AST - converts YAML configuration files to queryable AST.

## Features

- **YAML 1.2 Compliant**: Full YAML specification support
- **Universal AST**: Converts YAML to Synth's language-agnostic BaseNode
- **Position Tracking**: Range information for all nodes
- **Plugin Support**: Transform and analyze YAML using Synth plugins
- **Real-World Ready**: Handles GitHub Actions, Docker Compose, Kubernetes configs
- **Fast**: Built on the battle-tested `yaml` library
- **TypeScript**: Full type safety and IntelliSense

## Installation

```bash
bun install @sylphx/synth-yaml
```

## Usage

### Basic Parsing

```typescript
import { parse } from '@sylphx/synth-yaml'

const yaml = `
name: my-app
version: 1.0.0
`

const tree = parse(yaml)

// Tree contains Synth AST nodes
console.log(tree.nodes.filter(n => n.type === 'Map'))
console.log(tree.nodes.filter(n => n.type === 'Pair'))
console.log(tree.nodes.filter(n => n.type === 'String'))
```

### Parse All YAML Types

```typescript
import { parse } from '@sylphx/synth-yaml'

// Maps (objects)
parse('name: Alice\nage: 30')

// Sequences (arrays)
parse('- item1\n- item2\n- item3')
parse('[1, 2, 3]')

// Strings
parse('hello')
parse('"quoted string"')
parse('|\n  multiline\n  string')

// Numbers
parse('42')
parse('3.14')
parse('1.5e10')

// Booleans
parse('true')
parse('false')

// Null
parse('null')
parse('~')
```

### Real-World Configs

```typescript
import { parse } from '@sylphx/synth-yaml'

// GitHub Actions
const workflow = `
name: CI
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test
`

const tree = parse(workflow)

// Docker Compose
const compose = `
version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
`

const tree2 = parse(compose)

// Kubernetes
const k8s = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
`

const tree3 = parse(k8s)
```

### Extract Data

```typescript
import { parse } from '@sylphx/synth-yaml'

const yaml = `
database:
  host: localhost
  port: 5432
users:
  - name: Alice
  - name: Bob
`

const tree = parse(yaml)

// Find all string values
const strings = tree.nodes
  .filter(n => n.type === 'String')
  .map(n => n.data?.value)

console.log(strings) // ["database", "host", "localhost", "port", ...]

// Find all pairs (key-value)
const pairs = tree.nodes
  .filter(n => n.type === 'Pair')
  .map(n => n.data?.key)

console.log(pairs) // ["database", "host", "port", "users", "name", "name"]
```

### With Options

```typescript
import { parse } from '@sylphx/synth-yaml'

const yaml = `
defaults: &defaults
  timeout: 30

production:
  <<: *defaults
  timeout: 60
`

// Enable merge keys
const tree = parse(yaml, {
  merge: true
})
```

### Using Parser Class

```typescript
import { YAMLParser } from '@sylphx/synth-yaml'

const parser = new YAMLParser()

// Parse multiple documents
const tree1 = parser.parse('name: Alice')
const tree2 = parser.parse('items:\n  - a\n  - b')

// Get last parsed tree
const lastTree = parser.getTree()
```

### Async Parsing

```typescript
import { parseAsync } from '@sylphx/synth-yaml'

const yaml = `
users:
  - name: Alice
    age: 30
`

const tree = await parseAsync(yaml)
```

## AST Node Types

The YAML parser generates these node types:

```typescript
type YAMLNodeType =
  | 'Map'       // YAML mapping (object)
  | 'Sequence'  // YAML sequence (array)
  | 'Pair'      // Key-value pair in map
  | 'String'    // String scalar
  | 'Number'    // Number scalar
  | 'Boolean'   // Boolean scalar
  | 'Null'      // Null value
```

### Node Structure

**Map Node:**
```typescript
{
  type: 'Map',
  children: [/* Pair node IDs */],
  data: {}
}
```

**Sequence Node:**
```typescript
{
  type: 'Sequence',
  children: [/* Value node IDs */],
  data: {}
}
```

**Pair Node:**
```typescript
{
  type: 'Pair',
  children: [/* Value node ID */],
  data: {
    key: string  // The key name
  }
}
```

**Scalar Nodes:**
```typescript
// String
{
  type: 'String',
  children: [],
  data: { value: string }
}

// Number
{
  type: 'Number',
  children: [],
  data: { value: number }
}

// Boolean
{
  type: 'Boolean',
  children: [],
  data: { value: boolean }
}

// Null
{
  type: 'Null',
  children: [],
  data: { value: null }
}
```

## Options

```typescript
interface YAMLParseOptions {
  /** Build query index for AST (default: false) */
  buildIndex?: boolean

  /** Plugins to apply during parsing */
  plugins?: Plugin[]

  /** Merge keys (default: false) */
  merge?: boolean

  /** Schema to use (default: 'core') */
  schema?: 'core' | 'failsafe' | 'json' | 'yaml-1.1'
}
```

## Examples

### GitHub Actions Workflow

```typescript
import { parse } from '@sylphx/synth-yaml'

const workflow = `
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
`

const tree = parse(workflow)

// Find the job name
const jobPairs = tree.nodes.filter(n =>
  n.type === 'Pair' && n.data?.key === 'build'
)
```

### Docker Compose

```typescript
import { parse } from '@sylphx/synth-yaml'

const compose = `
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html

  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: secret
`

const tree = parse(compose)

// Find all service names
const serviceMap = tree.nodes.find(n =>
  n.type === 'Pair' && n.data?.key === 'services'
)

if (serviceMap) {
  const servicesNode = tree.nodes[serviceMap.children[0]!]
  const services = servicesNode?.children.map(id =>
    tree.nodes[id]!.data?.key
  )
  console.log(services) // ["web", "db"]
}
```

### Kubernetes Config

```typescript
import { parse } from '@sylphx/synth-yaml'

const k8s = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80
`

const tree = parse(k8s)

// Find the pod kind
const kindPair = tree.nodes.find(n =>
  n.type === 'Pair' && n.data?.key === 'kind'
)

if (kindPair) {
  const valueNode = tree.nodes[kindPair.children[0]!]
  console.log(valueNode?.data?.value) // "Pod"
}
```

### Config Validation

```typescript
import { parse } from '@sylphx/synth-yaml'

function validateConfig(yaml: string): boolean {
  try {
    const tree = parse(yaml)

    // Check for required keys
    const pairs = tree.nodes.filter(n => n.type === 'Pair')
    const keys = pairs.map(p => p.data?.key)

    const required = ['database', 'port']
    return required.every(key => keys.includes(key))
  } catch (error) {
    console.error('Invalid YAML:', error.message)
    return false
  }
}
```

## API Reference

### Functions

- `parse(source, options?)`: Parse YAML string synchronously
- `parseAsync(source, options?)`: Parse YAML string asynchronously
- `createParser()`: Create a new YAMLParser instance

### Classes

- `YAMLParser`: Main parser class
  - `constructor()`: Create parser instance
  - `parse(source, options?)`: Parse YAML string
  - `parseAsync(source, options?)`: Parse YAML string asynchronously
  - `getTree()`: Get last parsed tree
  - `use(plugin)`: Register a plugin

## Supported YAML Features

- ✅ Scalars (strings, numbers, booleans, null)
- ✅ Sequences (arrays, both flow and block style)
- ✅ Mappings (objects, both flow and block style)
- ✅ Nested structures
- ✅ Multiline strings (literal `|` and folded `>`)
- ✅ Quoted strings (single and double)
- ✅ Comments
- ✅ Anchors and aliases (`&anchor`, `*alias`)
- ✅ Merge keys (`<<: *anchor`)
- ✅ Explicit types (`!!int`, `!!str`)
- ✅ Special values (`~`, `null`, `true`, `false`)

## How It Works

1. **Parse**: YAML string → `yaml` library → Document AST
2. **Convert**: Document AST → Synth BaseNode universal format
3. **Use**: Query, transform, and analyze using Synth tools

The parser works with the `yaml` library:
- **Fast**: Leverages battle-tested YAML parser
- **Spec-compliant**: Full YAML 1.2 support
- **Universal**: Converts to Synth's language-agnostic format

## Why YAML in Universal AST?

YAML joins HTML, JavaScript, and JSON in proving Synth's universal AST works across:

- **Markup** (HTML)
- **Code** (JavaScript)
- **Data** (JSON, YAML)
- **Config** (YAML)

Same AST structure, same tools, different languages.

## Use Cases

- **Config Analysis**: Parse and validate YAML configs
- **CI/CD**: Analyze GitHub Actions, GitLab CI workflows
- **Infrastructure**: Parse Docker Compose, Kubernetes manifests
- **Code Generation**: Generate code from YAML schemas
- **Validation**: Custom YAML validation rules
- **Transformation**: Transform YAML using Synth plugins
- **Documentation**: Extract documentation from YAML comments

## Comparison with yaml library

**yaml library:**
- Parses YAML → JavaScript objects
- No AST access
- No position tracking
- No extensibility

**@sylphx/synth-yaml:**
- Parses YAML → Synth universal AST
- Full access to parse tree structure
- Position information for every node
- Plugin system for transformations
- Works with other Synth tools

## License

MIT
