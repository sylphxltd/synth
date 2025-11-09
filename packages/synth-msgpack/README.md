# @sylphx/synth-msgpack

MessagePack binary format parser using Synth's universal AST. Conversion layer over @msgpack/msgpack.

## Features

- ✅ **Official Parser** - Uses @msgpack/msgpack (official MessagePack implementation)
- 🚀 **Full MessagePack Support** - All data types, binary data, extension types
- 🎯 **Universal AST** - Converts MessagePack to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Production Ready** - @msgpack/msgpack is the official JavaScript implementation

## Installation

```bash
npm install @sylphx/synth-msgpack
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-msgpack'
import { encode } from '@msgpack/msgpack'

const data = encode({
  user: {
    id: 12345,
    name: 'Alice',
    active: true,
    tags: ['admin', 'developer']
  }
})

const tree = parse(data)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { MsgPackParser, createParser, parse, parseAsync } from '@sylphx/synth-msgpack'

// Standalone function (recommended)
const tree = parse(msgpackData)

// Async parsing (for plugins)
const tree = await parseAsync(msgpackData)

// Class instance
const parser = new MsgPackParser()
const tree = parser.parse(msgpackData)

// Factory function
const parser = createParser()
const tree = parser.parse(msgpackData)

// Parse ArrayBuffer
const arrayBuffer = msgpackData.buffer
const tree = parse(arrayBuffer)
```

### Plugin System

```typescript
import { parse, type Tree } from '@sylphx/synth-msgpack'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse(msgpackData, { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync(msgpackData, { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by decoding MessagePack binary data. Each node includes:

### Node Structure

```typescript
{
  type: 'MsgPackNull' | 'MsgPackBoolean' | 'MsgPackNumber' | 'MsgPackString' | ...,
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    // Node-specific data
  }
}
```

## Supported MessagePack Types

### Primitive Types
- ✅ Null
- ✅ Boolean (true/false)
- ✅ Numbers (integers, floats)
- ✅ Strings (UTF-8)
- ✅ Binary data (Uint8Array)

### Collection Types
- ✅ Arrays
- ✅ Maps/Objects
- ✅ Nested structures

### Extension Types
- ✅ Extension type support
- ✅ Custom data types

## Examples

### Null and Boolean

```typescript
import { parse } from '@sylphx/synth-msgpack'
import { encode } from '@msgpack/msgpack'

const nullData = encode(null)
const tree = parse(nullData)
// → MsgPackNull node

const boolData = encode(true)
const tree = parse(boolData)
// → MsgPackBoolean node with value: true
```

### Numbers

```typescript
const intData = encode(42)
const tree = parse(intData)
// → MsgPackNumber node with value: 42

const floatData = encode(3.14)
const tree = parse(floatData)
// → MsgPackNumber node with value: 3.14

const negativeData = encode(-100)
const tree = parse(negativeData)
// → MsgPackNumber node with value: -100
```

### Strings

```typescript
const stringData = encode('Hello, MessagePack!')
const tree = parse(stringData)
// → MsgPackString node with value: "Hello, MessagePack!"

// Unicode support
const unicodeData = encode('Hello 世界 🌍')
const tree = parse(unicodeData)
// → MsgPackString node with full unicode support
```

### Binary Data

```typescript
const binary = new Uint8Array([0x01, 0x02, 0x03, 0xff])
const data = encode(binary)
const tree = parse(data)
// → MsgPackBinary node with hex representation: "010203ff"
```

### Arrays

```typescript
const arrayData = encode([1, 2, 3, 4, 5])
const tree = parse(arrayData)
// → MsgPackArray node with 5 MsgPackNumber children

// Mixed types
const mixedData = encode([1, 'two', true, null])
const tree = parse(mixedData)
// → MsgPackArray with Number, String, Boolean, Null children

// Nested arrays
const nestedData = encode([[1, 2], [3, 4]])
const tree = parse(nestedData)
// → MsgPackArray with nested MsgPackArray children
```

### Maps/Objects

```typescript
const objData = encode({
  name: 'Alice',
  age: 30,
  active: true
})
const tree = parse(objData)
// → MsgPackMap node with 3 children (name, age, active)

// Nested objects
const nestedData = encode({
  user: {
    name: 'Bob',
    profile: {
      email: 'bob@example.com'
    }
  }
})
const tree = parse(nestedData)
// → MsgPackMap with nested structure
```

### Real-World User Data

```typescript
const userData = encode({
  id: 12345,
  username: 'alice_smith',
  email: 'alice@example.com',
  active: true,
  profile: {
    firstName: 'Alice',
    lastName: 'Smith',
    age: 28,
    interests: ['coding', 'music', 'travel']
  },
  settings: {
    notifications: true,
    theme: 'dark'
  }
})

