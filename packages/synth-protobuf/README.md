# @sylphx/synth-protobuf

Protocol Buffers (.proto) parser using Synth's universal AST. Conversion layer over protobufjs.

## Features

- ✅ **Official Parser** - Uses protobufjs (most widely used Protocol Buffers implementation)
- 🚀 **Full Proto Support** - Messages, Enums, Services, Oneofs, Nested Types
- 🎯 **Universal AST** - Converts Protocol Buffers to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Production Ready** - protobufjs powers gRPC, Google APIs, and more

## Installation

```bash
npm install @sylphx/synth-protobuf
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-protobuf'

const proto = `
syntax = "proto3";

message User {
  int32 id = 1;
  string email = 2;
  string name = 3;
}

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}
`

const tree = parse(proto)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { ProtobufParser, createParser, parse, parseAsync } from '@sylphx/synth-protobuf'

// Standalone function (recommended)
const tree = parse(protoSource)

// Async parsing (for plugins)
const tree = await parseAsync(protoSource)

// Class instance
const parser = new ProtobufParser()
const tree = parser.parse(protoSource)

// Factory function
const parser = createParser()
const tree = parser.parse(protoSource)
```

### Plugin System

```typescript
import { parse, type Tree } from '@sylphx/synth-protobuf'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse(protoSource, { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync(protoSource, { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting protobufjs's parsed structure. Each node includes:

### Node Structure

```typescript
{
  type: 'ProtoRoot' | 'ProtoMessage' | 'ProtoField' | 'ProtoEnum' | ...,
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

## Supported Protocol Buffers Features

### Messages
- ✅ Message definitions
- ✅ Field types (scalar, message, enum)
- ✅ Field numbers
- ✅ Field rules (required, optional, repeated)
- ✅ Nested messages
- ✅ Map fields
- ✅ Oneof groups

### Enums
- ✅ Enum definitions
- ✅ Enum values
- ✅ Nested enums

### Services
- ✅ Service definitions
- ✅ RPC methods
- ✅ Request/response types
- ✅ Streaming (client, server, bidirectional)

### Other Features
- ✅ Proto2 and Proto3 syntax
- ✅ Packages (namespaces)
- ✅ Imports
- ✅ Options and metadata

## Examples

### Basic Message

```typescript
const proto = `
syntax = "proto3";

message Person {
  string name = 1;
  int32 age = 2;
  string email = 3;
}
`

const tree = parse(proto)
```

### Message with Nested Types

```typescript
const proto = `
syntax = "proto3";

message User {
  int32 id = 1;
  string email = 2;

  message Address {
    string street = 1;
    string city = 2;
    string state = 3;
  }

  Address address = 3;
}
`

const tree = parse(proto)
```

### Enum Definition

```typescript
const proto = `
syntax = "proto3";

enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
  INACTIVE = 2;
  DELETED = 3;
}

message User {
  int32 id = 1;
  Status status = 2;
}
`

const tree = parse(proto)
```

### Service with RPC Methods

```typescript
const proto = `
syntax = "proto3";

message GetUserRequest {
  int32 id = 1;
}

message User {
  int32 id = 1;
  string email = 2;
  string name = 3;
}

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser (CreateUserRequest) returns (User);
}
`

const tree = parse(proto)
```

### Repeated Fields

```typescript
const proto = `
syntax = "proto3";

message Post {
  int32 id = 1;
  string title = 2;
  repeated string tags = 3;
  repeated Comment comments = 4;
}

message Comment {
  int32 id = 1;
  string text = 2;
}
`

const tree = parse(proto)
```

### Oneof Groups

```typescript
const proto = `
syntax = "proto3";

message Payload {
  oneof data {
    string text = 1;
    bytes binary = 2;
    int32 number = 3;
  }
}
`

const tree = parse(proto)
```

### Streaming RPC

```typescript
const proto = `
syntax = "proto3";

message ChatMessage {
  string user = 1;
  string message = 2;
}

service ChatService {
  // Server streaming
  rpc Subscribe (SubscribeRequest) returns (stream ChatMessage);

  // Client streaming
  rpc Upload (stream ChatMessage) returns (UploadResponse);

  // Bidirectional streaming
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}
`

const tree = parse(proto)
```

### Real-World E-Commerce Schema

```typescript
const proto = `
syntax = "proto3";