const tree = parse(userData)
// → Complete nested structure in universal AST
```

### API Response

```typescript
const response = encode({
  success: true,
  data: [
    { id: 1, name: 'Product 1', price: 29.99 },
    { id: 2, name: 'Product 2', price: 49.99 },
    { id: 3, name: 'Product 3', price: 19.99 }
  ],
  meta: {
    total: 3,
    page: 1,
    perPage: 10
  }
})

const tree = parse(response)
```

### Time Series Data

```typescript
const timeSeriesData = encode({
  sensor_id: 'temp_001',
  readings: [
    { timestamp: 1234567890, value: 23.5 },
    { timestamp: 1234567900, value: 23.7 },
    { timestamp: 1234567910, value: 23.6 }
  ],
  metadata: {
    unit: 'celsius',
    location: 'room_a'
  }
})

const tree = parse(timeSeriesData)
```

### Gaming State

```typescript
const gameState = encode({
  player: {
    id: 'player123',
    name: 'Hero',
    level: 15,
    health: 100,
    mana: 50,
    position: { x: 120.5, y: 45.3, z: 0.0 },
    inventory: ['sword', 'potion', 'key']
  },
  enemies: [
    { id: 'enemy1', type: 'goblin', health: 30 },
    { id: 'enemy2', type: 'orc', health: 50 }
  ]
})

const tree = parse(gameState)
```

### Configuration Data

```typescript
const config = encode({
  server: {
    host: '0.0.0.0',
    port: 8080,
    tls: true
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp',
    pool: {
      min: 2,
      max: 10
    }
  },
  features: {
    auth: true,
    logging: true,
    caching: false
  }
})

const tree = parse(config)
```

### Empty Collections

```typescript
// Empty object
const emptyObj = encode({})
const tree = parse(emptyObj)
// → MsgPackMap node with size: 0, children: []

// Empty array
const emptyArray = encode([])
const tree = parse(emptyArray)
// → MsgPackArray node with length: 0, children: []
```

### Large Numbers

```typescript
const largeNum = encode(Number.MAX_SAFE_INTEGER)
const tree = parse(largeNum)
// → MsgPackNumber node with value: 9007199254740991
```

### Deeply Nested

```typescript
const deepData = encode({
  level1: {
    level2: {
      level3: {
        level4: {
          value: 'deep'
        }
      }
    }
  }
})

const tree = parse(deepData)
// → Fully nested MsgPackMap structure
```

## Performance

Leverages @msgpack/msgpack's performance:
- Fast binary decoding
- Efficient memory usage
- Optimized for production use
- Official MessagePack implementation

## Development Philosophy

This package uses a **strategic dependency** approach:

- **Third-party parser:** @msgpack/msgpack (official MessagePack implementation)
- **Our conversion layer:** MessagePack binary → Synth universal AST
- **Our value:** Universal format, cross-language tools, plugin system

### Why @msgpack/msgpack?

- ❌ Writing MessagePack decoder: 100+ hours, complex binary protocol, edge cases
- ✅ Using @msgpack/msgpack: Official implementation, battle-tested, spec-compliant
- **Our focus:** Universal AST format, transformations, cross-language operations

## Use Cases

- **Binary data analysis:** Analyze MessagePack encoded data
- **Protocol inspection:** Inspect binary protocols using MessagePack
- **Data transformation:** Transform binary data structures
- **Schema inference:** Infer schemas from MessagePack data
- **Debugging:** Debug MessagePack-encoded messages
- **Validation:** Validate MessagePack data structures
- **Cross-language tools:** Analyze MessagePack + other formats together

## Parser Options

```typescript
interface MsgPackParseOptions {
  // Plugin system
  plugins?: Plugin[]
}
```

## Node Types

The parser recognizes these node types:

- `MsgPackNull` - Null value
- `MsgPackBoolean` - Boolean value (true/false)
- `MsgPackNumber` - Number (integer or float)
- `MsgPackString` - String (UTF-8)
- `MsgPackBinary` - Binary data (Uint8Array as hex string)
- `MsgPackArray` - Array/list
- `MsgPackMap` - Map/object
- `MsgPackExtension` - Extension type
- `MsgPackUnknown` - Unknown/unsupported type

Each node preserves:
- Original value (for primitives)
- Collection size (for arrays/maps)
- Binary length and hex representation
- Key names for map entries

## Binary Format

MessagePack is a binary serialization format that is:
- **Compact** - More space-efficient than JSON
- **Fast** - Faster encoding/decoding than JSON
- **Type-aware** - Preserves types (unlike JSON)
- **Binary-safe** - Can encode binary data directly

## License

MIT

---

**Note:** This package uses @msgpack/msgpack for decoding. See [@msgpack/msgpack](https://github.com/msgpack/msgpack-javascript) for implementation details.