enum OrderStatus {
  PENDING = 0;
  CONFIRMED = 1;
  SHIPPED = 2;
  DELIVERED = 3;
  CANCELLED = 4;
}

message Product {
  int32 id = 1;
  string name = 2;
  string description = 3;
  double price = 4;
  int32 stock = 5;
}

message OrderItem {
  Product product = 1;
  int32 quantity = 2;
  double subtotal = 3;
}

message Address {
  string street = 1;
  string city = 2;
  string state = 3;
  string zip = 4;
  string country = 5;
}

message Order {
  int32 id = 1;
  int32 user_id = 2;
  repeated OrderItem items = 3;
  OrderStatus status = 4;
  Address shipping_address = 5;
  Address billing_address = 6;
  double total = 7;
  int64 created_at = 8;
}

message CreateOrderRequest {
  int32 user_id = 1;
  repeated OrderItem items = 2;
  Address shipping_address = 3;
  Address billing_address = 4;
}

message CreateOrderResponse {
  Order order = 1;
  string message = 2;
}

service OrderService {
  rpc CreateOrder (CreateOrderRequest) returns (CreateOrderResponse);
  rpc GetOrder (GetOrderRequest) returns (Order);
  rpc ListOrders (ListOrdersRequest) returns (ListOrdersResponse);
  rpc UpdateOrderStatus (UpdateOrderStatusRequest) returns (Order);
}
`

const tree = parse(proto)
```

### Map Fields

```typescript
const proto = `
syntax = "proto3";

message User {
  int32 id = 1;
  string name = 2;
  map<string, string> metadata = 3;
  map<string, int32> scores = 4;
}
`

const tree = parse(proto)
```

### Proto2 Syntax

```typescript
const proto = `
syntax = "proto2";

message Person {
  required string name = 1;
  required int32 age = 2;
  optional string email = 3;
}
`

const tree = parse(proto)
```

### With Package

```typescript
const proto = `
syntax = "proto3";

package example.v1;

message User {
  int32 id = 1;
  string email = 2;
}

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}
`

const tree = parse(proto)
```

### With Imports

```typescript
const proto = `
syntax = "proto3";

import "google/protobuf/timestamp.proto";

message Event {
  int32 id = 1;
  string name = 2;
  google.protobuf.Timestamp created_at = 3;
}
`

const tree = parse(proto)
```

## Performance

Leverages protobufjs's proven performance:
- Fast parsing of Protocol Buffers schemas
- Optimized for production use
- Powers gRPC, Google APIs, Buf, and more
- Efficient AST generation

## Development Philosophy

This package uses a **strategic dependency** approach:

- **Third-party parser:** protobufjs (industry-standard Protocol Buffers implementation)
- **Our conversion layer:** protobufjs structure → Synth universal AST
- **Our value:** Universal format, cross-language tools, plugin system

### Why protobufjs?

- ❌ Writing Protocol Buffers parser: 200+ hours, complex binary format, constant updates
- ✅ Using protobufjs: Industry standard, 7M+ weekly downloads, battle-tested
- **Our focus:** Universal AST format, transformations, cross-language operations

## Use Cases

- **API analysis:** Analyze gRPC service definitions
- **Code generation:** Generate code from .proto schemas
- **Schema validation:** Validate Protocol Buffers schemas
- **Documentation:** Extract API documentation from services
- **Migration tools:** Migrate proto2 to proto3
- **Static analysis:** Service complexity, breaking changes detection
- **Cross-language tools:** Analyze Protocol Buffers + TypeScript/Go/Rust together

## Parser Options

```typescript
interface ProtobufParseOptions {
  // Plugin system
  plugins?: Plugin[]
}
```

## Node Types

The parser recognizes these node types:

- `ProtoRoot` - Root node containing all definitions
- `ProtoMessage` - Message definition
- `ProtoField` - Message field
- `ProtoEnum` - Enum definition
- `ProtoEnumValue` - Enum value
- `ProtoService` - Service definition
- `ProtoMethod` - RPC method
- `ProtoOneof` - Oneof group
- `ProtoNamespace` - Package/namespace

Each node preserves:
- Field types and numbers
- Field rules (required, optional, repeated)
- Service methods and streaming flags
- Enum values
- All metadata and options

## License

MIT

---

**Note:** This package uses protobufjs for parsing. See [protobufjs](https://github.com/protobufjs/protobuf.js) for parser details.
